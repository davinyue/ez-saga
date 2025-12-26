/// <reference path="./global-shim.d.ts" />
export { PayloadAction, EffectTool, Effect, ModelReducer, ModelEffect, ReduxModel, ReduxApp } from './redux/typeDeclare';
export { Dispatch, Action } from 'redux';
import createApp from './redux/createApp';
export default {
  createApp: createApp
};