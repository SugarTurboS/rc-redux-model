"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

require("core-js/modules/es6.regexp.split");

var _invariant = _interopRequireDefault(require("invariant"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getCurrentModel = (actionModelName, models) => {
  if (models.length === 0) return null;
  const findModel = models.filter(model => model.namespace === actionModelName);
  if (findModel.length > 0) return findModel[0];
  return null;
};

const actionToReducer = (currentModel, actionModelName, next) => {
  return reducerAction => {
    if (currentModel && currentModel.reducers) {
      if (currentModel.reducers[reducerAction.type]) {
        next({
          type: "".concat(actionModelName, "/").concat(reducerAction.type),
          payload: reducerAction.payload
        });
      }
    }
  };
};

const callAPI = dispatch => async (service, params) => {
  let result = {};

  try {
    result = await service(params);
  } catch (error) {
    return Promise.reject(params);
  }

  return Promise.resolve(result);
};

function _default(models) {
  return (_ref) => {
    let {
      dispatch,
      getState
    } = _ref;
    return next => action => {
      const actionKeyTypes = action.type.split('/');
      (0, _invariant.default)(actionKeyTypes.length <= 2, "dispatch action only accept [namespace/actionName], but got ".concat(action.type));
      const actionModelName = actionKeyTypes[0];
      const actionSelfName = actionKeyTypes[1];
      const currentModel = getCurrentModel(actionModelName, models);

      if (currentModel) {
        const currentModelAction = currentModel.action ? currentModel.action[actionSelfName] : null;
        (0, _invariant.default)(currentModelAction, "[".concat(actionSelfName, "] does not exist [").concat(actionModelName, "]!"));

        if (currentModelAction && typeof currentModelAction === 'function') {
          const commitActionToReducer = actionToReducer(currentModel, actionModelName, next);
          return currentModelAction({
            dispatch,
            getState,
            currentAction: action,
            commit: commitActionToReducer,
            call: callAPI(dispatch)
          });
        }
      }

      return next(action);
    };
  };
}