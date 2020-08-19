const reportModel = {
  namespace: 'reportModel',
  state: {
    name: 'report 名称',
  },
  action: {},
  reducers: {
    changeName(state, payload) {
      return {
        ...state,
        name: payload,
      }
    },
  },
}

module.exports = reportModel
