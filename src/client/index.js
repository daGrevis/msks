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
import {
  initApp, setVisibility, navigated,
  setChannelName, subscribeToChannels, unsubscribeFromAllMessages,
  loadMessagesFromServer, addNotification,
} from './actions'
import { openedChannelsSelector, getLastMessageTimestampSelector } from './selectors'
import App from './containers/App'

import { history } from  './history'
import socket from './socket'

import viewportUnitsBuggyfill from 'viewport-units-buggyfill'

viewportUnitsBuggyfill.init()

import 'loaders.css/loaders.min.css'
import './index.css'

const EMBED_CHANNEL = process.env.REACT_APP_EMBED_CHANNEL

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

const { dispatch, getState } = store

dispatch(initApp(EMBED_CHANNEL))

window.onerror = () => {
  dispatch(addNotification('Something broke!'))
}

socket.on('error', err => {
  console.error(err)
})

socket.on('disconnect', () => {
  dispatch(unsubscribeFromAllMessages())
})

socket.on('reconnect', () => {
  const state = getState()

  dispatch(subscribeToChannels())

  _.forEach(openedChannelsSelector(state), ({ name: channelName }) => {
    const after = getLastMessageTimestampSelector(channelName)(state)
    dispatch(loadMessagesFromServer({
      channelName, after,
    }))
  })
})

const currentLocation = history.location
dispatch(navigated(currentLocation))
dispatch(setChannelName(EMBED_CHANNEL ? EMBED_CHANNEL : currentLocation.hash))

history.listen(loc => {
  dispatch(navigated(loc))
  dispatch(setChannelName(loc.hash))
})

dispatch(subscribeToChannels())

const onReady = () =>
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  )

const onVisibilityChange = () => {
  const isVisible = !document.hidden
  dispatch(setVisibility(isVisible))
}

document.addEventListener('DOMContentLoaded', onReady)
document.addEventListener('visibilitychange', onVisibilityChange)

window._ = _
window.fp = fp
window.store = store
window.mo = mo
