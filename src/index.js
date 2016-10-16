import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import { initialState, reducer } from  './reducers'
import { subscribeToSocket, loadChannel } from './actions'
import App from './containers/App'
import './index.css'

const store = createStore(
  reducer,
  initialState,
  compose(
    applyMiddleware(thunkMiddleware)
  )
)

function onReady() {
  store.dispatch(subscribeToSocket())
  store.dispatch(loadChannel('#meeseekeria'))

  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  )
}

document.addEventListener('DOMContentLoaded', onReady)
