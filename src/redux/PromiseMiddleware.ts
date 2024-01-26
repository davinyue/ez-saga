import { Dispatch, Middleware, MiddlewareAPI, Action, AnyAction } from 'redux';
import { RegistedModel } from './typeDeclare';

/** 
 * 创建中间层
 * @param registedModel 已注册model
 */
function createPromiseMiddleware<D extends Dispatch>(registedModel: RegistedModel): Middleware<any, any, any> {
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
  // function isReduxAction(action: unknown): action is Action {
  //   return (action as Action)?.type !== undefined;
  // }

  return (api: MiddlewareAPI<D, any>) => (next: (action: AnyAction) => any) => (action: AnyAction) => {
    let exeEffect = false;
    if ((action as Action)?.type !== undefined) {
      const { type } = action as Action;
      exeEffect = isEffect(type);
    }
    if (exeEffect) {
      return new Promise((resolve, reject) => {
        next({
          _dy_resolve: resolve,
          _dy_reject: reject,
          ...action as Action,
        });
      });
    } else {
      return next(action);
    }
  };
}

export default createPromiseMiddleware;