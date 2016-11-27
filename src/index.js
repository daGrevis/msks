import _ from 'lodash'
import fp from 'lodash/fp'
// eslint-disable-next-line no-unused-vars
import Rx from 'rxjs'
import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import { createEpicMiddleware } from 'redux-observable'
import { routerForBrowser, RouterProvider, Fragment as AbsoluteFragment, RelativeFragment } from 'redux-little-router'
import createLogger from 'redux-logger'
import createSocketIoMiddleware from 'redux-socket.io'
import socket from './websocket-client'

import { initialState, reducer } from  './reducers'
import { subscribeToChannels } from './actions'
import { rootEpic } from './epics'

import App from './containers/App'
import Front from './containers/Front'
import Channel from './containers/Channel'

import "loaders.css/loaders.min.css"
import './index.css'

const routes = {
  '/': {
    '/:channel': {},
  },
}

const Root = () => (
  <App>
    <div>
      <AbsoluteFragment forRoute='/'>
        <Front />
      </AbsoluteFragment>

      <RelativeFragment forRoute='/:channel'>
        <Channel />
      </RelativeFragment>
    </div>
  </App>
)

const socketMiddleware = createSocketIoMiddleware(socket, "server/")

const { routerEnhancer, routerMiddleware } = routerForBrowser({ routes })

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
  compose(
    routerEnhancer,
    applyMiddleware(
      routerMiddleware,
      thunkMiddleware,
      epicMiddleware,
      socketMiddleware,
      loggerMiddleware
    )
  )
)

store.dispatch(subscribeToChannels())

function onReady() {
  ReactDOM.render(
    <Provider store={store}>
      <RouterProvider store={store}>
        <Root />
      </RouterProvider>
    </Provider>,
    document.getElementById('root')
  )
}

document.addEventListener('DOMContentLoaded', onReady)

window._ = _
window.fp = fp
window.store = store
