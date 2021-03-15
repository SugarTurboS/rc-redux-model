const RcReduxModel = require('./core/index')
const models = require('./models')
const Redux = require('redux')

const createStore = Redux.createStore
const combineReducer = Redux.combineReducers
const applyMiddleware = Redux.applyMiddleware

describe('rc-redux-model init success', () => {
  const _next = {}

  // 获取 rc-redux-models
  const reduxModels = new RcReduxModel(models)
  // 获取 reducers 、 models 、 thunk
  const _rootModels = reduxModels.models
  const _rootReducer = combineReducer(reduxModels.reducers)
  const _rootThunk = reduxModels.thunk

  // 生成 store 实例
  const store = createStore(_rootReducer, applyMiddleware(_rootThunk))

  const _nextHandler = _rootThunk(store)

  it('reduxModels must be a object', () => {
    expect(typeof reduxModels).toEqual('object')
  })

  it('modal must has [namespace, state, action, reducers]', () => {
    Object.keys(_rootModels).forEach((model) => {
      expect(_rootModels[model]).toHaveProperty(['namespace'])
      expect(_rootModels[model]).toHaveProperty(['state'])
      expect(_rootModels[model]).toHaveProperty(['action'])
      expect(_rootModels[model]).toHaveProperty(['reducers'])
    })
  })

  it('reducer must has [userModel, appModel] key', () => {
    expect(reduxModels.reducers).toHaveProperty('userModel')
    expect(reduxModels.reducers).toHaveProperty('appModel')
  })

  it('reducer [userModel, appModel] must functions', () => {
    Object.keys(reduxModels.reducers).forEach((key) => {
      expect(Object.prototype.toString.call(reduxModels.reducers[key])).toEqual(
        '[object Function]'
      )
    })
  })

  it('must return a function to handler next', () => {
    expect(Object.prototype.toString.call(_nextHandler)).toEqual(
      '[object Function]'
    )
    expect(_nextHandler.length).toBe(1)
  })

  /** -----开始执行------ */
  describe('next handler start', () => {
    const actionHandler = _nextHandler(_next)

    it('actionHandler is a handle action', () => {
      expect(Object.prototype.toString.call(actionHandler)).toEqual(
        '[object Function]'
      )
      expect(actionHandler.length).toBe(1)
    })

    describe('handle action', () => {
      // 执行自动注册的Action，直接修改reducers的值
      it('can handler auto register action', (next) => {
        actionHandler({
          type: 'appModel/setStore',
          payload: {
            key: 'appData',
            values: {
              name: 'ABCD',
            },
          },
        })
        next()
      })
      // 执行自动注册的action，支持数组形式修改 reducers 的值
      it('can handler auto register action by array to change reducers', (next) => {
        actionHandler({
          type: 'appModel/setStoreList',
          payload: [{
            key: 'appData',
            values: {
              name: 'ABCD',
            },
          }, {
            key: 'appAuthor',
            values: 'PDK'
          }],
        })
        next()
      })
      it('get trigger auto register action reducers value', (next) => {
        const appName = actionHandler({
          type: 'appModel/getAppName',
        })
        expect(appName).toEqual('ABCD')
        next()
      })
      it('can get state in action', (next) => {
        const userName = actionHandler({
          type: 'userModel/getUserName',
        })
        expect(userName).toEqual('PDK')
        next()
      })
      it('can call action and get right result', (next) => {
        actionHandler({
          type: 'userModel/fetchUserInfo',
          payload: { uid: 'PDK' },
        }).then((res) => {
          expect(res.data.name).toEqual('彭道宽')
          expect(res.data.job).toEqual('CVTE FE')
        })
        next()
      })
    })
  })
})
