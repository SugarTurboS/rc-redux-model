const invariantMiddleWare = require('invariant');

const getCurrentModel = (actionModelName: string, models: Array<any>) => {
  if (models.length === 0) return null;
  const findModel = models.filter(
    (model: any) => model.namespace === actionModelName
  );
  if (findModel.length > 0) return findModel[0];
  return null;
};

const actionToReducer = (
  currentModel: any,
  actionModelName: string,
  next: any
) => {
  return (reducerAction: any) => {
    if (currentModel && currentModel.reducers) {
      if (currentModel.reducers[reducerAction.type]) {
        next({
          type: `${actionModelName}/${reducerAction.type}`,
          payload: reducerAction.payload,
        });
      }
    }
  };
};

const callAPI = (dispatch: any) => async (service: any, params: any) => {
  let result = {};
  try {
    result = await service(params);
  } catch (error) {
    return Promise.reject(params);
  }

  return Promise.resolve(result);
};

const registerMiddleWare = (models: any[]) => {
  return ({ dispatch, getState }) => (next: any) => (action: any) => {
    const actionKeyTypes = action.type.split('/');
    invariantMiddleWare(
      actionKeyTypes.length <= 2,
      `dispatch action only accept [namespace/actionName], but got ${action.type}`
    );
    const actionModelName = actionKeyTypes[0];
    const actionSelfName = actionKeyTypes[1];
    const currentModel = getCurrentModel(actionModelName, models);
    if (currentModel) {
      const currentModelAction = currentModel.action
        ? currentModel.action[actionSelfName]
        : null;

      invariantMiddleWare(
        currentModelAction,
        `[${actionSelfName}] does not exist [${actionModelName}]!`
      );

      if (currentModelAction && typeof currentModelAction === 'function') {
        const commitActionToReducer = actionToReducer(
          currentModel,
          actionModelName,
          next
        );
        return currentModelAction({
          dispatch,
          getState,
          currentAction: action,
          commit: commitActionToReducer,
          call: callAPI(dispatch),
        });
      }
    }
    return next(action);
  };
};

module.exports = registerMiddleWare;
