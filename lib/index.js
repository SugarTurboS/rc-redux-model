"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

require("core-js/modules/es6.regexp.split");

require("core-js/modules/web.dom.iterable");

var _invariant = _interopRequireDefault(require("invariant"));

var _middleware = _interopRequireDefault(require("./middleware"));

var _registerAutoAction = _interopRequireDefault(require("./registerAutoAction"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @desc RcReduxModel
 * @property {RModal} models - 所有的 models
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
    let autoActionAndReducerModel = models.map(model => {
      return (0, _registerAutoAction.default)(model);
    });
    autoActionAndReducerModel.forEach(model => {
      this.registerModel(model, models);
      this.reducers[model.namespace] = this.registerReducers(model);
    });
    this.thunk = (0, _middleware.default)(autoActionAndReducerModel);
  }

  registerModel(model, models) {
    (0, _invariant.default)(model.namespace, "model's namespace is undefined");
    (0, _invariant.default)(typeof model.namespace === 'string', "model's namespace should be string, but got ".concat(typeof model.namespace));
    const duplicateModel = models.filter(mod => mod.namespace === model.namespace);
    (0, _invariant.default)(duplicateModel.length <= 1, "model's namespace should be unique, but now got the same namespace length = ".concat(duplicateModel.length, ", with the same namespace is ").concat(model.namespace));

    if (!this.models[model.namespace]) {
      this.models[model.namespace] = model;
    }
  }

  registerReducers(model) {
    const {
      namespace,
      state,
      reducers
    } = model;
    (0, _invariant.default)(reducers, "model's reducers must be defined, but got undefined");
    const reducersActionTypes = Object.keys(reducers);
    return (storeState, storeAction) => {
      const newState = storeState || state;
      const reducersActionKeys = storeAction.type.split('/');
      const reducersActionModelName = reducersActionKeys[0];
      const reducersActionSelfName = reducersActionKeys[1];
      if (reducersActionModelName !== namespace) return newState;

      if (reducersActionTypes.includes(reducersActionSelfName)) {
        return reducers[reducersActionSelfName](newState, storeAction.payload);
      }

      return newState;
    };
  }

}

var _default = RcReduxModel;
exports.default = _default;