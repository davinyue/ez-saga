import { legacy_createStore as createStore, applyMiddleware, compose, Action as ReduxAction, Store } from 'redux';
import { createSlice, combineReducers } from '@reduxjs/toolkit';
import createSagaMiddleware, { SagaMiddleware } from 'redux-saga';
import { call, put, select, takeEvery, putResolve } from 'redux-saga/effects';
import win from 'global/window';
import { Reducer, AnyAction } from 'redux';
import { ReduxModel, ReduxApp, RegistedModel, ReduxSagaModel, PayloadAction } from './typeDeclare';
//import saveState from './defaultReducer';
import createPromiseMiddleware from './PromiseMiddleware';

const saveState: Reducer<any, PayloadAction> = (state: any, action: PayloadAction) => {
  debugger;
  if (!action.payload) {
    return state;
  }
  let newStat = {
    ...state,
    ...action.payload
  };
  return newStat;
};

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