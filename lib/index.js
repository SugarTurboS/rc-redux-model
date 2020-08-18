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

class RcReduxModel {
  constructor(models) {
    this.models = {};
    this.reducers = {};
    this.thunk = [];
    this.makeReduxModel(models);
  }

  registerModel(model) {
    if (!this.models[model]) this.models[model.namespace] = model;
  }

  registerReducer(namespace, defaultState, reducers) {
    (0, _invariant.default)(reducers, "model's reducers must be defined, but got undefined"); // 得到 reducer 中的所有 actionType
    // reducer 都是得到一个 (state, action)，根据 action.type 进行 switch/case

    const reducerActionTypes = Object.keys(reducers);
    return (storeState, storeAction) => {
      const newState = storeState || defaultState;
      const reducerActionTypeKeys = storeAction.type.split('/');
      const reducerModelName = reducerActionTypeKeys[0];
      const reducerSelfName = reducerActionTypeKeys[1];
      if (reducerModelName !== namespace) return newState;
      if (reducerActionTypes.includes(reducerSelfName)) return reducers[reducerSelfName](newState, storeAction.type);
      return newState;
    };
  }

  makeReduxModel(models) {
    models.forEach(model => {
      // 对于无命名空间的，invariant 警告
      (0, _invariant.default)(model.namespace, "model's namespace is undefined"); // 命名空间必须是字符串

      (0, _invariant.default)(model.namespace !== 'string', "model's namespace should be string, but got ".concat(typeof model.namespace, " !")); // 有且只有唯一的 model namespace

      if (process.env.NODE_ENV === 'development') {
        const repeatModel = models.filter(mod => mod.namespace === model.namespace);
        (0, _invariant.default)(repeatModel.length > 1, "model namespace should be unique, but got length = ".concat(repeatModel.length));
      } // 将每个 model 都注入 this.models


      this.registerModel(model); // 处理每个 model 的 reducer，然后添加至 this.reducers 中

      this.reducers[model.namespace] = this.registerReducer(model.namespace, model.state, model.reducers);
    });
  }

  makeThunkMiddleWare() {
    this.thunk = (0, _middleware.default)(this.models);
    return this.thunk;
  }

}

var _default = RcReduxModel;
exports.default = _default;