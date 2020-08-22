import { IModelProps } from './interface'
import Immutable from 'seamless-immutable'

/**
 * @desc 对每一个 model 自动注册 action 与 reducers
 * @summary 每一个 state 字段，都提供一个修改的 action
 * @param {object} model
 * @returns {object} newModel
 */
const autoAction = (model: IModelProps) => {
  let _wrapAutoAction = {}
  let _wrapAutoReducers = {}
  const { namespace, state = {},  action = {}, reducers = {}, openSeamlessImmutable = false, } = model
  const stateKeys = Object.keys(state)

  // 如果是空state，那么直接返回 model
  if (stateKeys.length === 0) return model

  // 遍历 state，给每一个值都自动注册修改此state的action
  stateKeys.forEach((key: string) => {
    const actionType = generateActionType(namespace, key)
    if (!_wrapAutoAction[`change${key}`]) {
      _wrapAutoAction[`change${key}`] = registerAction(actionType)
    }
    if (!_wrapAutoReducers[`${actionType}`]) {
      _wrapAutoReducers[`${actionType}`] = registerReducers(key, openSeamlessImmutable)
    }
  })
  // 允许重名情况下覆盖，以用户定义的为主
  _wrapAutoAction = { ..._wrapAutoAction, ...action }
  _wrapAutoReducers = { ..._wrapAutoReducers, ...reducers }

  // 为了防止太多个state对应action，所以提供一个默认的action，根据用户传递的key，策略模式分配到对应的action
  _wrapAutoAction['setStoreLib'] = generateDefaultAction(namespace)
  return { ...model, action: _wrapAutoAction, reducers: _wrapAutoReducers }
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

/**
 * @desc 自动注册 reducers
 * @param {string} key - 当前的state key值
 * @param {boolean} openSeamlessImmutable - 是否开启Immutable
 */
const registerReducers = (key: string, openSeamlessImmutable: boolean) => {
  return (state: any, payload: any) => {
    if (openSeamlessImmutable) {
      return Immutable.merge(state, key, payload)
    }
    return {
      ...state,
      ...payload,
    }
  }
}

/**
 * @desc 注册生成默认的action
 * @summary 使用方式
 * this.props.dispatch({
 *   type: '[model.namespace]/setStoreLib',
 *   payload: {
 *     key: [model.state.key]
 *     value: [your values]
 *   }
 * })
 */
const generateDefaultAction = (namespace: string) => {
  return ({ currentAction, dispatch }: any) => {
    // 根据key，触发对应的action
    const keyProps = currentAction.payload && currentAction.payload.key
    dispatch({
      type: `${namespace}/change${keyProps}`,
      payload: currentAction.payload.values,
    })
  }
}

export default autoAction
