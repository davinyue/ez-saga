/** 类型申明 */
import {
  Action as ReduxAction, Store, Reducer, UnknownAction
} from 'redux';
import { Action, SagaMiddleware } from 'redux-saga';
import { PutEffect, SelectEffect } from 'redux-saga/effects';

/** payload action类型 */
export interface PayloadAction extends UnknownAction, ReduxAction<string> {
  /** 类型 */
  type: string,
  /** 载体 */
  payload?: any,
  [extraProps: string]: any;
}

declare module 'redux' {
  export interface Dispatch {
    <R = any>(action: PayloadAction, ...extraArgs: any[]): Promise<R>;
  }
}

/** 工具 */
export interface EffectTool {
  /** 调用异步函数, 并获得该异步函数的结果 */
  call: (...args: any[]) => any,
  /** 分发异步action */
  put: <A extends Action>(action: A) => PutEffect<A>,
  /** 分发同步action */
  putResolve: <A extends Action>(action: A) => PutEffect<A>,
  /** 从store从获取状态 */
  select: ((selectFunc: (state: any) => any) => SelectEffect) | (() => SelectEffect)
}

/** Effect函数类型 */
export interface Effect {
  (action: PayloadAction, tool: EffectTool): Generator | Promise<any> | any;
}

/** ModelReducer定义 */
export interface ModelReducer {
  [key: string]: Reducer<any, PayloadAction>;
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

export interface ReduxSagaModel extends ReduxModel {
  initialState: any,
  reducerPath: string
  reducers: ModelReducer
}

export interface RegistedModel {
  [key: string]: ReduxModel
}

/** app */
export interface ReduxApp {
  store: Store<any, ReduxAction>,
  sagaMiddleware: SagaMiddleware<object>;
  regist: (model: ReduxModel) => void;
}


export interface ReduxSagaModel extends ReduxModel {
  initialState: any,
  reducers: ModelReducer
}