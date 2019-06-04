const _ = require('lodash')
const socketio = require('socket.io')

const logger = require('../../env/logger')
const store = require('../../store')
const actions = require('./actions')

const io = socketio({
  serveClient: false,
})

io.on('connection', socket => {
  store.dispatch({
    type: 'SET_SOCKET_CLIENT',
    payload: { socket },
  })

  socket.on('disconnect', () => {
    store.dispatch({
      type: 'UNSET_SOCKET_CLIENT',
      payload: { socket },
    })
  })

  socket.on('action', ({ type, payload }) => {
    if (!(type in actions)) {
      logger.verbose(`Unknown action: ${type}`)
      return
    }

    let logMessage = type
    if (payload !== undefined) {
      logMessage += ' '
      if (_.isArray(payload) || _.isObject(payload)) {
        logMessage += JSON.stringify(payload)
      } else {
        logMessage += `${payload}`
      }
    }
    logger.verbose(logMessage)

    const promise = actions[type](payload || {})
    promise(socket)
  })
})

module.exports = io
