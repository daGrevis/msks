import _ from 'lodash'
import fp from 'lodash/fp'
// eslint-disable-next-line no-unused-vars
import Rx from 'rxjs'
import Router from 'universal-router'
import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import { createEpicMiddleware } from 'redux-observable'
import createLogger from 'redux-logger'
import createSocketIoMiddleware from 'redux-socket.io'

import config from './config'
import { mo } from './utils'
import { initialState } from './state'
import { rootReducer } from  './reducers'
import { rootEpic } from './epics'
import {
  setEmbed, setBroken, setVisibility, navigated,
  socketConnected, socketDisconnected, setChannelName,
} from './actions'
import * as actions from './actions'
import * as selectors from './selectors'
import { colorize, bold, italic, underline } from './text'
import App from './components/App'
import Channel from './components/Channel'
import Front from './components/Front'

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
  predicate: (getState, action) => (
    action.type !== 'NOOP'
  )
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

if (config.embedChannel) {
  dispatch(setEmbed())
}

socket.on('error', err => {
  console.error(err)
})

socket.on('connect', () => {
  dispatch(socketConnected())
})

socket.on('disconnect', () => {
  dispatch(socketDisconnected())
})

const routes = config.embedChannel ? [
  {
    path: '/',
    action: () => {
      dispatch(setChannelName(config.embedChannel))
      return {
        component: <Channel />,
      }
    },
  },
  {
    path: '/:messageId',
    action: ({ params }) => {
      dispatch(setChannelName(config.embedChannel))
      return {
        component: <Channel messageId={params.messageId} />,
      }
    },
  },
] : [
  {
    path: '/',
    action: () => ({
      component: <Front />,
    }),
  },
  {
    path: '/:channelName',
    action: async ({ next, params }) => {
      dispatch(setChannelName(params.channelName))
      return await next()
    },
    children: [
      {
        path: '/',
        action: () => ({
          component: <Channel />,
        }),
      },
      {
        path: '/:messageId',
        action: ({ params }) => ({
          component: <Channel messageId={params.messageId} />,
        }),
      },
    ],
  },
]

const router = new Router(routes)

const onReady = () => {
  const mountNode = document.getElementById('root')

  const onRoute = loc => {
    const pathname = getPathname(loc)
    const query = getQuery(loc)

    router.resolve({ path: pathname })
      .then(({ component }) => {
        dispatch(
          navigated({ pathname, query })
        )

        ReactDOM.render((
          <Provider store={store}>
            <App>{component}</App>
          </Provider>
        ), mountNode)
      })
  }

  const initialLoc = history.location
  onRoute(initialLoc)

  history.listen(currentLoc => {
    onRoute(currentLoc)
  })
}

const onVisibilityChange = () => {
  const isVisible = !document.hidden
  dispatch(setVisibility(isVisible))
}

document.addEventListener('DOMContentLoaded', onReady)
document.addEventListener('visibilitychange', onVisibilityChange)

store.subscribe(() => {
  window.st = store.getState()
})

window._ = _
window.fp = fp
window.mo = mo
window.store = store
window.dispatch = dispatch
window.actions = actions
window.getState = getState
window.selectors = selectors
window.navigate = navigate
window.socket = socket
window.colorize = colorize
window.bold = bold
window.italic = italic
window.underline = underline
