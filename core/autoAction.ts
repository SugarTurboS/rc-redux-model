import invariant from 'invariant'
import Immutable from 'seamless-immutable'
import { IModelProps } from './interface'

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
    // 判断类型是否一致，如 model.state 里边对某个state值类型是string，但是想修改为object，这也是不合理的
    const prevStateKeyType = Object.prototype.toString.call(state[key])
    const nextStateKeyType = Object.prototype.toString.call(payload)
    invariant(
      prevStateKeyType === nextStateKeyType,
      `you define typeof [${key}] is ${prevStateKeyType}, but got ${nextStateKeyType}`
    )

    if (
      nextStateKeyType === '[object Object]' ||
      nextStateKeyType === '[object Array]'
    ) {
      if (openSeamlessImmutable) {
        return Immutable.merge(state, {
          [key]: payload,
        })
      }
    } else {
      if (openSeamlessImmutable) {
        return Immutable.set(state, `${key}`, payload)
      }
    }
    return {
      ...state,
      [key]: payload,
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
  return ({ currentAction, getState, dispatch }: any) => {
    const currentModelState = getState()[namespace]
    const stateKeys = Object.keys(currentModelState)
    // 根据key，触发对应的action
    const keyProps = currentAction.payload && currentAction.payload.key

    // 如果state值不存在，如 state {} 中只有a、b，然后通过commit想添加个c，这是不合理的
    invariant(
      stateKeys.includes(keyProps),
      `you didn't define the [${keyProps}] in the model.state, please check for correctness`
    )

    dispatch({
      type: `${namespace}/change${keyProps}`,
      payload: currentAction.payload.values,
    })
  }
}

export default autoAction
