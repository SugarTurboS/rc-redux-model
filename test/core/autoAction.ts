/**
 * @desc 对每一个 model 自动注册 action 与 reducers
 * @summary 每一个 state 字段，都提供一个修改的 action
 * @param {object} model
 * @returns {object} newModel
 */
const autoAction = (model: any) => {
  let _newAction = {}
  let _newReducers = {}
  const { namespace, state = {}, action = {}, reducers = {} } = model
  const stateKeys = Object.keys(state)

  // 如果是空state，那么直接返回 model
  if (stateKeys.length === 0) return model

  // 遍历 state，给每一个值都自动注册修改此state的action
  stateKeys.forEach((key: string) => {
    const actionType = generateActionType(namespace, key)
    if (!_newAction[`change${key}`]) {
      _newAction[`change${key}`] = registerAction(actionType)
    }
    if (!_newReducers[`${actionType}`]) {
      _newReducers[`${actionType}`] = registerReducers()
    }
  })

  // 允许重名情况下覆盖，以用户定义的为主
  _newAction = { ..._newAction, ...action }
  _newReducers = { ..._newReducers, ...reducers }
  return { ...model, action: _newAction, reducers: _newReducers }
}

/**
 * @desc 自动注册 reducers
 * @param {string} namespace - 命名空间
 * @param {string} key - 当前的state key值
 */
const registerReducers = () => {
  return (state: any, payload: any) => {
    console.log('###', payload)
    return {
      ...state,
      ...payload,
    }
  }
}

/**
 * @desc 生成 action.type
 * @summary action 发出的 action.type 需对应 reducer 中的 action.type
 * @param {string} namespace - 命名空间
 * @param {string} key - 当前的state key值
 * @returns {string} actionType
 */
const generateActionType = (namespace: string, key: string): string => {
  return `${namespace.toUpperCase()}_STORE_LIB_${key.toUpperCase()}`
}

/**
 * @desc 自动注册 action
 * @param {string} actionType
 * @returns {function} actionFunction
 */
const registerAction = (actionType: string): Function => {
  return ({ currentAction, commit }: any) => {
    commit({
      type: actionType,
      payload: currentAction.payload,
    })
  }
}

module.exports = autoAction
