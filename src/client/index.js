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

import { mo } from './utils'
import { initialState } from './state'
import { rootReducer } from  './reducers'
import { rootEpic } from './epics'
import {
  setEmbed, reconnect, setVisibility, navigated,
  setChannelName, subscribeToChannels, unsubscribeFromAllMessages,
} from './actions'
import * as actions from './actions'
import * as selectors from './selectors'
import App from './containers/App'
import Channel from './containers/Channel'
import Front from './containers/Front'

import { history, navigate, getPath } from  './history'
import socket from './socket'

import viewportUnitsBuggyfill from 'viewport-units-buggyfill'

viewportUnitsBuggyfill.init()

import 'loaders.css/loaders.min.css'
import 'hamburgers/dist/hamburgers.min.css'

import './index.css'

const EMBED_CHANNEL = process.env.REACT_APP_EMBED_CHANNEL

const socketMiddleware = createSocketIoMiddleware(socket, 'server/')

const loggerMiddleware = createLogger({
  duration: true,
  timestamp: false,
  collapsed: true,
  titleFormatter: (action, time, took) => (
    `${action.type} (in ${took.toFixed(2)} ms)`
  ),
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

if (EMBED_CHANNEL) {
  dispatch(setEmbed())
}

socket.on('error', err => {
  console.error(err)
})

socket.on('disconnect', () => {
  dispatch(unsubscribeFromAllMessages())
})

socket.on('reconnect', () => {
  dispatch(reconnect())
})

dispatch(subscribeToChannels())

const routes = EMBED_CHANNEL ? [
  {
    path: '/',
    action: () => {
      dispatch(setChannelName(EMBED_CHANNEL))
      return <Channel />
    },
  },
] : [
  {
    path: '/',
    action: () => <Front />,
  },
  {
    path: '/:channelName',
    action: ({ params }) => {
      dispatch(setChannelName(params.channelName))
      return <Channel />
    },
  },
]

const router = new Router(routes, {
  resolveRoute: (ctx, params) => {
    if (_.isFunction(ctx.route.action)) {
      return { ctx, component: ctx.route.action(ctx, params) }
    }
    return null
  },
})

const onReady = () => {
  const mountNode = document.getElementById('root')

  const onRoute = loc => {
    const path = getPath(loc)

    router.resolve({ path })
      .then(({ ctx: { params }, component }) => {
        ReactDOM.render((
          <Provider store={store}>
            <App>{component}</App>
          </Provider>
        ), mountNode)

        dispatch(
          navigated({ loc, params })
        )
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

window._ = _
window.fp = fp
window.mo = mo
window.store = store
window.dispatch = dispatch
window.actions = actions
window.getState = getState
window.selectors = selectors
window.navigate = navigate
