## 相关说明

在使用之前，请了解几个知识点，然后再看`完整例子`即可快速上手使用 !!! [👉 如果你想了解它是怎么来的，点这里](https://github.com/PDKSophia/rc-redux-model/issues/1)

#### 如何定义一个 model 并自动注册 action 及 reducers ?

_每一个 model 必须带有 namespace、state_，action 与 reducers 可不写，如需开启 `immutable`，需配置 `openSeamlessImmutable = true`，一个完整的 model 结构如下

```js
export default {
  namespace: '[your model.namespace]',
  state: {
    testA: '',
    testB: false,
    testC: [],
    testD: {},
  },
}
```

`rc-redux-model` 会根据你的 state，每一个 state 的字段都会自动注册一个修改此 state 的 action，从而释放你键盘上的 ⌨️ CV 键， 例如 :

```
state: {
  userName: 'oldValue'
}
```

那么会自动为你注册一个 action，action 名以 `set${stateName}` 格式，如你的 stateName 为 : userName，那么会自动注册的 action 为 : `setuserName`

```
action: {
  setuserName: ({ dispatch, getState, commit, call, currentAction }) => {}
}
```

你只要在组件中调用此 action 即可修改 state 值 （📢 不推荐使用这种 action 进行修改 state 值，推荐使用 **setStore**）

```js
this.props.dispatch({
  type: 'userModel/setuserName',
  payload: {
    userName: 'newValue',
  },
})
```

问题来了，当 state 中的值很多(比如有几十个)，那么为用户自动注册几十个 action，用户在使用上是否需要记住每一个 state 对应的 action 呢？这肯定是极其不合理的，所以一开始是提供一个默认的 action ，用于修改所有的 state 值 ...

随之而来的问题是，如果只提供一个 action，那么所有修改 State 的值都走的这个 action.type，在 [redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension) 中，会看不到具体的相对信息记录(因为都是同一个 action)，最终，还是提供一个默认的 action，此 action 会根据用户提供的 `payload.key`，从而转发至对应的 action 中。

> ✨ 对外提供统一默认 action，方面用户使用；对内根据 key，进行真实 action 的转发

```js
this.props.dispatch({
  type: '[model.namespace]/setStore',
  payload: {
    key: [model.state.key]  // 你要修改的state key
    values: [your values] // 你要修改的值
  }
})
```

🌟 所有修改 state 的 action，**都通过 setStore 来发**，不必担心在 redux devtools 中找不到，此 action 只是会根据你的 key，转发对应的 action 而已

#### 如何发送一个 action ?

一个 action 由 type、payload 组成，type 的命名规则为 : `[model.namespace / actionName]`

```js
// 下边是 namespace = appModel ，actionName = fetchUserList 的例子
const action = {
  type: 'appModel/fetchUserList',
}
// 发起这个 action
this.props.dispatch(action)
```

请注意，这里的每一个 action 都是 function, 也就是说，处理 `同步action` 的思路跟处理 `异步action`是一样的，如果你不明白，[👉 请移步这里](https://github.com/PDKSophia/rc-redux-model/issues/2)

#### 异步请求由谁处理 ?

在 `model.action` 中，每一个 action 都是 function，它的回调参数为 :

- dispatch : store 提供的 API，你可以调用 `dispatch` 继续分发 action
- getState : store 提供的 API，通过该 API 你可以得到最新的 state
- currentAction : 当前你 `this.props.dispatch` 的 action，你可以从这里拿到 `type` 和 `payload`
- call : 替你转发请求，同时会使用 Promise 包裹，当然你可以自己写异步逻辑
- commit : 接收一个 action，该方法用于 dispatch action 到 reducers ，从而修改 state 值

> 可以自己处理异步，再通过调用默认提供的 [model.namespace/setStore] 这个 action 进行修改 state 值

#### 如何在组件中获取 state 值？

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
    reportTaskInfo: state.reportModel.taskInfo, // 其他 model 的值
  }
}

export default connect(mapStateToProps)(appComponent)
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

#### 数据不可变的(Immutable) ?

在函数式编程语言中，数据是不可变的，所有的数据一旦产生，就不能改变其中的值，如果要改变，那就只能生成一个新的数据。如果有看过 redux 源码的小伙伴一定会知道，为什么每次都要返回一个新的 state，如果没听过，[👉 可以看下这篇文章](https://juejin.im/post/6844904183426973703)

目前 rc-redux-model 内部集成了 `seamless-immutable`，提供一个 model 配置参数 `openSeamlessImmutable`，默认为 false，请注意，如果你的 state 是 Immutable，而在 model 中不设置此配置，那么会报错 !!!

```js
// 使用 seamless-immutable

import Immutable from 'seamless-immutable'

export default {
  namespace: 'appModel',
  state: Immutable({
    username: '',
  }),
  openSeamlessImmutable: true, // 必须开启此配置
}
```

#### 类型正确性 ？

不可避免，有时在 `model.state` 中定义好某个值的类型，但在改的时候却将其改为另一个类型，例如 :

```js
export default {
  namespace: 'userModel',
  state: {
    name: '', // 这里定义 name 为 string 类型
  },
}
```

但在修改此 state value 时，传递的确是一个非 string 类型的值

```js
this.props.dispatch({
  type: 'userModel/setStore',
  payload: {
    key: 'name',
    values: {}, // 这里name 变成了object
  },
})
```

这其实是不合理的，在 rc-redux-model 中，会判断 `state[key]` 中的类型与 payload 传入的类型进行比较，如果类型不相等，报错提示

所有修改 state 的值，前提是 : 该值已经在 state 中定义，以下情况也会报错提示

```js
export default {
  namespace: 'userModel',
  state: {
    name: '', // 这里只定义 state 中存在 name
  },
}
```

此时想修改 state 中的另一属性值

```js
this.props.dispatch({
  type: 'userModel/setStore',
  payload: {
    key: 'age',
    values: 18, // 这里想修改 age 属性的值
  },
})
```

极度不合理，因为你在 state 中并没有声明此属性， rc-redux-model 会默认帮你做检测
