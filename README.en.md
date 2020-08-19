# rc-redux-model

<img src="https://img.shields.io/badge/rc--redux--modal-v0.0.1-blue" />
<img src="https://img.shields.io/badge/redux-^4.0.1-yellow" />
<img src="https://img.shields.io/badge/author-PDK-inactive" />

[简体中文](./README.md) | English

## how did it come from ?

- [why rc-redux-model and what's rc-redux-model](./RcReduxModel.md)
- [rc-redux-model design ideas and practices](./Design.md)

## install

```bash
npm install --save rc-redux-model
```

## usage

Before using, please read this description again, and then read the `complete example` to get started quickly

> If you want to know how it came, you can check here : [why rc-redux-model and what's rc-redux-model](./RcReduxModel.md)

### how to send an action

```js
const action = {
  type: 'model.namespace/actionName',
  payload: null,
}

this.props.dispatch(action)
```

As shown above, an `action` is composed of `type and payload`, and the naming rule of type is: `model.namespace/actionName`, such as: `userModel/fetchUserInfo`

Please note that every action here is a function, that is, the idea of processing `synchronous action` is the same as processing `asynchronous action`.

If you don’t understand, please move to: [rc-redux-model design ideas and practices](./Design.md)

### who handles asynchronous requests

In `model.action`, each action is a function, and the parameters it receives are:

- dispatch: API provided by the store
- getState: API provided by the store, from which you can get the latest state
- currentAction: the current action of your this.props.dispatch, you can get `type` and `payload` from here
- call: forward the request for you, and will use the Promise package at the same time, of course you can write your own asynchronous logic
- commit: receive an action, the action.type corresponds to the action.type in the reducer, this method is used to dispatch to the reducers to modify the state value

### model description

Each `model` must have `namespace`, `state`, for `action` and `reducers`, it can be written or not

`rc-redux-model` provides an attribute `autoRegisterDefaultAction`, when you set this attribute to `true`, it will automatically construct an action for you, which can directly modify the reducer, such as:

```js
export default {
  namespace: 'userModel',
  autoRegisterDefaultAction: true,
  state: {},
}

// equivalent to:
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

On the business side, we call this action to modify testA and testB in the state

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

## complete example

1. Create a new model folder, add a new `userModel.js` under the folder

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
    // get state value
    getUserName: ({ getState }) => {
      const state = getState()['userModel']
      return state.userInfo.name
    },
    // dispatch an action to modify reducers
    storeInfo: ({ currentAction, commit }) => {
      commit({
        type: 'STORE_INFO',
        payload: currentAction.payload,
      })
    },
    // Start an asynchronous request, after the asynchronous request is over, modify reducers
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

2. Gather all models, please note that what is exported here is an **array**

```js
// model/index.js
import userModel from './userModel'
import exampleModel from './exampleModel'
import yourModel from './yourModel'

export default [userModel, exampleModel, yourModel]
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
import React from 'react'
class MyComponents extends React.PureComponent {
  componentDidMount() {
    // demo1 : Get the user name in the state
    // of course, it is not recommended to get the value of the state in this way
    // it is recommended to get it through connect
    const userName = this.props.dispatch({
      type: 'userModel/getUserName',
    })

    // demo2 : Initiate a synchronous action to modify the value of reducers
    this.props.dispatch({
      type: 'userModel/storeInfo',
      payload: {
        name: '牛逼Plus',
      },
    })

    // demo3 : Initiate an asynchronous action and modify the value of reducers after the request is completed
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
  }
}
```

## Model API

Each model receives 5 attributes, as follows

| parameter                 | description                                                 | type    | defaultValue |
| ------------------------- | ----------------------------------------------------------- | ------- | ------------ |
| namespace                 | the model\'s namespace, Must, and only                      | string  | -            |
| state                     | the model\'s state，Must, and only                          | object  | {}           |
| action                    | action，not necessary                                       | object  | -            |
| reducers                  | reducer，not necessary                                      | object  | -            |
| autoRegisterDefaultAction | inject an action by default, the field description is above | boolean | true         |
