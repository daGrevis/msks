import Promise from 'bluebird'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import viewportUnitsBuggyfill from 'viewport-units-buggyfill'

import store, { persistor } from './store'
import { setVisible, setHidden } from './store/actions/app'
import history from './routing/history'
import App from './components/App'
import './env/debugger'

import 'normalize.css/normalize.css'
import 'loaders.css/loaders.min.css'
import 'hamburgers/dist/hamburgers.min.css'
import './styles/index.css'

window.Promise = Promise

viewportUnitsBuggyfill.init()

window.addEventListener('error', ev => {
  store.dispatch({
    type: 'SET_BROKEN',
    payload: ev,
  })
})

store.dispatch({
  type: 'NAVIGATED',
  payload: {
    location: history.location,
    action: 'PUSH',
  },
})
history.listen((location, action) => {
  store.dispatch({
    type: 'NAVIGATED',
    payload: {
      location,
      action,
    },
  })
})

const onVisibilityChange = () => {
  store.dispatch(document.hidden ? setHidden() : setVisible())
}

document.addEventListener('visibilitychange', onVisibilityChange)

const onReady = () => {
  const mountNode = document.getElementById('root')
  ReactDOM.render(
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>,
    mountNode,
  )
}

document.addEventListener('DOMContentLoaded', onReady)
