const invariantRename = require('invariant')

// 获取当前这个 actionModel 对应的 model
const getCurrentModel = (actionModelName: string, models: Array<any>) => {
  if (!models) return null
  const modelKeys = Object.keys(models)
  if (modelKeys.includes(actionModelName)) {
    return models[actionModelName]
  }
  return null
}

// 发起一个同步 action ，reducer 接收
const actionToReducer = (
  currentModel: any,
  actionModelName: string,
  next: any
) => {
  return (reducerAction: any) => {
    if (currentModel && currentModel.reducers) {
      if (currentModel.reducers[reducerAction.type]) {
        next({
          type: `${actionModelName}/${reducerAction.type}`,
          payload: reducerAction.payload,
        })
      }
    }
  }
}

const callAPI = (dispatch: any) => async (service: any, params: any) => {
  let result = {}
  try {
    result = await service(params)
  } catch (error) {
    return Promise.reject(params)
  }

  return Promise.resolve(result)
}

const registerMiddleWare = (models: any) => {
  // middleware 中间件的写法，想了解可参考 : https://cn.redux.js.org/docs/advanced/Middleware.html
  return ({ dispatch, getState }) => (next: any) => (action: any) => {
    // 阅读了 redux-thunk 方式，并不适用我们这里
    // 这里边对 action 进行处理，处理完了，再发到 reducers 中
    const actionKeyTypes = action.type.split('/')
    invariantRename(
      actionKeyTypes.length <= 2,
      `dispatch action only accept [namespace/actionName], but got ${action.type}`
    )
    // 1. 因为可能存在多个 model/sameActionName，所以需要找到当前的 model
    const actionModelName = actionKeyTypes[0]
    const actionSelfName = actionKeyTypes[1]
    const currentModel = getCurrentModel(actionModelName, models)
    invariantRename(
      currentModel,
      `the dispatch action didn't find the correct model, please confirm the correctness of this action.type, [action.type] Should be written as [model.namespace/actionName]`
    )

    // 2. 当前 model 是否拥有 action 集，存在则找到对应的 actionSelfName
    if (currentModel) {
      const currentModelAction = currentModel.action
        ? currentModel.action[actionSelfName]
        : null
      // redux-thunk 中是对其 action 进行类型判断，认为 function 类型的 action 就是异步 action
      // 而我们在 model.js 文件中对 action 的写法，都是 function 类型，等价于，我们的 action 都是异步的
      // 找到当前的 action，将此 action 进行处理，提供 commitActionToReducer 方法，用于修改 reducer
      if (currentModelAction) {
        const commitActionToReducer = actionToReducer(
          currentModel,
          actionModelName,
          next
        )
        // 这里的 commitActionToReducer 就等价与我们在 model 外边写的 commit({ type: 'STORE_REDUCER', payload: data })
        return currentModelAction({
          dispatch,
          getState,
          currentAction: action,
          commit: commitActionToReducer,
          call: callAPI(dispatch),
        })
      }
      // 当前 action 不存在，说明这个 action 是直接修改 reducer的
      const commitActionToReducer = actionToReducer(
        currentModel,
        actionModelName,
        next
      )
      return commitActionToReducer({
        ...action,
        type: actionSelfName,
      })
    }
    return next(action)
  }
}

module.exports = registerMiddleWare
