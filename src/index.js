import _ from 'lodash'
import fp from 'lodash/fp'
import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import { routerForBrowser, RouterProvider, Fragment as AbsoluteFragment, RelativeFragment } from 'redux-little-router'
import createLogger from 'redux-logger'

import { initialState, reducer } from  './reducers'
import { subscribeToSocket, subscribeToChannels } from './actions'

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

const { routerEnhancer, routerMiddleware } = routerForBrowser({ routes })

const loggerMiddleware = createLogger({
  duration: true,
  timestamp: false,
  collapsed: true,
  titleFormatter: (action, time, took) => {
    return `${action.type} (in ${took.toFixed(2)} ms)`
  },
})

const store = createStore(
  reducer,
  initialState,
  compose(
    routerEnhancer,
    applyMiddleware(routerMiddleware, thunkMiddleware, loggerMiddleware)
  )
)

window._ = _
window.fp = fp
window.store = store

function onReady() {
  store.dispatch(subscribeToSocket())
  store.dispatch(subscribeToChannels())

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
