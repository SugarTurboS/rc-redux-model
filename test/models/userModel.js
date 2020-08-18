const getUserInfo = require('./request')

const userModel = {
  namespace: 'userModel',
  state: {
    userInfo: {
      name: 'PDK',
    },
  },
  action: {
    getUserName: (payload, { state }) => {
      return state
    },
    fetchUserInfo: async (payload, { commit, call }) => {
      let res = await call(getUserInfo, payload)
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
