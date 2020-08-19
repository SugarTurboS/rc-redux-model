"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es6.regexp.split");

require("core-js/modules/web.dom.iterable");

var _invariant = _interopRequireDefault(require("invariant"));

var _middleware = _interopRequireDefault(require("./middleware"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @desc RcReduxModel
 * @property {Object} models - 所有的 models
 * @property {Object} reducers - 所有 model 下的 reducers，整合在一起，用于 redux.combineReducers
 * @property {Array} thunk - 自己实现的 thunk 中间件，对 dispatch 的增强
 */
class RcReduxModel {
  constructor(models) {
    this.models = {};
    this.reducers = {};
    this.thunk = [];
    this.start(models);
  }

  start(models) {
    models.forEach(model => {
      // 1. 对每一个 model 都进行检查
      this.registerModel(model, models); // 2. 生成 reducers 纯函数

      this.reducers[model.namespace] = this.registerReducers(model);
    }); // 3. 生成 thunk 中间件

    this.thunk = (0, _middleware.default)(this.models);
  }

  registerModel(model, models) {
    // 1.1 检查有无命名空间
    (0, _invariant.default)(model.namespace, "model's namespace is undefined"); // 1.2 检查命名空间必须是字符串

    (0, _invariant.default)(typeof model.namespace === 'string', "model's namespace should be string, but got ".concat(typeof model.namespace)); // 1.3 检查是否出现重名现象

    const duplicateModel = models.filter(mod => mod.namespace === model.namespace);
    (0, _invariant.default)(duplicateModel.length <= 1, "model's namespace should be unique, but now got the same namespace length = ".concat(duplicateModel.length, ", with the same namespace is ").concat(model.namespace)); // 1.4 注册每一个 model, 添加至 this.models

    if (!this.models[model.namespace]) {
      this.models[model.namespace] = model;
    }
  }

  registerReducers(model) {
    const {
      namespace,
      state,
      reducers
    } = model; // 2.1 检查 reducers

    (0, _invariant.default)(reducers, "model's reducers must be defined, but got undefined"); // 2.2 得到所有 reducers 中的 action

    const reducersActionTypes = Object.keys(reducers); // 2.2 reducers 是一个纯函数，function(state, action) {}

    return (storeState, storeAction) => {
      const newState = storeState || state; // 2.3 对 action 进行处理，规定 action.type 都是 namespace/actionName 的格式

      const reducersActionKeys = storeAction.type.split('/');
      const reducersActionModelName = reducersActionKeys[0];
      const reducersActionSelfName = reducersActionKeys[1]; // 2.3.1 如果不是当前的 model

      if (reducersActionModelName !== namespace) return newState; // 2.3.2 如果在 reducers 中存在这个 action

      if (reducersActionTypes.includes(reducersActionSelfName)) {
        return reducers[reducersActionSelfName](newState, storeAction.type);
      }

      return newState;
    };
  }

}

var _default = RcReduxModel;
exports.default = _default;