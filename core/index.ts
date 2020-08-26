import invariant from 'invariant'
import middleware from './middleware'
import autoAction from './autoAction'
import { IParentModelProps, IModelProps } from './interface'
/**
 * @desc RcReduxModel
 * @property {Object} models - 所有的 models
 * @property {Object} reducers - 所有 model 下的 reducers，整合在一起，用于 redux.combineReducers
 * @property {Array} thunk - 自己实现的 thunk 中间件，对 dispatch 的增强
 */
class RcReduxModel {
  public models: IParentModelProps
  public reducers: any
  public thunk: any

  public constructor(models: Array<IModelProps>) {
    this.models = {}
    this.reducers = {}
    this.thunk = []
    this.start(models)
  }

  public start(models: Array<IModelProps>) {
    let _wrapRegisterAutoModels = models.map((model: IModelProps) => {
      return autoAction(model)
    })
    _wrapRegisterAutoModels.forEach((model: IModelProps) => {
      this.registerModel(model, models)
      this.reducers[model.namespace] = this.registerReducers(model)
    })
    this.thunk = middleware(_wrapRegisterAutoModels)
  }

  public registerModel(model: IModelProps, models: Array<IModelProps>) {
    invariant(model.namespace, `model's namespace is undefined`)
    invariant(
      typeof model.namespace === 'string',
      `model's namespace should be string, but got ${typeof model.namespace}`
    )
    const duplicateModel = models.filter(
      (mod: IModelProps) => mod.namespace === model.namespace
    )
    invariant(
      duplicateModel.length <= 1,
      `model's namespace should be unique, but now got the same namespace length = ${duplicateModel.length}, with the same namespace is ${model.namespace}`
    )
    if (!this.models[model.namespace]) {
      this.models[model.namespace] = model
    }
  }

  public registerReducers(model: IModelProps) {
    const { namespace, state, reducers } = model
    
    invariant(reducers, `model's reducers must be defined, but got undefined`)

    const reducersActionTypes = Object.keys(reducers)

    return (storeState: any, storeAction: any) => {
      const newState = storeState || state
      const reducersActionKeys = storeAction.type.split('/')
      const reducersActionModelName = reducersActionKeys[0]
      const reducersActionSelfName = reducersActionKeys[1]

      if (reducersActionModelName !== namespace) return newState
      if (reducersActionTypes.includes(reducersActionSelfName)) {
        return reducers[reducersActionSelfName](newState, storeAction.payload)
      }
      return newState
    }
  }
}

export default RcReduxModel
