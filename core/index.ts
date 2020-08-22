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
      // 1. 对每一个 model 都进行检查
      this.registerModel(model, models)
      // 2. 生成 reducers 纯函数
      this.reducers[model.namespace] = this.registerReducers(model)
    })
    // 4. 生成 thunk 中间件
    this.thunk = middleware(_wrapRegisterAutoModels)
  }

  public registerModel(model: IModelProps, models: Array<IModelProps>) {
    // 1.1 检查有无命名空间
    invariant(model.namespace, `model's namespace is undefined`)
    // 1.2 检查命名空间必须是字符串
    invariant(
      typeof model.namespace === 'string',
      `model's namespace should be string, but got ${typeof model.namespace}`
    )
    // 1.3 检查是否出现重名现象
    const duplicateModel = models.filter(
      (mod: IModelProps) => mod.namespace === model.namespace
    )
    invariant(
      duplicateModel.length <= 1,
      `model's namespace should be unique, but now got the same namespace length = ${duplicateModel.length}, with the same namespace is ${model.namespace}`
    )
    // 1.4 注册每一个 model, 添加至 this.models
    if (!this.models[model.namespace]) {
      this.models[model.namespace] = model
    }
  }

  public registerReducers(model: IModelProps) {
    const { namespace, state, reducers } = model
    // 3检查 reducers
    invariant(reducers, `model's reducers must be defined, but got undefined`)

    // 3.1 得到所有 reducers 中的 action
    const reducersActionTypes = Object.keys(reducers)

    // 3.2 reducers 是一个纯函数，function(state, action) {}
    return (storeState: any, storeAction: any) => {
      const newState = storeState || state
      // 3.3 对 action 进行处理，规定 action.type 都是 namespace/actionName 的格式
      const reducersActionKeys = storeAction.type.split('/')

      const reducersActionModelName = reducersActionKeys[0]
      const reducersActionSelfName = reducersActionKeys[1]

      // 3.3.1 如果不是当前的 model
      if (reducersActionModelName !== namespace) return newState
      // 3.3.2 如果在 reducers 中存在这个 action
      if (reducersActionTypes.includes(reducersActionSelfName)) {
        return reducers[reducersActionSelfName](newState, storeAction.payload)
      }
      return newState
    }
  }
}

export default RcReduxModel
