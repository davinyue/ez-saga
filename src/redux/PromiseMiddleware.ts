import { Dispatch, Middleware, MiddlewareAPI, Action, UnknownAction } from 'redux';
import { RegistedModel } from './typeDeclare';

/**
 * 判断是否为标准Action
 */
function isAction(action: unknown): action is Action<string> {
  return typeof action === 'object' && action !== null && 'type' in action;
}

/** 
 * 创建中间层
 * @param registedModel 已注册model
 */
function createPromiseMiddleware<D extends Dispatch>(registedModel: RegistedModel): Middleware<any, any, any> {
  function isEffect(type: string) {
    if (!type || typeof type !== 'string') return false;

    // 性能优化：快速排除不包含 '/' 的普通 Action
    if (type.indexOf('/') === -1) return false;

    const [modelName, effect] = type.split('/');
    const model = registedModel[modelName];
    if (model && model.effects && model.effects[effect]) {
      return true;
    }
    return false;
  }

  return (api: MiddlewareAPI<D, any>) => (next: (action: unknown) => any) => (action: unknown) => {
    if (isAction(action) && isEffect(action.type)) {
      return new Promise((resolve, reject) => {
        next({
          _dy_resolve: resolve,
          _dy_reject: reject,
          ...action,
        });
      });
    }
    return next(action);
  };
}

export default createPromiseMiddleware;