# rc-redux-model 👋

[简体中文](./README.md) | English

![](https://img.shields.io/npm/dependency-version/hox/peer/react?logo=react)
![](https://img.shields.io/npm/v/rc-redux-model?logo=npm)
![](https://img.shields.io/badge/license-MIT-yellow.svg)
![](https://img.shields.io/badge/author-彭道宽-important.svg)
![](https://img.shields.io/badge/team-SugarTurboS-critical.svg)

> Refer to dva's data flow solution and redux-thunk, internally implement middleware; provide default behavior action, call this action can directly modify any value in state, development is more convenient and concise, support Immutable ~

## ⛏ install

```bash
npm install --save rc-redux-model
```

## ✨ feature

- Lightweight and concise, writing data management is as comfortable as writing `dva`
- Abandon `redux-saga`, the asynchronous request can be processed by the user, or the provided method can be called to send, the return is a Promise
- Refer to `redux-thunk`, implement your own middleware internally to handle asynchronous actions
- Provide the default action Action, call this Action, you can directly modify any value in the state
- Support `Immutable`, just config it to make your data immutable


## ⏳ how did it come from ?

- [why rc-redux-model and what's rc-redux-model](./RcReduxModel.md)
- [rc-redux-model design ideas and practices](./Design.md)

## 🚀 usage

Before using, please read this description again, and then read the `complete example` to get started quickly . [👉 If you want to know how it came, you can check here](https://github.com/PDKSophia/rc-redux-model/issues/1)

1. Create a new model folder, add a new `userModel.js` under the folder

```js
import adapter from '@common/adapter'

const userModel = {
  namespace: 'userModel',
  openSeamlessImmutable: false,
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
      })
      let res = await call(adapter.callAPI, params)
      // after the asynchronous request
      if (res.code === 0) {
        dispatch({
          type: 'userModel/setStore',
          payload: {
            key: 'userInfo',
            values: res.data,
          },
        })
        dispatch({
          type: 'globalModel/changeLoadingStatus',
          payload: false,
        })
      }
      return res
    },
  },
}

export default userModel
```

2. Gather all models, please note that what is exported here is an array

```js
// model/index.js
import userModel from './userModel'

export default [userModel]
```

3. Process models, register middleware

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

4. Use in the page

Please note that the actions here are all asynchronous actions. Refer to `redux-thunk` for the implementation of internal middleware. That is to say, one of our `dispatch` and one `action` is a corresponding method. Look at the code:

```js
class MyComponents extends React.PureComponent {
  componentDidMount() {
    // demo1 : dispatch an action to get userModel.userInfo.name
    this.props.dispatch({
      type: 'userModel/getUserName',
    }).then(userName => {
      console.log(userName)
    })

    // demo2 : dispatch a synchronous action to modify the userModel.userInfo.name
    this.props.dispatch({
      type: 'userModel/setStore',
      payload: {
        name: 'demo3',
      },
    })

    // demo3 : dispatch an asynchronous action and modify the value of reducers after the request is completed
    // The request is written by yourself in model.action, which supports Promise.
    // Before we need to callback the data after the request, now you can get it directly by Promise.then()
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

    // demo4: dispatch a default action, directly modify the value of state (this method is recommended)
    this.props.dispatch({
      type: 'userModel/setStoreLib',
      payload: {
        key: 'userInfo',
        values: {
          name: 'setStoreLib_name',
        },
      },
    })
    // demo5: dispatch a default action, directly modify the value of more state (this method is recommended)
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
        }
      ]
    })
  }
}
```
## API

Each model receives 5 attributes, as follows

| parameter | description                            | type   | defaultValue |
| --------- | -------------------------------------- | ------ | ------------ |
| namespace | the model\'s namespace, Must, and only | string | -            |
| state     | the model\'s state，Must, and only     | object | {}           |
| action    | action，not necessary                  | object | -            |
| reducers  | reducer，not necessary                 | object | -            |

## default action to change state

```js
 @desc: register to generate the default action

this.props.dispatch({
   type: '[model.namespace]/setStore',
   payload: {
     key: `${model.state.key}`
     values: `${your values}`
   }
 })
```

```js
 @desc: register to generate the default action

this.props.dispatch({
  type: '[model.namespace]/setStoreList',
  payload: [
    {
      key: `${model.state.key}`
      values: `${your values}`
    },
    {
      key: `${model.state.key}`
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
