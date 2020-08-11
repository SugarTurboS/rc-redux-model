# rc-redux-model

<img src="https://img.shields.io/badge/rc--redux--modal-v0.0.1-blue" />
<img src="https://img.shields.io/badge/redux-^4.0.1-yellow" />
<img src="https://img.shields.io/badge/author-PDK-inactive" />

## Background

Why is there a library called `rc-redux-model`? Take me as an example, as a react CV engineer, every time I write a project, I need ...

- Create a new project through `create-react-app`
- Install `react-redux`, call the Provider mode, so that self-components can get the store value
- Installing `redux-thunk` allows us to write asynchronous action creators, which return functions, not objects
- Install `redux-saga` to solve asynchronous processing of requests
- If you want to see log, then I will also install `redux-logger`
- ...

At the same time, I encountered some problems , for example ...

1. Deteriorating walking ability

By default, **redux only supports synchronous operations**, allowing users to choose asynchronous processing methods by themselves. **Redux is powerless for asynchronous requests**. At this time `redux-saga plays` its role.

But, I have encountered a small problem again, that is the syntax of ES6 `Generator function`, which makes the friends who use saga for the first time puzzled. Compared with `generator yield`, I think everyone is more concerned about `async/await`, Will the syntax of `Promise` be more familiar?

2. Asynchronous request status

"The same world, the same interaction designer" generally requires that when the request is sent, there is a `loading` effect. After the request is completed, the data will be displayed~ So this time we write by ourselves:

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

3. Long-winded boilerplate code

I feel quite deep. For example, if we want to write a user module, we need to create `sagas/user.js`, `reducers/user.js`, and `actions/user.js`. If you want to manage const in a unified way, then you will There is a `const/user.js`, and then switch back and forth between these files.

For example 🌰: Asynchronous request to obtain user information, you need to write a complete set of boilerplate code

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

That's right, this kind of boilerplate code is simply CV operation. Personally, **it makes me not focused enough**. I need to keep leaping thinking to manage a set of processes of const, action, saga, and reducer.

And the number of files will increase. I don’t know what everyone thinks. I really don’t like such a cumbersome process. Is there a good framework that can help me do all these things?

## dva

_Everything in the world must have its own value and meaning_. The emergence of dva must have solved some problems. Let's see what dva official website says ~~

**dva is first a data flow solution based on redux and redux-saga, and then in order to simplify the development experience, dva also built-in react-router and fetch, so it can also be understood as a lightweight application framework**.

For me, I like its data flow solution, but I don’t want to use its built-in library, including what I said before, I don’t even like the form of `generator yield`, I purely like it for data flow. Processing method~

I like it to encapsulate reducer, initialState, action, and saga together in a model. For example, its official website says:

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

Can I also write a middleware to implement a set of `redux + async/await fetch` mechanism I want? It does not need its built-in `fetch`, `react-router`, nor `dva-loading`, `redux-saga`, but refer to its model to implement `app.model()`? So `rc-redux-model` just appeared
