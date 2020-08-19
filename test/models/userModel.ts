const request = require('./request')

const userModel = {
  namespace: 'userModel',
  state: {
    userInfo: {
      name: 'PDK',
    },
  },
  action: {
    getUserName: ({ getState }) => {
      const state = getState()['userModel']
      return state
    },
    fetchUserInfo: async ({ commit, call }) => {
      let res = await call(request, null)
      if (res.code === 0) {
        commit({
          type: 'changeUserInfo',
          payload: res.data,
        })
      }

      return user
    },
  },
  reducers: {
    changeUserInfo(state, payload) {
      return {
        ...state,
        userInfo: { ...payload },
      }
    },
  },
}

module.exports = userModel
