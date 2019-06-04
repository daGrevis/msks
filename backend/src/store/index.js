const { createStore, applyMiddleware } = require('redux')

const logger = require('../env/logger')
const { rootReducer } = require('./reducers')
const { initialState } = require('./state')

const loggerMiddleware = () => next => action => {
  logger.debug(action.type)
  return next(action)
}

const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(loggerMiddleware),
)

module.exports = store
