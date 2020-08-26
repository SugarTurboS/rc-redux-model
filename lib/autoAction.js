"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es6.symbol");

require("core-js/modules/es6.regexp.to-string");

require("core-js/modules/web.dom.iterable");

var _invariant = _interopRequireDefault(require("invariant"));

var _seamlessImmutable = _interopRequireDefault(require("seamless-immutable"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @desc 对每一个 model 自动注册 action 与 reducers
 * @summary 每一个 state 字段，都提供一个修改的 action
 * @param {object} model
 * @returns {object} newModel
 */
const autoAction = model => {
  let _wrapAutoAction = {};
  let _wrapAutoReducers = {};
  const {
    namespace,
    state = {},
    action = {},
    reducers = {},
    openSeamlessImmutable = false
  } = model;
  const stateKeys = Object.keys(state);
  if (stateKeys.length === 0) return model;
  stateKeys.forEach(key => {
    const actionType = generateActionType(namespace, key);

    if (!_wrapAutoAction["set".concat(key)]) {
      _wrapAutoAction["set".concat(key)] = registerAction(actionType);
    }

    if (!_wrapAutoReducers["".concat(actionType)]) {
      _wrapAutoReducers["".concat(actionType)] = generateReducers(key, openSeamlessImmutable);
    }
  });
  _wrapAutoAction = _objectSpread(_objectSpread({}, _wrapAutoAction), action);
  _wrapAutoReducers = _objectSpread(_objectSpread({}, _wrapAutoReducers), reducers);
  _wrapAutoAction['setStore'] = generateDefaultAction(namespace);
  return _objectSpread(_objectSpread({}, model), {}, {
    action: _wrapAutoAction,
    reducers: _wrapAutoReducers
  });
};
/**
 * @desc 生成 action.type
 * @summary action 发出的 action.type 需对应 reducer 中的 action.type
 * @param {string} namespace - 命名空间
 * @param {string} key - 当前的state key值
 * @returns {string} actionType
 */


const generateActionType = (namespace, key) => {
  return "SET_".concat(namespace.toUpperCase(), "_").concat(key.toUpperCase());
};
/**
 * @desc 自动注册 action
 * @param {string} actionType
 * @returns {function} actionFunction
 */


const registerAction = actionType => {
  return (_ref) => {
    let {
      currentAction,
      commit
    } = _ref;
    commit({
      type: actionType,
      payload: currentAction.payload
    });
  };
};
/**
 * @desc 自动注册 reducers
 * @param {string} key - 当前的state key值
 * @param {boolean} openSeamlessImmutable - 是否开启Immutable
 */


const generateReducers = (key, openSeamlessImmutable) => {
  return (state, payload) => {
    const prevStateKeyType = Object.prototype.toString.call(state[key]);
    const nextStateKeyType = Object.prototype.toString.call(payload);
    (0, _invariant.default)(prevStateKeyType === nextStateKeyType, "you define typeof [".concat(key, "] is ").concat(prevStateKeyType, ", but got ").concat(nextStateKeyType));

    if (nextStateKeyType === '[object Object]' || nextStateKeyType === '[object Array]') {
      if (openSeamlessImmutable) {
        return _seamlessImmutable.default.merge(state, {
          [key]: payload
        });
      }
    } else {
      if (openSeamlessImmutable) {
        return _seamlessImmutable.default.set(state, "".concat(key), payload);
      }
    }

    return _objectSpread(_objectSpread({}, state), {}, {
      [key]: payload
    });
  };
};
/**
 * @desc 注册生成默认的action
 * @summary 使用方式
 * this.props.dispatch({
 *   type: '[model.namespace]/setStore',
 *   payload: {
 *     key: [model.state.key]
 *     value: [your values]
 *   }
 * })
 */


const generateDefaultAction = namespace => {
  return (_ref2) => {
    let {
      currentAction,
      getState,
      dispatch
    } = _ref2;
    const currentModelState = getState()[namespace];
    const stateKeys = Object.keys(currentModelState);
    const keyProps = currentAction.payload && currentAction.payload.key;
    (0, _invariant.default)(stateKeys.includes(keyProps), "you didn't define the [".concat(keyProps, "] in the model.state, please check for correctness"));
    dispatch({
      type: "".concat(namespace, "/set").concat(keyProps),
      payload: currentAction.payload.values
    });
  };
};

var _default = autoAction;
exports.default = _default;