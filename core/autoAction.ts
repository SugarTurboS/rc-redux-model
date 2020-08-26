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

  if (stateKeys.length === 0) return model

  stateKeys.forEach((key: string) => {
    const actionType = generateActionType(namespace, key)
    if (!_wrapAutoAction[`set${key}`]) {
      _wrapAutoAction[`set${key}`] = registerAction(actionType)
    }
    if (!_wrapAutoReducers[`${actionType}`]) {
      _wrapAutoReducers[`${actionType}`] = generateReducers(key, openSeamlessImmutable)
    }
  })
  _wrapAutoAction = { ..._wrapAutoAction, ...action }
  _wrapAutoReducers = { ..._wrapAutoReducers, ...reducers }
  _wrapAutoAction['setStore'] = generateDefaultAction(namespace)

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
  return `SET_${namespace.toUpperCase()}_${key.toUpperCase()}`
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
const generateReducers = (key: string, openSeamlessImmutable: boolean) => {
  return (state: any, payload: any) => {
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
 *   type: '[model.namespace]/setStore',
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
    const keyProps = currentAction.payload && currentAction.payload.key

    invariant(
      stateKeys.includes(keyProps),
      `you didn't define the [${keyProps}] in the model.state, please check for correctness`
    )

    dispatch({
      type: `${namespace}/set${keyProps}`,
      payload: currentAction.payload.values,
    })
  }
}

export default autoAction
