const http = require('http')
const socketio = require('socket.io')
const r = require('./rethink')

console.log('starting server...')
var server = http.createServer()
var io = socketio(server)

function getInitialMessages(channelName) {
  return r.table('messages')
    .orderBy({ index: r.desc('timestamp') })
    .filter({ to: channelName })
    .limit(100)
}

function getMessagesBefore(channelName, timestamp) {
  return r.table('messages')
    .orderBy({ index: r.desc('timestamp') })
    .filter({ to: channelName })
    .filter(r.row('timestamp').gt(r.ISO8601(timestamp)))
    .limit(100)
}

io.on('connection', client => {
  const subscribeToChannels = () => {
    r.table('channels').changes({ includeInitial: true }).run()
      .then(feed => {
        feed.each((err, change) => {
          client.emit('action', {
            type: 'CHANNEL_CHANGE',
            payload: change,
          })
        })
      })
  }

  const loadMessages = ({ channelName, timestamp = null }) => {
    let messagePromise
    if (timestamp === null) {
      messagePromise = getInitialMessages(channelName)
    } else {
      messagePromise = getMessagesBefore(channelName, timestamp)
    }

    messagePromise.then(messages => {
      client.emit('action', {
        type: 'LOADED_MESSAGES',
        payload: { channelName, timestamp, messages }
      })
    })
  }

  const subscribeToMessages = ({ channelName, timestamp }) => {
    r.table('messages')
      .orderBy({ index: r.desc('timestamp') })
      .filter({ to: channelName })
      .filter(r.row('timestamp').gt(r.ISO8601(timestamp)))
      .changes({ includeInitial: true })
      .run()
      .then(feed => {
        feed.each((err, change) => {
          client.emit('action', {
            type: 'MESSAGE_CHANGE',
            payload: change,
          })
        })
      })
  }

  const TYPE_TO_ACTION = {
    SUBSCRIBE_TO_CHANNELS: subscribeToChannels,

    LOAD_MESSAGES: loadMessages,
    SUBSCRIBE_TO_MESSAGES: subscribeToMessages,
  }

  client.on('action', action => {
    const { type, payload = null } = action

    TYPE_TO_ACTION[type](payload)
  })
})

server.listen(3001)
