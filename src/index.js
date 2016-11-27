import _ from 'lodash'
import fp from 'lodash/fp'
// eslint-disable-next-line no-unused-vars
import Rx from 'rxjs'
import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import { createEpicMiddleware } from 'redux-observable'
import createLogger from 'redux-logger'
import createSocketIoMiddleware from 'redux-socket.io'
import socket from './websocket-client'

import { initialState, reducer } from  './reducers'
import { navigated, subscribeToChannels } from './actions'
import { rootEpic } from './epics'
import { history } from  './history'

import App from './containers/App'

import "loaders.css/loaders.min.css"
import './index.css'

const socketMiddleware = createSocketIoMiddleware(socket, "server/")

const loggerMiddleware = createLogger({
  duration: true,
  timestamp: false,
  collapsed: true,
  titleFormatter: (action, time, took) => {
    return `${action.type} (in ${took.toFixed(2)} ms)`
  },
})

const epicMiddleware = createEpicMiddleware(rootEpic)

const store = createStore(
  reducer,
  initialState,
  applyMiddleware(
    thunkMiddleware,
    epicMiddleware,
    socketMiddleware,
    loggerMiddleware
  )
)

store.dispatch(navigated(history.location))
history.listen(loc => {
  store.dispatch(navigated(loc))
})

store.dispatch(subscribeToChannels())

function onReady() {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  )
}

document.addEventListener('DOMContentLoaded', onReady)

window._ = _
window.fp = fp
window.store = store
