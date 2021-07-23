# rc-redux-model 👋

中文文档 | [English](./README.md)

![](https://img.shields.io/npm/dependency-version/hox/peer/react?logo=react)
![](https://img.shields.io/npm/v/rc-redux-model?logo=npm)
![](https://img.shields.io/badge/license-MIT-yellow.svg)
![](https://img.shields.io/badge/author-彭道宽-important.svg)
![](https://img.shields.io/badge/team-SugarTurboS-critical.svg)

> ✍️ 提供一种较为舒适的数据状态管理书写方式，让你简洁优雅的去开发；内部自动生成 action, 只需记住一个 action，可以修改任意的 state 值，方便简洁，释放你的 CV 键～

## ⛏ 安装

```bash
npm install rc-redux-model --save-dev
```

## ✨ 特性

- 轻巧简洁，写数据管理就跟写 `dva` 一样舒服
- 参考 `redux-thunk`，内部实现独立的中间件，所有的 action 都是异步 action
- 异步请求由用户自行处理，内部支持 call 方法，可调用提供的方法进行转发，该方法返回的是一个 Promise
- 提供默认行为 action，调用此 action ，可以修改任意的 state 值，解决你重复性写 action 、reducers 问题
- 内置 `seamless-immutable` ，只需开启配置，让你的数据不可变
- 默认检测不规范的赋值与类型错误，让你的数据更加健壮

## ⏳ 前世今生

- [why rc-redux-model and what's rc-redux-model](https://github.com/PDKSophia/rc-redux-model/issues/1)
- [rc-redux-model design ideas and practices](https://github.com/PDKSophia/rc-redux-model/issues/2)

## 🧱 强调说明

**rc-redux-model 出发点在于解决繁琐重复的工作，store 文件分散，state 类型和赋值错误的问题，为此，对于跟我一样的用户，提供了一个写状态管理较为[舒服]的书写方式，大部分情况下兼容原先项目**~

- 为了解决[store 文件分散]，借鉴了 dva 状态管理的方式，一个 model 中写 `action、state、reducers`
- 为了解决[繁琐重复的工作]，提供默认的 action，用户不需要自己写修改 state 的 action 和 reducer，只需要调用默认提供的 `[model.namespace/setStore]` 即可，从而将一些重复性的代码从 model 文件中剔除，也可通过 `[model.namespace/setStoreList]` 方式批量修改 state
- 为了解决[state 类型和赋值错误]，在每次修改 state 值时候，都会进行检测，如果不通过则报错提示

## 🚀 使用

如有疑问，看下边的相关说明~ 同时对于如何在项目中使用，[👉 可以点这里](https://github.com/PDKSophia/rc-redux-model/issues/3)

### 复杂且真实的例子

1. 新建一个 model 文件夹，该文件夹下新增一个 userModel.js

```js
import adapter from '@common/adapter';

const userModel = {
  namespace: 'userModel',
  openSeamlessImmutable: true,
  state: {
    classId: '',
    studentList: [],
    userInfo: {
      name: 'PDK',
    },
  },
  action: {
    // demo: 发起一个异步请求，修改 globalModel的 loading 状态，异步请求结束之后，修改 reducers
    // 此异步逻辑，可自行处理，如果采用 call，那么会通过 Promise 包裹一层帮你转发
    fetchUserInfo: async ({ dispatch, call }) => {
      // 请求前，将 globalModel 中的 loading 置为 true
      dispatch({
        type: 'globalModel/changeLoadingStatus',
        payload: true,
      });
      let res = await call(adapter.callAPI, params);
      if (res.code === 0) {
        dispatch({
          type: 'userModel/setStore',
          payload: {
            key: 'userInfo',
            values: res.data,
          },
        });
        // 请求结束，将 globalModel 中的 loading 置为 false
        dispatch({
          type: 'globalModel/changeLoadingStatus',
          payload: false,
        });
      }
      return res;
    },
  },
};

export default userModel;
```

2. 聚集所有的 models，请注意，这里导出的是一个 **数组**

```js
// model/index.js
import userModel from './userModel';

export default [userModel];
```

3. 处理 models, 注册中间件

```js
// createStore.js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import models from './models';
import RcReduxModel from 'rc-redux-model';

const reduxModel = new RcReduxModel(models);

const reducerList = combineReducers(reduxModel.reducers);
return createStore(reducerList, applyMiddleware(reduxModel.thunk));
```

4. 在页面中使用

请注意，这里的 action 都是异步 action，内部中间件的实现方式参考 `redux-thunk`，也就是说，我们 `dispatch` 一个 `action` 都是对应的一个方法，看代码 :

```js
class MyComponents extends React.PureComponent {
  componentDidMount() {
    // demo1: 发起一个异步请求
    // 具体的请求，在 model.action 中自己写，支持 Promise，之前需要 callback 回调请求后的数据，现在直接 then 获取
    this.props
      .dispatch({
        type: 'userModel/fetchUserInfo',
      })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });

    // demo2: 调用自动生成的默认action，直接修改 state.userInfo 的值 （推荐此方法）
    this.props.dispatch({
      type: 'userModel/setStore',
      payload: {
        key: 'userInfo',
        values: {
          name: 'sugarTeam',
        },
      },
    });
    // demo2: 调用自动生成的默认action，以数组形式修改state （推荐此方法）
    this.props.dispatch({
      type: 'userModel/setStoreList',
      payload: [
        {
          key: 'userInfo',
          values: {
            name: 'sugarTeam',
          },
        },
        {
          key: 'classId',
          values: 'sugarTurboS-666',
        },
      ],
    });
  }
}
```

## hooks ?

hooks 的出现，让我们看到了处理复杂且重复逻辑的曙光，那么问题来了，在 hooks 中能不能用 `rc-redux-model` ，我想说 : “想啥呢，一个是 react 的特性，一个是 redux 的中间件， 冲突吗？”

```js
// Usage with React Redux: Typing the useSelector hook & Typing the useDispatch hook
// https://redux.js.org/recipes/usage-with-typescript#usage-with-react-redux
import { useDispatch } from 'react-redux';

export function useFetchUserInfo() {
  const dispatch = useDispatch();
  return async (userId: string) => {
    // 这里我选择自己处理异步，异步请求完后，再把数据传到 reducer 中
    const res = await MyAdapterAPI(userId);
    if (res.code === 200) {
      dispatch({
        type: 'userModel/setStore',
        payload: {
          key: 'userInfo',
          values: res.data,
        },
      });
    }
  };
}
```

## 相关说明

更多关于 `rc-redux-model` 的相关说明，可移步至此 : [rc-redux-model 设计相关说明](./More.md)

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

- 修改单条数据

```js
// Class Component 写法
this.props.dispatch({
  type: '[model.namespace]/setStore',
  payload: {
    key: `${model.state.key}`,
    values: `${your values}`
  }
})

// Hooks 写法
import { useDispatch } from 'react-redux';
const dispatch = useDispatch();
dispatch({
  type: '[model.namespace]/setStore',
  payload: {
    key: `${model.state.key}`,
    values: `${your values}`
  }
})
```

- 修改多条数据

```js
// Class Component 写法
this.props.dispatch({
  type: '[model.namespace]/setStoreList',
  payload: [
    {
      key: `${model.state.key}`,
      values: `${your values}`
    },
    {
      key: `${model.state.key}`,
      values: `${your values}`
    }
  ]
})


// Hooks 写法
import { useDispatch } from 'react-redux';
const dispatch = useDispatch();
dispatch({
  type: '[model.namespace]/setStoreList',
  payload: [
    {
      key: `${model.state.key}`,
      values: `${your values}`
    },
    {
      key: `${model.state.key}`,
      values: `${your values}`
    }
  ]
})
```

## Maintainers

[@PDKSophia](https://github.com/PDKSophia)

[@SugarTurboS](https://github.com/SugarTurboS)

## Contributing

PRs accepted.

## License

MIT © 2020 PDKSophia/SugarTurboS

---

This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)
