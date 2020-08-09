# rc-redux-model

<img src="https://img.shields.io/badge/rc--redux--modal-v0.0.1-blue" />

<img src="https://img.shields.io/badge/redux-^4.0.1-yellow" />

<img src="https://img.shields.io/badge/author-PDK-inactive" />

## 背景

为什么会有 `rc-redux-model` 这个库呢？以我为例，作为一名菜鸡工程师，我每次写一个项目，我都需要 ...

- create-react-app 起一个项目
- 安装 react-redux ，调用 Provider 提供者模式，使得自组件都能取到 store 值
- 安装 redux-thunk ，使得我们能够编写异步 action creator，它返回的是函数，而不是对象
- 安装 redux-saga ，解决请求异步处理
- 如果想看到日志，那么我还会安装 redux-logger
- ....

我绝 b 没有吐槽的意思哈～ 当我把上边的库都安装完了之后，我开始撸需求了，于是乎... 我感觉我又遇到了一些问题，比如 :

1. 低下的异步处理能力

redux 默认只支持同步操作，让使用者自行选择异步处理方法，对于异步请求 redux 是无能为力的。这时候 redux-saga 就发挥它的左右了，but，又遇到个小问题了，那就是 ES6 的 `Generator 函数的语法`，这让初次使用 saga 的小伙伴心生疑惑，相比 `generator yield` ，我想大家对 `async/await`、`Promise` 的语法会更加熟悉点吧？

2. 异步请求状态

“同一个世界，同一个交互设计师”，一般都会要求，请求发送的时候，有一个 `loading` 效果，请求完成之后，再显示数据～ 所以这时候都是我们自己写 ：

```js
state = {
  loading: false;
}

onFetchUserInfo = async () => {
  this.setState({
    loading: true
  })
  const res = await this.props.dispatch(action.fetchUserInfo);
  if (res.code === 200) {
    this.setState({
      loading: false
    })
  }
}
```

CV 工程师莫过于我了，那么能不能把它封装起来呢？等价于，每次请求都能给我返回一个 `loading status`，“我用不用是我的事，但是你得提供给我啊”

3. 啰嗦的样板代码

感受颇深，比如我们要写一个用户模块，那么需要创建 `sagas/user.js`、`reducers/user.js`、`actions/user.js`，如果你想统一管理 const，那么你还会有一个 `const/user.js`，然后在这些文件之间来回切换。

举个 🌰 : 异步请求，获取用户信息，就需要写一整套样板代码

```js
// const.js
const FETCH_USER_INFO = 'FETCH_USER_INFO'
const FETCH_USER_INFO_SUCCESS = 'FETCH_USER_INFO_SUCCESS'
```

```js
// action.js
export function fetchUserInfo(params, callback) {
  return {
    type: FETCH_USER_INFO,
    params,
    callback,
  }
}
```

```js
// saga.js
function* fetchUserInfoSaga({ params, callback }) {
  const res = yield call(fetch.callAPI, {
    actionName: FETCH_USER_INFO,
    params,
  })
  if (res.code === 0) {
    yield put({
      type: FETCH_USER_INFO_SUCCESS,
      data: res.data,
    })
    callback && callback()
  } else {
    throw res.msg
  }
}
```

```js
// reducer.js
function userReducer(state, action) {
  switch (action.type) {
    case FETCH_USER_INFO_SUCCESS:
      return Immutable.set(state, 'userInfo', action.data)
  }
}
```

没错，这种样板代码，简直就是 CV 操作，对我个人而言，这会让我不够专注，分散管理 const、action、saga、reducer 一套流程，需要不断的跳跃思路。

而且文件数量会变多，不知道大家怎么想，我是真的不喜欢如此`繁琐`的流程，有没有好的框架能帮我把这些事都做完呢？

## dva

世间万物存在，必然有它自身的价值和意义。dva 的出现，肯定是解决了一些问题。我们看看 dva 官网怎么说的 ~~

**dva 首先是一个基于 redux 和 redux-saga 的数据流方案，然后为了简化开发体验，dva 还额外内置了 react-router 和 fetch，所以也可以理解为一个轻量级的应用框架。**

对于我来讲，我喜欢它的数据流方案，但我不想用它内置库，包括我前边说了，我甚至不喜欢 `generator yield` 这种形式，我纯粹的喜欢它对数据流这块的处理方式~

我喜欢它在一个 model 里边把 reducer, initialState, action, saga 都封装到一起，比如它官网说的 :

```js
app.model({
  namespace: 'user',
  state: {
    userInfo: {},
    loading: false,
  },
  subscriptions: [
    function (dispatch) {
      dispatch({ type: 'user/query' })
    },
  ],
  effects: {
    ['user/query']: function* () {
      yield call(delay(800))
      yield put({
        type: 'user/query/success',
      })
    },
  },
  reducers: {
    ['user/query'](state) {
      return { ...state, loading: true }
    },
    ['user/query/success'](state, { payload }) {
      return { ...state, loading: false, userInfo: payload }
    },
  },
})
```

那我是不是也可以写一个中间件，实现一套自己想要的 `redux + async/await fetch`机制呢？不需要它内置的 `fetch`、`react-router`，也不需要`dva-loading`、`redux-saga`，但是参考它的 model，实现 `app.model()` ？ 于是 `rc-redux-model` 就这么出现了
