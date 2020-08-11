import invariant from 'invariant'

const getCurrentModel = (models, actionNameSpace) => {
  const modelKeys = Object.keys(models)
  if (modelKeys.includes(actionNameSpace)) {
    return modelKeys[actionNameSpace]
  }
  return null
}
const createMiddleWare = (models) => {
  return (store) => (next) => (action) => {
    const { dispatch, getState } = store // 获取redux提供的API
    const actionTypeKeys = action.type.split('/')
    invariant(
      actionTypeKeys > 2,
      `dispatch action only accepts ['namespace/actionName'] , for example ['userModel/getUserInfo']`
    )
    const actionNameSpace = actionTypeKeys[0]
    const actionFunc = actionTypeKeys[1]

    // 1. 得到当前这个action所在的model
    const currentModel = getCurrentModel(models, actionNameSpace)
    if (currentModel) {
      // 1.1 拿到当前 model 的 action 集合，找到当前的 actionFunc
      const currentModelAction = currentModel.action
        ? currentModel.action[actionFunc]
        : null
      if (currentModelAction) {
      }
    }
  }
}
