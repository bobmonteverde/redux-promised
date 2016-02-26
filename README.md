# redux-promised
[FSA](https://github.com/acdlite/flux-standard-action)-compliant promise middleware for redux with optimistic update support, making async data loading in Redux as simple as any other action.

## Install

```js
npm install --save redux-promised
```

## Usage

First, import the middleware, and pass it as an argument to applyMiddleware.

```js
import { createStore, applyMiddleware } from 'redux'
import promiseMiddleware from 'redux-promised'
import rootReducer from './reducers'

const store = createStore(
  rootReducer,
  applyMiddleware(promiseMiddleware)
)
```

Now you can call an action with a Promise as it's payload.

This can be used with JavaScript's new 'fetch' function that returns a promise, for example:

```js
export const getData = () => ({
  type: 'GET_DATA',
  payload: fetch(data_API_URL, { method: 'GET' })
})
```

Redux actions with a promise as their payload are split into separate actions that can be handled synchronously.

Immediately after calling **getData**, an action with the type **GET_DATA_REQUEST** is dispatched, before the promise is resolved (this action has no payload, but anything passed in the original action's **meta** key will be passed with the action. This allows for optimistic updates, or to set an **isLoading** value in the state.
If the promise is successfully resolved, the action **GET_DATA** is dispatched with the resolved value as it's payload.
If the Promise is rejected, the action **GET_DATA_FAIL** is dispatched with the **Error object** provided in action's **error** key.

The reducer for the **GET_DATA** action could look something like this:

```js
import { request, reject, resolve } from 'redux-promised'

function users(state = {}, action) {
  switch (action.type) {
    case resolve('GET_DATA'): // defaults to 'GET_DATA'
      return Object.assign({}, state, {
        data: action.payload,
        isFetchingData: false
      })
    case request('GET_DATA'):
      return Object.assign({}, state, {
        isFetchingData: true
      })
    case reject('GET_DATA'):
      return Object.assign({}, state, {
        dataError: action.error,
        isFetchingData: false
      })
    default:
      return state
  }
}
```

You can also pass the Promise with other values in the payload, and the other values will be passed to the **request** action as **action.payload**, and the **resolve and reject** actions as **action.meta.originalPayload**:

```js
import { request, reject, resolve } from 'redux-promised'

export const getData = () => ({
  type: 'GET_DATA',
  payload: {
    promise: fetch(data_API_URL, { method: 'GET' }),
    dataType: 'users'
  }
})

function users(state = {}, action) {
  switch (action.type) {
    case resolve('GET_DATA'):
      return Object.assign({}, state, {
        data: action.payload,
        isFetchingData: false,
        type: action.meta.originalPayload.dataType
      })
    case request('GET_DATA'):
      return Object.assign({}, state, {
        isFetchingData: true,
        type: action.payload.dataType
      })
    case reject('GET_DATA'):
      return Object.assign({}, state, {
        dataError: action.error,
        isFetchingData: false,
        type: action.meta.originalPayload.dataType
      })
    default:
      return state
  }
}
```

The helper functions **request** , **reject**, and **resolve** simply add the appropriate suffix to the action's type.  By default:

```js
request('GET_DATA') === 'GET_DATA_REQUEST'
reject('GET_DATA') === 'GET_DATA_FAIL'
resolve('GET_DATA') === 'GET_DATA'
```

### Configuration

You can customize the **request, reject, and resolve suffix's** by importing the middleware creator **createPromiseMiddleware** instead of the **promiseMiddleware** directly. For example:

```js
import { createPromiseMiddleware } from 'redux-promised'

let promiseMiddleware = createPromiseMiddleware('_START', '_REJECT', '_RESOLVE')
```

Now the **request** and **reject** functions will produce:

```js
request('GET_DATA') === 'GET_DATA_START'
reject('GET_DATA') === 'GET_DATA_REJECT'
resolve('GET_DATA') === 'GET_DATA_RESOLVE'
```

All actions meet the [FSA](https://github.com/acdlite/flux-standard-action) standards.
