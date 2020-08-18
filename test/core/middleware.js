const invariant = require('invariant')

const getCurrentModel = (models, actionNameSpace) => {
  const modelKeys = Object.keys(models)
  if (modelKeys.includes(actionNameSpace)) {
    return models[actionNameSpace]
  }
  return null
}

// 模拟 put 方法
const put = (currentModel, actionNameSpace, next) => (pureReducer) => {
  const { reducers } = currentModel
  if (reducers[pureReducer.type]) {
    next({
      type: `${actionNameSpace}/${pureReducer.type}`,
      payload: pureReducer,
    })
  }
}

// 模拟 call 方法
const call = (dispatch) => async (service, params) => {
  let result = {}
  try {
    result = await service(params)
  } catch (error) {
    return Promise.reject(params)
  }

  return Promise.resolve(result)
}

const createMiddleWare = (models) => {
  return (store) => (next) => (action) => {
    const { dispatch, getState } = store // 获取redux提供的API
    const actionTypeKeys = action.type.split('/')
    invariant(
      actionTypeKeys.length <= 2,
      `dispatch action only accepts ['namespace/actionName'] , for example ['userModel/getUserInfo']`
    )
    const actionNameSpace = actionTypeKeys[0]
    const actionFunc = actionTypeKeys[1]

    // 1. 得到当前这个 action 所在的 model
    const currentModel = getCurrentModel(models, actionNameSpace)
    if (currentModel) {
      // 1.1 拿到当前 model 的 action 集合，找到当前的 actionFunc
      const currentModelAction = currentModel.action
        ? currentModel.action[actionFunc]
        : null
      // 1.2 当前这个 model action (异步Action) 存在，执行它，异步Action返回的是一个 Creator Action
      if (currentModelAction) {
        const commit = put(currentModel, actionNameSpace, next)
        // 1.3 获取当前 action 对应的命名空间中的 state
        const state = getState()[actionNameSpace]
        return currentModelAction(action, {
          commit: commit,
          dispatch: dispatch,
          state: state,
          call: call(dispatch),
        })
      }
      // 1.4 如果没有 action，则触发 reducer
      const commit = put(currentModel, actionNameSpace, next)
      return commit({
        ...action,
        type: actionFunc,
      })
    }
    // 2 如果没有找到当前
    return next(action)
  }
}

module.exports = createMiddleWare
