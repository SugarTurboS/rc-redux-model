const request = require('./request')

const userModel = {
  namespace: 'userModel',
  state: {
    userInfo: {
      name: 'PDK',
    },
  },
  action: {
    // 发起一个 action，修改 reducers
    storeInfo: ({ currentAction, commit }) => {
      commit({
        type: 'STORE_INFO',
        payload: currentAction.payload,
      })
    },
    getUserName: ({ getState }) => {
      const state = getState()['userModel']
      return state.userInfo.name
    },
    fetchUserInfo: async ({ commit, call }) => {
      let res = await call(request, null)
      if (res.code === 0) {
        commit({
          type: 'changeUserInfo',
          payload: res.data,
        })
      }

      return res
    },
  },
  reducers: {
    ['STORE_INFO'](state, payload) {
      const a = {
        ...state,
        userInfo: { ...payload },
      }
      return a
    },
    changeUserInfo(state, payload) {
      return {
        ...state,
        userInfo: { ...payload },
      }
    },
  },
}

const appModel = {
  namespace: 'appModel',
  state: {
    appData: {
      name: 'app',
    },
    appAuthor: '彭道宽'
  },
  action: {
    getAppName: ({ getState }) => {
      const state = getState()['appModel']
      console.log('appData: ', state)
      return state.appData.name
    },
  },
}

module.exports = [userModel, appModel]
