"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es6.symbol");

require("core-js/modules/es6.regexp.split");

require("core-js/modules/web.dom.iterable");

var _invariant = _interopRequireDefault(require("invariant"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// 获取当前这个 actionModel 对应的 model
const getCurrentModel = (actionModelName, models) => {
  if (!models) return null;
  const modelKeys = Object.keys(models);

  if (modelKeys.includes(actionModelName)) {
    return models[actionModelName];
  }

  return null;
}; // 发起一个同步 action ，reducer 接收


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

const registerMiddleWare = models => {
  // middleware 中间件的写法，想了解可参考 : https://cn.redux.js.org/docs/advanced/Middleware.html
  return (_ref) => {
    let {
      dispatch,
      getState
    } = _ref;
    return next => action => {
      // 阅读了 redux-thunk 方式，并不适用我们这里
      // 这里边对 action 进行处理，处理完了，再发到 reducers 中
      const actionKeyTypes = action.type.split('/');
      (0, _invariant.default)(actionKeyTypes.length <= 2, "dispatch action only accept [namespace/actionName], but got ".concat(action.type)); // 1. 因为可能存在多个 model/sameActionName，所以需要找到当前的 model

      const actionModelName = actionKeyTypes[0];
      const actionSelfName = actionKeyTypes[1];
      const currentModel = getCurrentModel(actionModelName, models); // 2. 当前 model 是否拥有 action 集，存在则找到对应的 actionSelfName

      if (currentModel) {
        const currentModelAction = currentModel.action ? currentModel.action[actionSelfName] : null; // redux-thunk 中是对其 action 进行类型判断，认为 function 类型的 action 就是异步 action
        // 而我们在 model.js 文件中对 action 的写法，都是 function 类型，等价于，我们的 action 都是异步的

        if (currentModelAction) {
          const commitActionToReducer = actionToReducer(currentModel, actionModelName, next);
          return currentModelAction({
            dispatch,
            getState,
            currentAction: action,
            commit: commitActionToReducer,
            call: callAPI(dispatch)
          });
        }

        const commitActionToReducer = actionToReducer(currentModel, actionModelName, next);
        return commitActionToReducer(_objectSpread(_objectSpread({}, action), {}, {
          type: actionSelfName
        }));
      }

      return next(action);
    };
  };
};

var _default = registerMiddleWare;
exports.default = _default;