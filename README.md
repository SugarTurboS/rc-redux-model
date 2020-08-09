# rc-redux-model

<img src="https://img.shields.io/badge/rc--redux--modal-v0.0.1-blue" />

<img src="https://img.shields.io/badge/redux-^4.0.1-yellow" />

<img src="https://img.shields.io/badge/author-PDK-inactive" />

简体中文 | [English](./README.en.md)

## 安装

```bash
npm install --save rc-redux-model
```

## 使用

1. 注册中间件

```js
// createStore.js
import { createStore, applyMiddleware, combineReducers } from 'redux'
import models from './models'
import RcReduxModel from 'rc-redux-model'

const models = new RcReduxModel(models)
const rootReducers = combineReducers(models.reducers)
const rootMiddleWare = [models.createThunkMiddleWare()]

return createStore(rootReducers, applyMiddleware(...rootMiddleWare))
```

2. 在页面中使用

如果你安装了 `react-redux`，那么建议你这么使用

```js
// 在根组件App.js引入store
import store from './createStore'
import { Provider } from 'react-redux'

function App() {
  return <Provider store={store}></Provider>
}
```

当然，如果你没安装 `react-redux`, 那你只能在组件(页面)中这么使用了

```js
// 各页面引入store，通过 store.getState()[namespace] 获取对应的state
import store from './createStore';

class UserComponent from React.Component {
  constructor(props) {
    this.dispatch = store.dispatch();
    this.userModel = store.getState().userReducer;
  }
}
```

3. 如何发送一个异步请求

```js
// 安装了 react-redux
this.props
  .dispatch({
    type: 'userModel/fetchUserInfo',
  })
  .then((result) => {
    console.log('success', result)
  })
  .catch((error) => {
    console.log('catch', error)
  })

// 没有安装 react-redux
this.dispatch = store.dispatch()

this.dispatch({
  type: 'userModel/fetchUserInfo',
})
  .then((result) => {
    console.log('success', result)
  })
  .catch((error) => {
    console.log('catch', error)
  })
```

## 说明

### dispatch type

在上面的例子，我们可以看到 `type: 'userModel/fetchUserInfo'`

- `userModel` 是 `model`的命名空间
- `fetchUserInfo` is `action` 或 `reducer` 的方法名

### model 结构

- **namespace**，model 的命名空间

  > namespace 必须唯一 !!!

- **state**，当前的 state

- **action**， 修改 state 的唯一来源

  > Action 是把数据从应用传到 store 的有效载荷。

- **reducer**，它根据 action 处理 state 的更新

  > 如果没有更新或遇到未知 action，则返回旧 state；否则返回一个新 state 对象。

## 支持 hooks

yep，`rc-redux-model` 同样支持 hooks，我们提供一个 API，现在，让我们看看如何使用它~~

```js
// models/userModel.js
import { createReduxModelHooks } from 'rc-redux-model'

const userModel = {
  namespace: 'userModel',
  state: {
    userInfo: {},
    loading: false,
  },
  action: {},
  reducers: {},
}

const [
  useCreateFunctionModel,
  useMethodToChangeModel,
  useSelectorModel,
] = createReduxModelHooks(userModel)

export { useCreateFunctionModel, useMethodToChangeModel, useSelectorModel }
export default userModel
```

我们可以在 hooks 中使用

```js
import {
  useCreateFunctionModel,
  useMethodToChangeModel,
  useSelectorModel,
} from './models/userModel'

function UserComponent() {
  const [userInfo, changeUserInfo] = useCreateFunctionModel() // return userInfo state and change userInfo function

  // get userModel(namespace) state value
  const userInfo = useSelectorModel('userModel/userInfo') // userInfo state value
  const userLoading = useSelectorModel('userModel/loading') // loading state value

  // create a method to modify userModel(namespace) state value
  const changeUserInfo = useMethodToChangeModel('userModel/userInfo') // change userInfo state value
  const changeUserLoading = useMethodToChangeModel('userModel/loading') // change loading state value
}
```
