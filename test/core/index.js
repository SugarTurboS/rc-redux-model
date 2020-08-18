const invariant = require('invariant')
const middleware = require('./middleware')

class RcReduxModel {
  constructor(models) {
    this.models = {}
    this.reducers = {}
    this.thunk = []
    this.makeReduxModel(models)
  }

  registerModel(model) {
    if (!this.models[model]) this.models[model.namespace] = model
  }

  registerReducer(namespace, defaultState, reducers) {
    invariant(reducers, `model's reducers must be defined, but got undefined`)

    // 得到 reducer 中的所有 actionType
    // reducer 都是得到一个 (state, action)，根据 action.type 进行 switch/case
    const reducerActionTypes = Object.keys(reducers)

    return (storeState, storeAction) => {
      const newState = storeState || defaultState
      const reducerActionTypeKeys = storeAction.type.split('/')

      const reducerModelName = reducerActionTypeKeys[0]
      const reducerSelfName = reducerActionTypeKeys[1]

      if (reducerModelName !== namespace) return newState

      if (reducerActionTypes.includes(reducerSelfName))
        return reducers[reducerSelfName](newState, storeAction.type)

      return newState
    }
  }

  makeReduxModel(models) {
    models.forEach((model) => {
      // 对于无命名空间的，invariant 警告
      invariant(model.namespace, `model's namespace is undefined`)
      // 命名空间必须是字符串
      invariant(
        model.namespace !== 'string',
        `model's namespace should be string, but got ${typeof model.namespace} !`
      )
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
      this.reducers[model.namespace] = this.registerReducer(
        model.namespace,
        model.state,
        model.reducers
      )
    })
  }

  makeThunkMiddleWare() {
    this.thunk = middleware(this.models)
    return this.thunk
  }
}

module.exports = RcReduxModel
