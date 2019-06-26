const { createStore, applyMiddleware } = require('redux')

const { rootReducer } = require('./reducers')
const { initialState } = require('./state')
const withLogger = require('./middlewares/withLogger')

const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(withLogger),
)

module.exports = store
