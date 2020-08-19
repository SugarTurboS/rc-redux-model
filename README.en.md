# rc-redux-model

<img src="https://img.shields.io/badge/rc--redux--modal-v0.0.1-blue" />
<img src="https://img.shields.io/badge/redux-^4.0.1-yellow" />
<img src="https://img.shields.io/badge/author-PDK-inactive" />

[简体中文](./README.md) | English

Before that, you can understand [🌈 why rc-redux-model exists ?](./REASON.en.md)

## install

```bash
npm install --save rc-redux-model
```

## usage

1. register in middleware

```js
// createStore.js
import { createStore, applyMiddleware, combineReducers } from 'redux'
import models from './models'
import RcReduxModel from 'rc-redux-model'

const reduxModel = new RcReduxModel(models)
const rootReducers = combineReducers(reduxModel.reducers)
const rootMiddleWare = reduxModel.createThunkMiddleWare()

return createStore(rootReducers, applyMiddleware(rootMiddleWare))
```

2. Using in the page

If you have `react-redux` installed, it is recommended that you use it

```js
// In the root component App.js import store
import store from './createStore'
import { Provider } from 'react-redux'

function App() {
  return <Provider store={store}></Provider>
}
```

Of course, if you don't have `react-redux` installed, you can only use it in components

```js
// Store is introduced into each page, and through store.getState () [namespace] gets the current state
import store from './createStore';

class UserComponent from React.Component {
  constructor(props) {
    this.dispatch = store.dispatch();
    this.userModel = store.getState().userReducer;
  }
}
```

3. how to send an asynchronous request

```js
// have react-redux installed
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

// don't have react-redux
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

## explain

### dispatch type

On top of it, we can see `type: 'userModel/fetchUserInfo'`

- the `userModel` is `model namespace`
- the `fetchUserInfo` is `action name` or `reducer name`

### model structure

- **namespace**，The namespace of the module

  > namespace should be unique

- **state**，current state value

- **action**， It is the only source of store data.

  > Action is the payload that transfers data from the application to the store.

- **reducer**，It processes the update of the state according to the action.
  > If there is no update or an unknown action is encountered, it returns the old state; otherwise, it returns a new state object.

## support hooks

yep，`rc-redux-model` also supports hooks，We provide API properties，Now, let's see how to use it

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

We can use it on the page

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
