import { legacy_createStore as createStore, applyMiddleware, compose } from 'redux';
import { createSlice, combineReducers } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { call, put, select, takeEvery, putResolve } from 'redux-saga/effects';
import win from 'global/window';
import createPromiseMiddleware from './createPromiseMiddleware';

function saveState(state, action) {
  if (!action.payload) {
    return state;
  }
  let newStat = {
    ...state,
    ...action.payload
  };
  return newStat;
}

/** 状态 */
export interface State  {
  [key: string]: any;
}

export interface Model {
  state: State;
  effect: function;
}

/** 
 * 获取注册model函数
 * @param store redux store
 * @param registedModel 已注册model, 对象, 属性为model名称, value为model
 * @param allReducers 所有的reducers
 * @param sagaMiddleware saga中间件
 * @returns 返回function regist(model)
 */
function getRegistModelFunc(store, registedModel, allReducers, sagaMiddleware) {
  /** model函数注册函数
   * @param model 模块, 其格式为
   * {
   *    name: 'name',
   *    state: {},
   *    reducers: {},
   *    effects: {}
   * }
   */
  return function regist(model) {
    if (registedModel[model.name]) {
      return;
    }
    delete model.initialState;
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
    if (!model.effect) {
      model.effect = {};
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
      let type = `${model.name}/${effect}`;
      let execFun = model.effects[effect];

      function* loading(opFun, action) {
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
export default function create() {
  //已经注册的reducer, key是名字, value是reducer
  const allReducers = {};
  //已注册model
  const registedModel = {};

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
  return {
    /** redux store */
    store: store,
    /** saga中间件 */
    sagaMiddleware: sagaMiddleware,
    /** model注册函数 */
    regist: regist
  };
}