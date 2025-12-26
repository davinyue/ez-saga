import { configureStore, createSlice, combineReducers } from '@reduxjs/toolkit';
import createSagaMiddleware, { SagaMiddleware } from 'redux-saga';
import { call, put, select, takeEvery, putResolve } from 'redux-saga/effects';
import { Reducer, Action, Store } from 'redux';
import { ReduxModel, ReduxApp, RegistedModel, ReduxSagaModel, EffectTool, PayloadAction, Effect } from './typeDeclare';
import saveState from './defaultReducer';
import createPromiseMiddleware from './PromiseMiddleware';

// 提取公共的 Effect 工具对象，避免在循环中重复创建
const opFun: EffectTool = { call, put, putResolve, select };

/**
 * 统一处理 Effect 的 Generator 函数
 * 提取到外部以减少闭包创建，提升性能
 */
function* handleEffect(
  modelName: string,
  effectFunc: Effect,
  tools: EffectTool,
  action: PayloadAction
) {
  // 开始异步任务设置loading状态
  yield putResolve({ type: `${modelName}/saveState`, payload: { loading: true } });

  // 执行 Effect (支持 Generator 或 Promise)
  const ret: any = yield call(effectFunc, action, tools);

  // 结束异步任务关闭loading状态
  yield putResolve({ type: `${modelName}/saveState`, payload: { loading: false } });

  // 处理 PromiseMiddleware 的回调
  if (action._dy_resolve) {
    action._dy_resolve(ret);
  }
}

/** 
 * 获取注册model函数
 */
function getRegistModelFunc(
  store: Store<any, Action<string>>,
  registedModel: RegistedModel,
  allReducers: { [x: string]: Reducer<any, any>; },
  sagaMiddleware: SagaMiddleware<object>
): (model: ReduxModel) => void {
  return function regist(reduxModel: ReduxModel): void {
    const model = {
      ...reduxModel,
      initialState: {}
    } as ReduxSagaModel;

    if (registedModel[model.name]) {
      return;
    }

    // 初始化模型属性
    if (!model.state) model.state = {};
    model.initialState = model.state;
    if (!model.reducers) model.reducers = {};
    // 注入默认的 saveState reducer
    if (!model.reducers.saveState) model.reducers.saveState = saveState;
    if (!model.effects) model.effects = {};

    // 使用 Redux Toolkit 创建 Slice
    const modelSlice = createSlice({
      name: model.name,
      initialState: model.initialState,
      reducers: model.reducers as any
    });

    // 注册 Reducer
    allReducers[model.name] = modelSlice.reducer;
    registedModel[model.name] = model;

    // 动态更新 Store 的 Reducers
    const newReducer = combineReducers(allReducers);
    store.replaceReducer(newReducer);

    // 注册 Effects
    for (const effectKey in model.effects) {
      const type = `${model.name}/${effectKey}`;
      const effectFunc = model.effects[effectKey];

      sagaMiddleware.run(function* () {
        // 使用 takeEvery 的参数传递功能，将上下文传入 handleEffect
        // handleEffect(modelName, effectFunc, tools, action)
        yield takeEvery(type, handleEffect, model.name, effectFunc, opFun);
      });
    }
  };
}

/** 创建store */
export default function create(): ReduxApp {
  const allReducers = {};
  const registedModel: RegistedModel = {};

  const sagaMiddleware = createSagaMiddleware();
  const promiseMiddleware = createPromiseMiddleware(registedModel);

  // 使用 configureStore 替代 createStore
  // 自动集成 Redux DevTools，自动组合中间件
  const store = configureStore({
    reducer: saveState, // 初始 Reducer
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: false, // 禁用默认的 thunk，因为我们使用 saga
        serializableCheck: false, // 禁用序列化检查，因为 action 中可能包含回调函数 (_dy_resolve)
        immutableCheck: false // 禁用不可变检查，提升开发环境性能
      }).concat(promiseMiddleware, sagaMiddleware),
    devTools: process.env.NODE_ENV !== 'production',
    preloadedState: {}
  });

  const regist = getRegistModelFunc(store, registedModel, allReducers, sagaMiddleware);

  return {
    store,
    sagaMiddleware,
    regist
  };
}