const Immutable = require('seamless-immutable');
const invariantAction = require('invariant');
/**
 * @description 自动注册每个 state 的 action
 * @param {string} actionTypeToReducer
 * @returns {Function} actionFunction
 */
const autoAction = (actionTypeToReducer: string): Function => {
  return ({ getState, dispatch, call, currentAction, commit }: any) => {
    commit({
      type: actionTypeToReducer,
      payload: currentAction.payload,
    });
  };
};

/**
 * @description 自动注册每个 state 对应的 reducer action
 * @param {string} stateKey - 当前的 state
 * @param {boolean} openSeamlessImmutable - 是否开启Immutable
 * @returns {Function}
 */
const autoReducers = (stateKey: string, openSeamlessImmutable: boolean) => {
  return (state: any, payload: any) => {
    const prevStateKeyType = Object.prototype.toString.call(state[stateKey]);
    const nextStateKeyType = Object.prototype.toString.call(payload);
    invariantAction(
      prevStateKeyType === nextStateKeyType,
      `you define typeof [${stateKey}] is ${prevStateKeyType}, but got ${nextStateKeyType}`
    );

    if (
      nextStateKeyType === '[object Object]' ||
      nextStateKeyType === '[object Array]'
    ) {
      if (openSeamlessImmutable) {
        return Immutable.merge(state, {
          [stateKey]: payload,
        });
      }
    } else {
      if (openSeamlessImmutable) {
        return Immutable.set(state, `${stateKey}`, payload);
      }
    }
    return {
      ...state,
      [stateKey]: payload,
    };
  };
};

/**
 * @description 生成自动注册修改 state 的 action.type
 * @summary action 发出的 action.type 需对应 reducer 中的 action.type
 * @param {string} namespace - 命名空间
 * @param {string} stateKey - 当前的 state key 值
 * @returns {string} actionTypeName
 */
const generateReducerActionType = (namespace: string, key: string): string => {
  return `SET_${namespace.toUpperCase()}_${key.toUpperCase()}`;
};

/**
 * @desc 注册生成默认的action
 * @summary 使用方式
 * this.props.dispatch({
 *   type: '[model.namespace]/setStore',
 *   payload: {
 *     key: model.state.key
 *     values: your values
 *   }
 * })
 */
const autoSetStoreAction = (namespace: string) => {
  return ({ currentAction, getState, dispatch }: any) => {
    const currentModalState = getState()[namespace];
    const stateKeys = Object.keys(currentModalState);
    const keyProps = currentAction.payload && currentAction.payload.key;
    invariantAction(
      stateKeys.includes(keyProps),
      `you didn't define the [${keyProps}] in the model.state, please check for correctness`
    );

    dispatch({
      type: `${namespace}/set${keyProps}`,
      payload: currentAction.payload.values,
    });
  };
};

/**
 * @desc 注册生成默认的action，可接收数组
 * @summary 使用方式
 * this.props.dispatch({
 *   type: '[model.namespace]/setStoreList',
 *   payload: [
 *     {
 *       key: model.state.key
 *       values: your values
 *     },{
 *       key: model.state.key
 *       values: your values
 *     }
 *   ]
 * })
 */
const autoSetStoreListAction = (namespace: string) => {
  return ({ currentAction, dispatch, getState }) => {
    const currentModalState = getState()[namespace];
    const stateKeys = Object.keys(currentModalState);
    const payload = currentAction.payload || [];
    const payloadType = Object.prototype.toString.call(payload);
    invariantAction(
      payloadType === '[object Array]',
      `[action][setStoreList] payload must be array`
    );

    payload.map((s: { key: string; value: string }) => {
      invariantAction(
        stateKeys.includes(s.key),
        `you didn't define the [${s.key}] in the model.state, please check for correctness`
      );
    });

    payload.map((s: { key: string; values: string }) => {
      dispatch({
        type: `${namespace}/set${s.key}`,
        payload: s.values,
      });
    });
  };
};

/**
 * @description 为每个 model 的 state 自动注册 action 及 reducer
 * @param {RModal} model
 * @returns {RModal} newModal
 */
const registerAutoAction = (model: any) => {
  let nextAction = {};
  let nextReducers = {};

  const {
    namespace,
    state = {},
    action = {},
    reducers = {},
    openSeamlessImmutable,
  } = model;
  if (Object.keys(state).length === 0) return model;

  Object.keys(state).map((stateKey: string) => {
    const actionTypeToReducer = generateReducerActionType(namespace, stateKey);
    if (!nextAction[`set${stateKey}`]) {
      nextAction[`set${stateKey}`] = autoAction(actionTypeToReducer);
    }
    if (!nextReducers[`${actionTypeToReducer}`]) {
      nextReducers[`${actionTypeToReducer}`] = autoReducers(
        stateKey,
        openSeamlessImmutable
      );
    }
  });
  nextAction['setStore'] = autoSetStoreAction(namespace);
  nextAction['setStoreList'] = autoSetStoreListAction(namespace);

  // 如果存在重复，以用户定义的为主
  nextAction = { ...nextAction, ...action };
  nextReducers = { ...nextReducers, ...reducers };
  return {
    ...model,
    action: nextAction,
    reducers: nextReducers,
  };
};

module.exports = registerAutoAction;
