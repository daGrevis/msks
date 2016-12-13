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

import { mo } from './utils'
import { initialState } from './state'
import { rootReducer } from  './reducers'
import { rootEpic } from './epics'
import { navigated, subscribeToChannels, subscribeToMessages, addNotification } from './actions'
import { openedChannelsSelector, getLastMessageTimestampSelector } from './selectors'
import App from './containers/App'

import { history } from  './history'
import socket from './socket'

import viewportUnitsBuggyfill from 'viewport-units-buggyfill'

viewportUnitsBuggyfill.init()

import 'loaders.css/loaders.min.css'
import './index.css'

const socketMiddleware = createSocketIoMiddleware(socket, 'server/')

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
  rootReducer,
  initialState,
  applyMiddleware(
    thunkMiddleware,
    epicMiddleware,
    socketMiddleware,
    loggerMiddleware
  )
)

socket.on('reconnect', () => {
  const state = store.getState()

  store.dispatch(addNotification('Reconnected!'))

  store.dispatch(subscribeToChannels())
  fp.map(channelName => (
    store.dispatch(subscribeToMessages({
      channelName,
      timestamp: getLastMessageTimestampSelector(channelName)(state),
    }))
  ))(openedChannelsSelector(state))
})

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
window.mo = mo
