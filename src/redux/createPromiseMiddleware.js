/** 
 * @param registedModel 已注册model
 */
export default function createPromiseMiddleware(registedModel) {
  return () => next => action => {
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

  function isEffect(type) {
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
}
