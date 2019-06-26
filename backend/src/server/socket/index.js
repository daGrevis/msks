const _ = require('lodash')
const socketio = require('socket.io')

const config = require('../../env/config')
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

  socket.on('action', async ({ type, payload }) => {
    if (!(type in actions)) {
      logger.error(`Unknown action: ${type}`)
      return
    }

    const promise = actions[type](payload || {})

    const startTime = new Date()

    let error
    try {
      await promise(socket)
    } catch (e) {
      error = e
    }

    const duration = new Date() - startTime

    if (duration >= config.logger.minSocketActionDuration) {
      let logMessage = `[socket ${duration}ms] ${type}`
      if (payload !== undefined) {
        logMessage += ' '
        if (_.isArray(payload) || _.isObject(payload)) {
          logMessage += JSON.stringify(payload)
        } else {
          logMessage += `${payload}`
        }
      }

      logger.log(error ? 'error' : 'verbose', logMessage)
    }
  })
})

module.exports = io
