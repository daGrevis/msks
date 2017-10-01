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

import router from './router'
import { initialState } from './state'
import { rootReducer } from  './reducers'
import { rootEpic } from './epics'
import {
  setBroken, setVisibility, navigated,
  socketConnected, socketDisconnected,
} from './actions'
import * as actions from './actions'
import * as selectors from './selectors'
import { colorize, bold, italic, underline } from './text'
import App from './components/App'

import { history, navigate, getPathname, getQuery } from  './history'
import socket from './socket'

import viewportUnitsBuggyfill from 'viewport-units-buggyfill'

viewportUnitsBuggyfill.init()

import 'loaders.css/loaders.min.css'
import 'hamburgers/dist/hamburgers.min.css'

import './index.css'

const socketMiddleware = createSocketIoMiddleware(socket, 'server/')

const loggerMiddleware = createLogger({
  duration: true,
  timestamp: false,
  collapsed: true,
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

window.addEventListener('error', () => {
  dispatch(setBroken())
})

const onNavigated = async (location) => {
  const pathname = getPathname(location)
  const query = getQuery(location)

  const { path, params, meta } = await router.resolve({
    path: pathname,
  })

  dispatch(
    navigated({ path, params, meta, pathname, query })
  )
}

const initialLocation = history.location
onNavigated(initialLocation)
history.listen((currentLocation) => {
  onNavigated(currentLocation)
})

socket.on('connect', () => {
  dispatch(socketConnected())
})
socket.on('disconnect', () => {
  dispatch(socketDisconnected())
})

const onReady = () => {
  const mountNode = document.getElementById('root')
  ReactDOM.render((
    <Provider store={store}>
      <App />
    </Provider>
  ), mountNode)
}

const onVisibilityChange = () => {
  const isVisible = !document.hidden
  dispatch(setVisibility(isVisible))
}

document.addEventListener('DOMContentLoaded', onReady)
document.addEventListener('visibilitychange', onVisibilityChange)

window._ = _
window.fp = fp
window.socket = socket
window.navigate = navigate
window.store = store
window.dispatch = dispatch
window.getState = getState
window.actions = actions
window.selectors = selectors
window.colorize = colorize
window.bold = bold
window.italic = italic
window.underline = underline
