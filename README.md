# rc-redux-model

<img src="https://img.shields.io/badge/rc--redux--modal-v0.0.1-blue" />
<img src="https://img.shields.io/badge/redux-^4.0.1-yellow" />
<img src="https://img.shields.io/badge/author-PDK-inactive" />

简体中文 | [English](./README.en.md)

## 它是怎么来的?

- [why rc-redux-model and what's rc-redux-model](./RcReduxModel.md)
- [rc-redux-model design ideas and practices](./Design.md)

## 安装

```bash
npm install --save rc-redux-model
```

## 使用

在使用之前，**请先将此说明看一遍**，然后再看`完整例子`即可快速上手使用!!!

> 如果你想了解它是怎么来的，可以看看这里 : [why rc-redux-model and what's rc-redux-model](./RcReduxModel.md)

### 如何发送一个 action

```js
const action = {
  type: 'model.namespace/actionName',
  payload: null,
}

this.props.dispatch(action)
```

如上所示，一个 `action` 由 `type、payload` 组成，type 的命名规则为 : `model.namespace/actionName`，如 : `userModel/fetchUserInfo`

请注意，这里的每一个 action 都是 function, 也就是说，处理`同步action`的思路跟处理 `异步action`是一样的，如果你不明白，请移步 : [rc-redux-model design ideas and practices](./Design.md)

### 异步请求由谁处理

在 `model.action` 中，每一个 action 都是 function，它接收的参数为 :

- dispatch : store 提供的 API
- getState : store 提供的 API，由此 API 你可以得到最新的 state
- currentAction : 当前你 this.props.dispatch 的 action，你可以从这里拿到 `type` 和 `payload`
- call : 替你转发请求，同时会使用 Promise 包裹，当然你可以自己写异步逻辑
- commit : 接收一个 action，该 action.type 对应 reducer 中的 action.type，该方法用于 dispatch 到 reducers ，从而修改 state 值

### model 说明

每一个 `model` 都要求必须带有 `namespace`、`state`，对于 `action`、`reducers`，可写可不写

`rc-redux-model` 提供一个属性`autoRegisterDefaultAction`, 当你设置该属性为`true`，那么会自动帮你构造一个`action`，该`action` 可直接修改 reducer，比如 :

```js
export default {
  namespace: 'userModel',
  autoRegisterDefaultAction: true,
  state: {},
}

// 等价于
export default {
  namespace: 'userModel',
  autoRegisterDefaultAction: true,
  state: {
    testA: {},
    testB: [],
  },
  action: {
    defaultStoreLibProps: ({ currentAction, commit }) => {
      commit({
        type: 'DEFAULT_STORE_LIB_PROPS',
        payload: currentAction.payload,
      })
    },
  },
  reducers: {
    ['DEFAULT_STORE_LIB_PROPS'](state, payload) {
      return {
        ...state,
        ...payload,
      }
    },
  },
}
```

在业务端，我们直接调用这个 action，直接修改 state 中的 testA 与 testB

```js
this.props.dispatch({
  type: 'userModel/defaultStoreLibProps',
  payload: {
    testA: { name: '111' },
    testB: [22, 33, 44],
  },
})
```

---

## 完整例子

1. 新建一个 model 文件夹，该文件夹下新增一个 userModel.js

```js
// model/userModel.js
import adapter from '@common/adapter'

const userModel = {
  namespace: 'userModel',
  autoRegisterDefaultAction: true,
  state: {
    userInfo: {
      name: 'PDK',
    },
  },
  action: {
    // 直接获取 state 的值
    getUserName: ({ getState }) => {
      const state = getState()['userModel']
      return state.userInfo.name
    },
    // 发起一个 action，修改 reducers
    storeInfo: ({ currentAction, commit }) => {
      commit({
        type: 'STORE_INFO',
        payload: currentAction.payload,
      })
    },
    // 发起一个异步请求，异步请求结束之后，再修改 reducers
    fetchUserInfo: async ({
      currentAction,
      dispatch,
      getState,
      commit,
      call,
    }) => {
      let res = await call(adapter.callAPI, params)
      if (res.code === 0) {
        commit({
          type: 'CHANGE_USER_INFO',
          payload: res.data,
        })
      }
      return res
    },
  },
  reducers: {
    ['STORE_INFO'](state, payload) {
      return {
        ...state,
        userInfo: { ...payload },
      }
    },
    ['CHANGE_USER_INFO'](state, payload) {
      return {
        ...state,
        userInfo: { ...payload },
      }
    },
  },
}

export default userModel
```

2. 聚集所有的 models，请注意，这里导出的是一个 **数组**

```js
// model/index.js
import userModel from './userModel'
import exampleModel from './exampleModel'
import yourModel from './yourModel'

export default [userModel, exampleModel, yourModel]
```

3. 处理 models, 注册中间件

```js
// createStore.js
import { createStore, applyMiddleware, combineReducers } from 'redux'
import models from './models'
import RcReduxModel from 'rc-redux-model'

const reduxModel = new RcReduxModel(models)
const _rootThunk = reduxModel.thunk
const _rootReducers = reduxModel.reducers

const reducerList = combineReducers(_rootReducers)
return createStore(reducerList, applyMiddleware(_rootThunk))
```

4. 在页面中使用

请注意，这里的 action 都是异步 action，内部中间件的实现方式参考 `redux-thunk`，也就是说，我们 `dispatch` 一个 `action` 都是对应的一个方法，看代码 :

```js
import React from 'react'
class MyComponents extends React.PureComponent {
  componentDidMount() {
    // demo1 : 获取 state 中用户名，当然这里不建议这样获取state的值，建议通过 connect 这种方式获取
    const userName = this.props.dispatch({
      type: 'userModel/getUserName',
    })

    // demo2 : 发起一个同步 action，修改 reducers 的值
    this.props.dispatch({
      type: 'userModel/storeInfo',
      payload: {
        name: '牛逼Plus',
      },
    })

    // demo3 : 发起一个异步 action，当请求完成之后再修改 reducers 的值
    // 具体的请求，在 model.action 中自己写，支持 Promise，之前需要 callback 回调请求后的数据，现在直接 then 获取
    this.props
      .dispatch({
        type: 'userModel/fetchUserInfo',
      })
      .then((res) => {
        console.log(res)
      })
      .catch((err) => {
        console.log(err)
      })
  }
}
```

## Model API

每一个 model 接收 5 个属性，具体如下

| 参数                      | 说明                                              | 类型    | 默认值 |
| ------------------------- | ------------------------------------------------- | ------- | ------ |
| namespace                 | 必须，且唯一                                      | string  | -      |
| state                     | 数据状态，必须                                    | object  | {}     |
| action                    | action，非必须                                    | object  | -      |
| reducers                  | reducer，非必须                                   | object  | -      | 、 |
| autoRegisterDefaultAction | 是否默认注入一个 action，该字段说明在上边[使用]() | boolean | true   |
