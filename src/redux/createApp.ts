import { configureStore, createSlice, combineReducers } from '@reduxjs/toolkit';
import createSagaMiddleware, { SagaMiddleware, Task } from 'redux-saga';
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
  sagaMiddleware: SagaMiddleware<object>,
  runningEffects: Record<string, Task[]>
): (model: ReduxModel) => void {
  // 提取的公共模型安装逻辑
  function installModel(model: ReduxSagaModel) {
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
    runningEffects[model.name] = [];
    for (const effectKey in model.effects) {
      const type = `${model.name}/${effectKey}`;
      console.log('ez-saga: regist effect:', type);
      const effectFunc = model.effects[effectKey];
      const task = sagaMiddleware.run(function* () {
        // 使用 takeEvery 的参数传递功能，将上下文传入 handleEffect
        // handleEffect(modelName, effectFunc, tools, action)
        yield takeEvery(type, handleEffect, model.name, effectFunc, opFun);
      });
      runningEffects[model.name].push(task);
    }
  }

  return function regist(reduxModel: ReduxModel): void {
    const model = {
      ...reduxModel,
      initialState: {}
    } as ReduxSagaModel;

    if (registedModel[model.name]) {
      return;
    }

    // 安装模型
    installModel(model);

    // 开发环境：注册热更新事件监听
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      const eventName = `EZ_SAGA_UPDATE_${model.name}`;
      const hmrHandler = (e: any) => {
        const newModel = e.detail as ReduxSagaModel;
        console.log('[ez-saga] Hot updating model:', newModel.name);
        // 1. 取消旧任务
        const tasks = runningEffects[model.name];
        if (tasks && tasks.length) {
          tasks.forEach(task => task.cancel());
        }
        runningEffects[model.name] = [];
        // 2. 安装新模型 (包含更新 Reducer 和重启 Effects)
        installModel(newModel);
      };
      window.addEventListener(eventName, hmrHandler);
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

  // 存储运行中的 Effect 任务，用于热更新取消
  const runningEffects: Record<string, Task[]> = {};

  const regist = getRegistModelFunc(store, registedModel, allReducers, sagaMiddleware, runningEffects);

  return {
    store,
    sagaMiddleware,
    regist
  };
}