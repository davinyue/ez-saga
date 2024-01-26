import { Dispatch, Middleware, MiddlewareAPI, Action } from 'redux';
import { RegistedModel } from './typeDeclare';
import { PayloadAction } from './typeDeclare';
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

  return (api: MiddlewareAPI<D, any>) => (next: (action: PayloadAction) => any) => (action: PayloadAction) => {
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