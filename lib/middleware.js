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

const getCurrentModel = (models, actionNameSpace) => {
  const modelKeys = Object.keys(models);

  if (modelKeys.includes(actionNameSpace)) {
    return models[actionNameSpace];
  }

  return null;
}; // 模拟 put 方法


const put = (currentModel, actionNameSpace, next) => pureReducer => {
  const {
    reducers
  } = currentModel;

  if (reducers[pureReducer.type]) {
    next({
      type: "".concat(actionNameSpace, "/").concat(pureReducer.type),
      payload: pureReducer
    });
  }
}; // 模拟 call 方法


const call = dispatch => async (service, params) => {
  let result = {};

  try {
    result = await service(params);
  } catch (error) {
    return Promise.reject(params);
  }

  return Promise.resolve(result);
};

const createMiddleWare = models => {
  return store => next => action => {
    const {
      dispatch,
      getState
    } = store; // 获取redux提供的API

    const actionTypeKeys = action.type.split('/');
    (0, _invariant.default)(actionTypeKeys.length <= 2, "dispatch action only accepts ['namespace/actionName'] , for example ['userModel/getUserInfo']");
    const actionNameSpace = actionTypeKeys[0];
    const actionFunc = actionTypeKeys[1]; // 1. 得到当前这个 action 所在的 model

    const currentModel = getCurrentModel(models, actionNameSpace);

    if (currentModel) {
      // 1.1 拿到当前 model 的 action 集合，找到当前的 actionFunc
      const currentModelAction = currentModel.action ? currentModel.action[actionFunc] : null; // 1.2 当前这个 model action (异步Action) 存在，执行它，异步Action返回的是一个 Creator Action

      if (currentModelAction) {
        const commit = put(currentModel, actionNameSpace, next); // 1.3 获取当前 action 对应的命名空间中的 state

        const state = getState()[actionNameSpace];
        return currentModelAction(action, {
          commit: commit,
          dispatch: dispatch,
          state: state,
          call: call(dispatch)
        });
      } // 1.4 如果没有 action，则触发 reducer


      const commit = put(currentModel, actionNameSpace, next);
      return commit(_objectSpread(_objectSpread({}, action), {}, {
        type: actionFunc
      }));
    } // 2 如果没有找到当前


    return next(action);
  };
};

var _default = createMiddleWare;
exports.default = _default;