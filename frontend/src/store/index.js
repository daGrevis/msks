import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import createSocketIoMiddleware from 'redux-socket.io'
import { persistStore, persistReducer } from 'redux-persist'
import persistStorage from 'redux-persist/lib/storage'

import socket from '../networking/socket'
import { initialState } from './state'
import { rootReducer } from './reducers'
import reactionMiddleware from './reactionMiddleware'

const socketMiddleware = createSocketIoMiddleware(socket, 'server/')

const loggerMiddleware = createLogger({
  timestamp: false,
  collapsed: true,
})

const persistConfig = {
  key: 'root',
  storage: persistStorage,
  whitelist: ['session'],
}
const store = createStore(
  persistReducer(persistConfig, rootReducer),
  initialState,
  applyMiddleware(
    thunkMiddleware,
    reactionMiddleware,
    socketMiddleware,
    loggerMiddleware,
  ),
)

const persistor = persistStore(store)

export default store
export { persistor }
