"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

require("core-js/modules/es6.symbol");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.regexp.to-string");

var _invariant = _interopRequireDefault(require("invariant"));

var _seamlessImmutable = _interopRequireDefault(require("seamless-immutable"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @description 自动注册每个 state 的 action
 * @param {string} actionTypeToReducer
 * @returns {Function} actionFunction
 */
const autoAction = actionTypeToReducer => {
  return (_ref) => {
    let {
      getState,
      dispatch,
      call,
      currentAction,
      commit
    } = _ref;
    commit({
      type: actionTypeToReducer,
      payload: currentAction.payload
    });
  };
};
/**
 * @description 自动注册每个 state 对应的 reducer action
 * @param {string} stateKey - 当前的 state
 * @param {boolean} openSeamlessImmutable - 是否开启Immutable
 * @returns {Function}
 */


const autoReducers = (stateKey, openSeamlessImmutable) => {
  return (state, payload) => {
    const prevStateKeyType = Object.prototype.toString.call(state[stateKey]);
    const nextStateKeyType = Object.prototype.toString.call(payload);
    (0, _invariant.default)(prevStateKeyType === nextStateKeyType, "you define typeof [".concat(stateKey, "] is ").concat(prevStateKeyType, ", but got ").concat(nextStateKeyType));

    if (nextStateKeyType === '[object Object]' || nextStateKeyType === '[object Array]') {
      if (openSeamlessImmutable) {
        return _seamlessImmutable.default.merge(state, {
          [stateKey]: payload
        });
      }
    } else {
      if (openSeamlessImmutable) {
        return _seamlessImmutable.default.set(state, "".concat(stateKey), payload);
      }
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      [stateKey]: payload
    });
  };
};
/**
 * @description 生成自动注册修改 state 的 action.type
 * @summary action 发出的 action.type 需对应 reducer 中的 action.type
 * @param {string} namespace - 命名空间
 * @param {string} stateKey - 当前的 state key 值
 * @returns {string} actionTypeName
 */


const generateReducerActionType = (namespace, key) => {
  return "SET_".concat(namespace.toUpperCase(), "_").concat(key.toUpperCase());
};
/**
 * @desc 注册生成默认的action
 * @summary 使用方式
 * this.props.dispatch({
 *   type: '[model.namespace]/setStore',
 *   payload: {
 *     key: model.state.key
 *     value: your values
 *   }
 * })
 */


const autoSetStoreAction = namespace => {
  return (_ref2) => {
    let {
      currentAction,
      getState,
      dispatch
    } = _ref2;
    const currentModalState = getState()[namespace];
    const stateKeys = Object.keys(currentModalState);
    const keyProps = currentAction.payload && currentAction.payload.key;
    (0, _invariant.default)(stateKeys.includes(keyProps), "you didn't define the [".concat(keyProps, "] in the model.state, please check for correctness"));
    dispatch({
      type: "".concat(namespace, "/set").concat(keyProps),
      payload: currentAction.payload.values
    });
  };
};
/**
 * @desc 注册生成默认的action，可接收数组
 * @summary 使用方式
 * this.props.dispatch({
 *   type: '[model.namespace]/setStoreList',
 *   payload: [
 *     {
 *       key: model.state.key
 *       values: your values
 *     },{
 *       key: model.state.key
 *       values: your values
 *     }
 *   ]
 * })
 */


const autoSetStoreListAction = namespace => {
  return (_ref3) => {
    let {
      currentAction,
      dispatch,
      getState
    } = _ref3;
    const currentModalState = getState()[namespace];
    const stateKeys = Object.keys(currentModalState);
    const payload = currentAction.payload || [];
    const payloadType = Object.prototype.toString.call(payload);
    (0, _invariant.default)(payloadType === '[object Array]', "[action][setStoreList] payload must be array");
    payload.forEach(s => {
      (0, _invariant.default)(stateKeys.includes(s.key), "you didn't define the [".concat(s.key, "] in the model.state, please check for correctness"));
    });
    payload.forEach(s => {
      dispatch({
        type: "".concat(namespace, "/set").concat(s.key),
        payload: s.values
      });
    });
  };
};
/**
 * @description 为每个 model 的 state 自动注册 action 及 reducer
 * @param {RModal} model
 * @returns {RModal} newModal
 */


function _default(model) {
  let nextAction = {};
  let nextReducers = {};
  const {
    namespace,
    state = {},
    action = {},
    reducers = {},
    openSeamlessImmutable
  } = model;
  if (Object.keys(state).length === 0) return model;
  Object.keys(state).forEach(stateKey => {
    const actionTypeToReducer = generateReducerActionType(namespace, stateKey);

    if (!nextAction["set".concat(stateKey)]) {
      nextAction["set".concat(stateKey)] = autoAction(actionTypeToReducer);
    }

    if (!nextReducers["".concat(actionTypeToReducer)]) {
      nextReducers["".concat(actionTypeToReducer)] = autoReducers(stateKey, openSeamlessImmutable);
    }
  });
  nextAction['setStore'] = autoSetStoreAction(namespace);
  nextAction['setStoreList'] = autoSetStoreListAction(namespace); // 如果存在重复，以用户定义的为主

  nextAction = _objectSpread(_objectSpread({}, nextAction), action);
  nextReducers = _objectSpread(_objectSpread({}, nextReducers), reducers);
  return _objectSpread(_objectSpread({}, model), {}, {
    action: nextAction,
    reducers: nextReducers
  });
}