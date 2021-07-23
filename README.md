# rc-redux-model 👋

English | [中文文档](./README.cn.md)

![](https://img.shields.io/npm/dependency-version/hox/peer/react?logo=react)
![](https://img.shields.io/npm/v/rc-redux-model?logo=npm)
![](https://img.shields.io/badge/license-MIT-yellow.svg)
![](https://img.shields.io/badge/author-彭道宽-important.svg)
![](https://img.shields.io/badge/team-SugarTurboS-critical.svg)

> Refer to dva's data flow solution and redux-thunk, internally implement middleware; provide default behavior action, call this action can directly modify any value in state, development is more convenient and concise, support Immutable ~

## ⛏ install

```bash
npm install rc-redux-model --save-dev
```

## ✨ feature

- Lightweight and concise, writing data management is as comfortable as writing `dva`
- Refer to `redux-thunk`, implement your own middleware internally to handle asynchronous actions
- Abandon `redux-saga`, the asynchronous request can be processed by the user, or the provided method can be called to send, the return is a Promise
- Provide the default action Action, call this Action, you can directly modify any value in the state
- Support `Immutable`, just config it to make your data immutable

## ⏳ how did it come from ?

- [why rc-redux-model and what's rc-redux-model](./RcReduxModel.md)
- [rc-redux-model design ideas and practices](./Design.md)

## 🚀 usage

Before using, please read this description again, and then read the `complete example` to get started quickly . [👉 If you want to know how it came, you can check here](https://github.com/PDKSophia/rc-redux-model/issues/1)

1. Create a new model folder, add a new `userModel.js` under the folder

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
    // demo: dispatch an asynchronous request, change `globalModel` loading status
    // after the asynchronous request is over, modify reducers
    fetchUserInfo: async ({ dispatch, call }) => {
      // before the asynchronous request
      dispatch({
        type: 'globalModel/changeLoadingStatus',
        payload: true,
      });
      let res = await call(adapter.callAPI, params);
      // after the asynchronous request
      if (res.code === 0) {
        dispatch({
          type: 'userModel/setStore',
          payload: {
            key: 'userInfo',
            values: res.data,
          },
        });
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

2. Gather all models, please note that what is exported here is an array

```js
// model/index.js
import userModel from './userModel';

export default [userModel];
```

3. Process models, register middleware

```js
// createStore.js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import models from './models';
import RcReduxModel from 'rc-redux-model';

const reduxModel = new RcReduxModel(models);

const reducerList = combineReducers(reduxModel.reducers);
return createStore(reducerList, applyMiddleware(reduxModel.thunk));
```

4. Use in the page

Please note that the actions here are all asynchronous actions. Refer to `redux-thunk` for the implementation of internal middleware. That is to say, one of our `dispatch` and one `action` is a corresponding method. Look at the code:

```js
class MyComponents extends React.PureComponent {
  componentDidMount() {
    // demo1 : dispatch an asynchronous action and modify the value of reducers after the request is completed
    // The request is written by yourself in model.action, which supports Promise.
    // Before we need to callback the data after the request, now you can get it directly by Promise.then()
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

    // demo2: call the `automatically generated default action` and directly modify the value of state.userInfo (this method is recommended)
    this.props.dispatch({
      type: 'userModel/setStore',
      payload: {
        key: 'userInfo',
        values: {
          name: 'sugarTeam',
        },
      },
    });
    // demo3: call the `automatically generated default action` to modify the state in the form of an array (this method is recommended)
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

```js
// Usage with React Redux: Typing the useSelector hook & Typing the useDispatch hook
// https://redux.js.org/recipes/usage-with-typescript#usage-with-react-redux
import { useDispatch } from 'react-redux';

export function useFetchUserInfo() {
  const dispatch = useDispatch();
  return async (userId: string) => {
    // Here I choose to handle the asynchronous by myself.
    // After the asynchronous request is completed, I will pass the data to the reducer.
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

## Related description

For more information about `rc-redux-model`, please move to here : [rc-redux-model design related instructions](./More.md)

## API

Each model receives 5 attributes, as follows

| parameter | description                            | type   | defaultValue |
| --------- | -------------------------------------- | ------ | ------------ |
| namespace | the model\'s namespace, Must, and only | string | -            |
| state     | the model\'s state，Must, and only     | object | {}           |
| action    | action，not necessary                  | object | -            |
| reducers  | reducer，not necessary                 | object | -            |

## default action to change state

- modify single data

```js
// Class Component  Writing
this.props.dispatch({
  type: '[model.namespace]/setStore',
  payload: {
    key: `${model.state.key}`,
    values: `${your values}`
  }
})

// Hooks Writing
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

- modify multiple data

```js
// Class Component  Writing
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


// Hooks Writing
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
