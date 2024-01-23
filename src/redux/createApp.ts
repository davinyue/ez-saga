import { legacy_createStore as createStore, applyMiddleware, compose, Action as ReduxAction, Store } from 'redux';
import { createSlice, combineReducers } from '@reduxjs/toolkit';
import createSagaMiddleware, { Action, SagaMiddleware } from 'redux-saga';
import { PutEffect, SelectEffect } from 'redux-saga/effects';
import { call, put, select, takeEvery, putResolve } from 'redux-saga/effects';
import win from 'global/window';
import { Reducer, AnyAction } from 'redux';

const saveState: Reducer<any, AnyAction> = (state: any, action: AnyAction) => {
  if (!action.payload) {
    return state;
  }
  let newStat = {
    ...state,
    ...action.payload
  };
  return newStat;
}

/** payload action类型 */
export interface PayloadAction extends Action<string>, ReduxAction<string> {
  payload: any
}

/** 工具 */
export interface EffectTool {
  call: (...args: any[]) => any,
  put: <A extends Action>(action: Action) => PutEffect<A>,
  select: (selectFunc: (state: any) => any) => SelectEffect
}

/** Effect函数类型 */
export interface Effect {
  (action: PayloadAction, tool: EffectTool): Generator;
}

/** ModelReducer定义 */
export interface ModelReducer {
  [key: string]: Reducer<any, AnyAction>;
}


/** ModelEffect定义 */
export interface ModelEffect {
  [key: string]: Effect;
}

export interface ReduxModel {
  name: string,
  state?: any;
  reducers?: ModelReducer
  effects?: ModelEffect;
}

interface ReduxSagaModel extends ReduxModel {
  initialState: any,
  reducers: ModelReducer
}

export interface RegistedModel {
  [key: string]: ReduxModel;
}

/** app */
export interface ReduxApp {
  store: Store<any, ReduxAction>,
  sagaMiddleware: SagaMiddleware<object>;
  regist: (model: ReduxModel) => void
}

/** 
 * 创建中间层
 * @param registedModel 已注册model
 */
function createPromiseMiddleware(registedModel: RegistedModel) {
  function isEffect(type: string) {
    if (!type || typeof type !== 'string') return false;
    const [modelName, effect] = type.split('/');
    const model = registedModel[modelName];
    if (model) {
      if (model.effects && model.effects[effect]) {
        return true;
      }
    }
    return false;
  }

  return () => (next: (arg: any) => any) => (action: ReduxAction) => {
    const { type } = action;
    if (isEffect(type)) {
      return new Promise((resolve, reject) => {
        next({
          _dy_resolve: resolve,
          _dy_reject: reject,
          ...action,
        });
      });
    } else {
      return next(action);
    }
  };
}


/** 
 * 获取注册model函数
 * @param store redux store
 * @param registedModel 已注册model, 对象, 属性为model名称, value为model
 * @param allReducers 所有的reducers
 * @param sagaMiddleware saga中间件
 * @returns 返回function regist(model)
 */
function getRegistModelFunc(store: Store<any, ReduxAction>, registedModel: RegistedModel,
  allReducers: { [x: string]: Reducer<any, AnyAction>; },
  sagaMiddleware: SagaMiddleware<object>): (model: ReduxModel) => void {
  /** model函数注册函数
   * @param model 模块, 其格式为
   * {
   *    name: 'name',
   *    state: {},
   *    reducers: {},
   *    effects: {}
   * }
   */
  return function regist(reduxModel: ReduxModel): void {
    const model = {
      ...reduxModel,
      initialState: {}
    } as ReduxSagaModel;
    if (registedModel[model.name]) {
      return;
    }
    if (!model.state) {
      model.state = {};
    }
    model.initialState = model.state;
    if (!model.reducers) {
      model.reducers = {};
    }
    if (!model.reducers.saveState) {
      model.reducers.saveState = saveState;
    }
    if (!model.effects) {
      model.effects = {};
    }
    const modelSlice = createSlice(model);
    const reducer = modelSlice.reducer;
    allReducers[model.name] = reducer;
    registedModel[model.name] = model;
    //获得一个新的reducer, 将所有的reducer整合成一个
    let newReducer = combineReducers(allReducers);
    store.replaceReducer(newReducer);
    //注册effects
    for (let effect in model.effects) {
      let type: string = `${model.name}/${effect}`;
      let execFun = model.effects[effect];
      function* loading(opFun: any, action: any) {
        // 开始异步任务设置loading状态
        yield putResolve({ type: `${model.name}/saveState`, payload: { loading: true } });
        let ret = yield call(execFun, action, opFun);
        // 结束异步任务关闭loading状态
        yield putResolve({ type: `${model.name}/saveState`, payload: { loading: false } });
        if (action._dy_resolve) {
          action._dy_resolve(ret);
        }
      }

      function* runEffect() {
        //yield takeLatest(type, loading, { call, put, putResolve, select });
        yield takeEvery(type, loading, { call, put, putResolve, select });
      }

      sagaMiddleware.run(runEffect);
    }
  };
}


/** 创建store */
export default function create(): ReduxApp {
  //已经注册的reducer, key是名字, value是reducer
  const allReducers = {};
  //已注册model
  const registedModel: RegistedModel = {};

  const sagaMiddleware = createSagaMiddleware();

  const promiseMiddleware = createPromiseMiddleware(registedModel);

  const middlewares = [
    promiseMiddleware,
    sagaMiddleware
  ];

  // eslint-disable-next-line no-undef
  const composeEnhancers = process.env.NODE_ENV !== 'production'
    && win.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
    win.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, maxAge: 30 }) : compose;

  const enhancers = [applyMiddleware(...middlewares)];

  //redux store
  const store = createStore(
    saveState,
    {},
    composeEnhancers(...enhancers)
  );

  const regist = getRegistModelFunc(store, registedModel, allReducers, sagaMiddleware);

  let app: ReduxApp = {
    /** redux store */
    store: store,
    /** saga中间件 */
    sagaMiddleware: sagaMiddleware,
    /** model注册函数 */
    regist: regist
  };
  return app;
}