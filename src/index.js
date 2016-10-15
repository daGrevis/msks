import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider, connect } from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import { initialState, reducer } from  './reducers'
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
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  )
}

document.addEventListener('DOMContentLoaded', onReady)
