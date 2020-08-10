import invariant from 'invariant'

class RcReduxModel {
  constructor(models) {
    this.models = {}
    this.reducers = {}
    this.makeReduxModel(models)
  }

  registerModel(model) {
    if (!this.models[model]) this.models[model.namespace] = model
  }

  registerReducer(model) {
    const { namespace, state, reducers } = model
    if (!reducers) {
      invariant(
        !reducers,
        `model's reducers must be defined, but got undefined`
      )
    }
    // 得到 reducer 中的所有 actionType
    const reducerActionTypes = Object.keys(reducers)

    // reducer 都是得到一个 (state, action)，根据 action.type 进行 switch/case
    return (storeState, storeAction) => {
      const newState = storeState || state
      const reducerActionTypeKeys = storeAction.type.split('/')
      if (reducerActionTypeKeys > 2) {
        invariant(
          reducerActionTypeKeys > 2,
          `model's reducers type only accepts ['namespace/reducerName'] , for example ['userModel/getUserInfo']`
        )
      }
      const reducerModelName = reducerActionTypeKeys[0] // eg. model.namespace = userModel
      const reducerSelfName = reducerActionTypeKeys[1] // eg. reducerName = getUserInfo
      if (reducerModelName !== namespace) return newState
      if (reducerActionTypes.includes(reducerSelfName))
        return reducers[reducerSelfName](newState, storeAction.type)

      return newState
    }
  }

  makeReduxModel(models) {
    models.forEach((model) => {
      // 对于无命名空间的，invariant 警告
      if (!model.namespace) {
        invariant(!model.namespace, `model's namespace is undefined`)
      }
      // 命名空间必须是字符串
      if (model.namespace && typeof model.namespace !== 'string') {
        invariant(
          model.namespace !== 'string',
          `model's namespace should be string, but got ${typeof model.namespace} !`
        )
      }
      // 有且只有唯一的 model namespace
      if (process.env.NODE_ENV === 'development') {
        const repeatModel = models.filter(
          (mod) => mod.namespace === model.namespace
        )

        invariant(
          repeatModel.length > 1,
          `model namespace should be unique, but got length = ${repeatModel.length}`
        )
      }
      // 将每个 model 都注入 this.models
      this.registerModel(model)
      // 处理每个 model 的 reducer，然后添加至 this.reducers 中
      this.reducers[model.namespace] = this.registerReducer(model)
    })
  }
}
