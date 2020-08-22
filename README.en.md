# rc-redux-model 👋

[简体中文](./README.md) | English

![](https://img.shields.io/badge/author-彭道宽-important.svg)
![](https://img.shields.io/badge/team-SugarTurboS-critical.svg)
![](https://img.shields.io/badge/category-Redux-blue.svg)
![](https://img.shields.io/badge/category-React-yellowgreen.svg)
![](https://img.shields.io/badge/rc--redux--modal-v1.0.3-green.svg)
![](https://img.shields.io/badge/redux-^4.0.1-inactive.svg)
![](https://img.shields.io/badge/license-MIT-yellow.svg)

> Refer to dva's data flow solution and redux-thunk, internally implement middleware; provide default behavior action, call this action can directly modify any value in state, development is more convenient and concise, support Immutable ~

## ✨ feature

- Lightweight and concise, writing data management is as comfortable as writing `dva`
- Abandon `redux-saga`, the asynchronous request can be processed by the user, or the provided method can be called to send, the return is a Promise
- Refer to `redux-thunk`, implement your own middleware internally to handle asynchronous actions
- Provide the default action Action, call this Action, you can directly modify any value in the state
- Support `Immutable`, just config it to make your data immutable

## ⛏ install

```bash
npm install --save rc-redux-model
```

## ⏳ how did it come from ?

- [why rc-redux-model and what's rc-redux-model](./RcReduxModel.md)
- [rc-redux-model design ideas and practices](./Design.md)

## 🚀 usage

Before using, please read this description again, and then read the `complete example` to get started quickly . [👉 If you want to know how it came, you can check here](./RcReduxModel.md)

### how to send an action

**an action composed of type、payload，The naming rule for type is : model.namespace / actionName**

```js
// demo for  namespace = appModel ，actionName = fetchUserList 
const action = {
  type: 'appModel/fetchUserList',
}
// send action
this.props.dispatch(action)
```

As shown above, **an action is composed of type and payload. The naming rule of type is: model.namespace/actionName, such as: [userModel/fetchUserInfo ]**

Please note that every action here is a function, that is, the idea of processing `synchronous action` is the same as processing `asynchronous action`.

If you don’t understand, [👉 please click here](./Design.md)

### who handles asynchronous requests

In `model.action`, each action is a function, and the parameters it receives are:

- dispatch: API provided by the store, You can call this `dispatch` to continue dispatching the action
- getState: API provided by the store, from which you can get the latest state
- currentAction: the current action of your this.props.dispatch, you can get `type` and `payload` from here
- call: forward the request for you, and will use the Promise package at the same time, of course you can write your own asynchronous logic
- commit: receive an action, the action.type corresponds to the action.type in the reducer, this method is used to dispatch to the reducers to modify the state value

### model description

Each `model` must contain `namespace`, `state`, and must contain

The middleware will automatically register an Action for you. **Every state field will automatically register an Action to modify the state**, such as:

```
state: {
  userName: 'oldValue'
}
```

Then it will automatically register an Action for you

```
action: {
  changeuserName: ({ dispatch, getState, commit, call, currentAction }) => {}
}
```

You only need to call this Action to modify the state value

```js
this.props.dispatch({
  type: 'userModel/changeuserName',
  payload: {
    userName: 'newValue',
  },
})
```

Here comes the problem. If only one Action is provided, then all the modified State values ​​will follow this `Action.type`

in [redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension) , You will not see the record (because they are all the same Action), but the user will be confused if too many actions are provided, so it is recommended to use this Action only

```js
this.props.dispatch({
  type: '[model.namespace]/setStoreLib',
  payload: {
    key: [model.state.key]  // 你要修改的state key
    value: [your values] // 你要修改的值
  }
})
```

**<span style="color: #FA5523">All actions that modify state are sent through setStoreLib. Don’t worry about not being found in redux devtools. This action will just forward the corresponding action based on your key.</span>**

---

## complete example

1. Create a new model folder, add a new `userModel.js` under the folder

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
    // demo1: get state value
    getUserName: ({ getState }) => {
      const state = getState()['userModel']
      return state.userInfo.name
    },
    // demo2: dispatch an action to modify reducers
    storeInfo: ({ currentAction, commit }) => {
      commit({
        type: 'STORE_INFO',
        payload: currentAction.payload,
      })
    },
    // demo3: dispatch an asynchronous request, after the asynchronous request is over, modify reducers
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
    // demo4: In this action, dispatch another action (this action is from another model), such as loading the request to true
    fetchList: async ({ dispatch }) => {
      dispatch({
        type: 'globalModel/changeLoadingStatus', //globalModel's action
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

2. Gather all models, please note that what is exported here is an **array**

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

Please note that **the actions here are all asynchronous actions**. Refer to `redux-thunk` for the implementation of internal middleware. That is to say, one of our `dispatch` and one `action` is a corresponding method. Look at the code:

```js
class MyComponents extends React.PureComponent {
  componentDidMount() {
    // demo1 : dispatch an action to get state.userModel.userInfo.name
    const userName = this.props.dispatch({
      type: 'userModel/getUserName',
    })
    console.log(userName) // PDK

    // demo2 : dispatch a synchronous action to modify the state.userModel.userInfo.name
    this.props.dispatch({
      type: 'userModel/storeInfo',
      payload: {
        name: 'demo3',
      },
    })

    // demo3: dispatch an action to directly modify the state (this method is not recommended!!!)
    this.props.dispatch({
      type: 'userModel/changeuserInfo',
      payload: {
        userInfo: {
          name: '哈哈哈哈',
        },
      },
    })

    // demo4 : dispatch an asynchronous action and modify the value of reducers after the request is completed
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

    // demo5: dispatch a default action, forward according to the user's key, directly modify the value of state (this method is recommended)
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

## Model API

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
   type: '[model.namespace]/setStoreLib',
   payload: {
     key: [model.state.key]
     value: [your values]
   }
 })
```
