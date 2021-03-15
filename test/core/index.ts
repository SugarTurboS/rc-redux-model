const invariant = require('invariant');
const middleware = require('./middleware');
const registerAction = require('./registerAutoAction');

/**
 * @desc RcReduxModel
 * @property {any} models - 所有的 models
 * @property {Object} reducers - 所有 model 下的 reducers，整合在一起，用于 redux.combineReducers
 * @property {Array} thunk - 自己实现的 thunk 中间件，对 dispatch 的增强
 */
class RcReduxModel {
  public models: { [key: string]: any };
  public reducers: any;
  public thunk: any;

  public constructor(models: any[]) {
    this.models = {};
    this.reducers = {};
    this.thunk = [];
    this.start(models);
  }

  public start(models: any[]) {
    let autoActionAndReducerModel = models.map((model: any) => {
      return registerAction(model);
    });
    autoActionAndReducerModel.forEach((model: any) => {
      this.registerModel(model, models);
      this.reducers[model.namespace] = this.registerReducers(model);
    });
    this.thunk = middleware(autoActionAndReducerModel);
  }

  public registerModel(model: any, models: any[]) {
    invariant(model.namespace, `model's namespace is undefined`);
    invariant(
      typeof model.namespace === 'string',
      `model's namespace should be string, but got ${typeof model.namespace}`
    );
    const duplicateModel = models.filter(
      (mod: any) => mod.namespace === model.namespace
    );
    invariant(
      duplicateModel.length <= 1,
      `model's namespace should be unique, but now got the same namespace length = ${duplicateModel.length}, with the same namespace is ${model.namespace}`
    );
    if (!this.models[model.namespace]) {
      this.models[model.namespace] = model;
    }
  }

  public registerReducers(model: any) {
    const { namespace, state, reducers } = model;

    invariant(reducers, `model's reducers must be defined, but got undefined`);

    const reducersActionTypes = Object.keys(reducers);

    return (storeState: any, storeAction: any) => {
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

module.exports = RcReduxModel;
