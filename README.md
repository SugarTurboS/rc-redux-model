# rc-redux-model 👋

简体中文 | [English](./README.en.md)

![](https://img.shields.io/badge/author-彭道宽-important.svg)
![](https://img.shields.io/badge/team-SugarTurboS-critical.svg)
![](https://img.shields.io/badge/category-Redux-blue.svg)
![](https://img.shields.io/badge/category-React-yellowgreen.svg)
![](https://img.shields.io/badge/rc--redux--modal-v1.0.3-green.svg)
![](https://img.shields.io/badge/redux-^4.0.1-inactive.svg)
![](https://img.shields.io/badge/license-MIT-yellow.svg)

> 借鉴 dva 的数据流方案，参考 redux-thunk，内部实现中间件；提供默认行为 action，调用此 action 可直接修改 state 里的任意值，开发更加方便简洁，支持 Immutable ～

## ✨ 特性

- 轻巧简洁，写数据管理就跟写 `dva` 一样舒服
- 抛弃 `redux-saga` ，异步请求由用户自行处理，或者调用提供的方法进行转发，该方法返回的是一个 Promise
- 参考 `redux-thunk`，内部实现独立的中间件，处理异步 Action
- 提供默认行为 Action，调用此 Action ，可以直接修改 state 里的任意值
- 支持 `Immutable` ，只需开启配置，让你的数据不可变

## ⛏ 安装

```bash
npm install --save rc-redux-model
```

## ⏳ 前世今生

- [why rc-redux-model and what's rc-redux-model](https://github.com/PDKSophia/rc-redux-model/issues/1)
- [rc-redux-model design ideas and practices](https://github.com/PDKSophia/rc-redux-model/issues/2)

## 🚀 使用

在使用之前，请了解几个知识点，然后再看`完整例子`即可快速上手使用!!! [👉 如果你想了解它是怎么来的，点这里](https://github.com/PDKSophia/rc-redux-model/issues/1)

### 如何发送一个 action ?

**一个 action 由 type、payload 组成，type 的命名规则为 : model.namespace / actionName**

```js
// 下边是 namespace = appModel ，actionName = fetchUserList 的例子
const action = {
  type: 'appModel/fetchUserList',
}
// 发起这个 action
this.props.dispatch(action)
```

请注意，这里的每一个 action 都是 function, 也就是说，处理`同步action`的思路跟处理 `异步action`是一样的，如果你不明白，[👉 请移步这里](./Design.md)

### 异步请求由谁处理 ?

在 `model.action` 中，每一个 action 都是 function，它提供的方法为 :

- dispatch : store 提供的 API，你可以调用此 `dispatch` 继续分发 action
- getState : store 提供的 API，由此 API 你可以得到最新的 state
- currentAction : 当前你 this.props.dispatch 的 action，你可以从这里拿到 `type` 和 `payload`
- call : 替你转发请求，同时会使用 Promise 包裹，当然你可以自己写异步逻辑
- commit : 接收一个 action，该 action.type 对应 reducer 中的 action.type，该方法用于 dispatch 到 reducers ，从而修改 state 值

### model 说明 ?

**每一个 model 必须带有 namespace、state**

该中间件会为你自动注册 Action，**每一个 state 的字段都会自动注册一个修改此 state 的 Action**，从而释放你键盘上的 ⌨️ CV 键， 例如 :

```
state: {
  userName: 'oldValue'
}
```

那么会自动为你注册一个 Action

```
action: {
  changeuserName: ({ dispatch, getState, commit, call, currentAction }) => {}
}
```

你只要在组件中调用此 Action 即可修改 state 值 （📢 不推荐使用这种 action 进行修改 state 值，推荐使用 **setStoreLib**）

```js
this.props.dispatch({
  type: 'userModel/changeuserName',
  payload: {
    userName: 'newValue',
  },
})
```

问题来了，当 state 中的值很多(比如有几十个)，那么为用户自动注册几十个 action，用户在使用上是否需要记住每一个 state 对应的 action 呢？这肯定是极其不合理的，所以**默认提供了一个 action 用于修改所有的 state ！！！**

随之而来的问题是，如果只提供一个 action，那么所有修改 State 的值都走的这个 Action.type，在 [redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension) 中，会看不到具体的相对信息记录(因为都是同一个 action)，所以在此默认的 action 上，会根据用户提供的 `payload.key`，从而转发至对应的 action 中。

> 对外提供统一默认 action，方面用户使用；对内根据 key，进行真实 action 的转发

```js
this.props.dispatch({
  type: '[model.namespace]/setStoreLib',
  payload: {
    key: [model.state.key]  // 你要修改的state key
    value: [your values] // 你要修改的值
  }
})
```

🌟 所有修改 state 的 action，**都通过 setStoreLib 来发**，不必担心在 redux devtools 中找不到，此 action 只是会根据你的 key，转发对应的 action 而已

### 如何在组件中获取 state 值？

请注意，rc-redux-model 是一个中间件，并且大部分情况下，能够在你现有的项目中兼容，所以获取 state 的方式，还是跟你原来在组件中如何获取 state 一样

一般来讲，我们的项目都会安装 `react-redux` 库，然后通过 `connect` 获取 state 上的值（没什么变化，你之前怎么写，现在就怎么写）

```js
class appComponent extends React.Component {
  componentDidMount() {
    // 发起 action，将loading状态改为true
    this.props.dispatch({
      type: 'appModel/fetchLoadingStatus',
      payload: {
        loadingStatus: true,
      },
    })
  }

  render() {
    const { loadingStatus } = this.props.appModel
    console.log(loadingStatus) // true
  }
}

const mapStateToProps = (state) => {
  return {
    appModel: state.appModel,
    userModel: state.userModel,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    dispatch,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(appComponent)
```

如果很不幸，你项目中没安装 `react-redux`，那么你只能在每一个组件中，引入这个 store，然后通过 `store.getState()` 拿到 state 值了

但是这种方式的缺陷就是，你要确保你的 state 是最新的，也就是你改完 state 值之后，需要重新 `store.getState()` 拿一下最新的值，这是比较麻烦的

```js
import store from '@your_folder/store' // 这个store就是你使用 Redux.createStore API 生成的store

class appComponent extends React.Component {
  constructor() {
    this.appState = store.getState()['appModel']
  }
}
```

### 数据不可变的(Immutable) ?

在函数式编程语言中，数据是不可变的，所有的数据一旦产生，就不能改变其中的值，如果要改变，那就只能生成一个新的数据。如果有看过 redux 源码的小伙伴一定会知道，为什么每次都要返回一个新的 state，如果没听过，[👉 可以看下这篇文章](https://juejin.im/post/6844904183426973703)

目前 rc-redux-model 内部集成了 `seamless-immutable`，提供一个 model 配置参数 `openSeamlessImmutable`，默认为 false，请注意，如果你的 state 是 Immutable，而在 model 中不设置此配置，那么会报错 !!!

```js
// 使用 seamless-immutable

import Immutable from 'seamless-immutable'

export default {
  namespace: 'appModel',
  state: Immutable({}),
  openSeamlessImmutable: true, // 必须开启此配置
}
```

---

## 🍓 完整例子

1. 新建一个 model 文件夹，该文件夹下新增一个 userModel.js

```js
// model/userModel.js
import adapter from '@common/adapter'

const userModel = {
  namespace: 'userModel',
  state: {
    userInfo: {
      name: 'PDK',
    },
  },
  action: {
    // demo1: 直接获取 state 的值（不推荐使用，建议使用 react-redux 中的 connect 方式获取）
    getUserName: ({ getState }) => {
      const state = getState()['userModel']
      return state.userInfo.name
    },
    // demo2: 发起一个 action，修改 reducers
    storeInfo: ({ currentAction, commit }) => {
      commit({
        type: 'STORE_INFO',
        payload: currentAction.payload,
      })
    },
    // demo3: 发起一个异步请求，异步请求结束之后，再修改 reducers
    fetchUserInfo: async ({ commit, call }) => {
      let res = await call(adapter.callAPI, params)
      if (res.code === 0) {
        commit({
          type: 'CHANGE_USER_INFO',
          payload: res.data,
        })
      }
      return res
    },
    // demo4: 在这个action中，再发起另一个action(此action是其他model的)，比如将请求loading该为true
    fetchList: async ({ dispatch }) => {
      dispatch({
        type: 'globalModel/changeLoadingStatus', // 发一个 globalModel 的 action
      })
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

export default [userModel]
```

3. 处理 models, 注册中间件

```js
// createStore.js
import { createStore, applyMiddleware, combineReducers } from 'redux'
import models from './models'
import RcReduxModel from 'rc-redux-model/lib/index'

const reduxModel = new RcReduxModel(models)
const _rootThunk = reduxModel.thunk
const _rootReducers = reduxModel.reducers

const reducerList = combineReducers(_rootReducers)
return createStore(reducerList, applyMiddleware(_rootThunk))
```

4. 在页面中使用

请注意，这里的 action 都是异步 action，内部中间件的实现方式参考 `redux-thunk`，也就是说，我们 `dispatch` 一个 `action` 都是对应的一个方法，看代码 :

```js
class MyComponents extends React.PureComponent {
  componentDidMount() {
    // demo1 : 通过发起一个 action 获取 state.userModel.userInfo.name
    const userName = this.props.dispatch({
      type: 'userModel/getUserName',
    })
    console.log(userName) // PDK

    // demo2 : 发起一个同步action，修改 reducers中的 state.userModel.userInfo.name
    this.props.dispatch({
      type: 'userModel/storeInfo',
      payload: {
        name: 'demo3',
      },
    })

    // demo3: 发起一个直接修改state的action （不推荐此方法！！！）
    this.props.dispatch({
      type: 'userModel/changeuserInfo',
      payload: {
        userInfo: {
          name: '哈哈哈哈',
        },
      },
    })

    // demo4: 发起一个异步 action，当请求完成之后再修改 reducers 的值
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

    // demo5: 发起一个默认提供的 action，根据用户的 key 转发，直接修改 state 的值 （推荐此方法）
    this.props.dispatch({
      type: 'userModel/setStoreLib',
      payload: {
        key: 'userInfo',
        values: {
          userInfo: {
            name: 'setStoreLib_name',
          },
        },
      },
    })
  }
}
```

## API

每一个 model 接收 5 个属性，具体如下

| 参数                  | 说明                       | 类型    | 默认值 |
| --------------------- | -------------------------- | ------- | ------ |
| namespace             | 必须，且唯一               | string  | -      |
| state                 | 数据状态，必须             | object  | {}     |
| action                | action，非必须             | object  | -      |
| reducers              | reducer，非必须            | object  | -      |
| openSeamlessImmutable | 是否开启 Immutable，非必须 | boolean | false  |

## 提供的默认 Action

```js
 @desc 注册生成默认的action
 @summary 使用方式

 this.props.dispatch({
   type: '[model.namespace]/setStoreLib',
   payload: {
     key: [model.state.key]
     value: [your values]
   }
 })
```

## Maintainers

[@PDKSophia](https://github.com/PDKSophia)

[@SugarTurboS](https://github.com/SugarTurboS)

## Contributing

PRs accepted.

## License

MIT © 2020 PDKSophia

---

This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)
