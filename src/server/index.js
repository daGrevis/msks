const fp = require('lodash/fp')
const http = require('http')
const socketio = require('socket.io')

const r = require('./rethink')

console.log('starting server...')
let server = http.createServer()
let io = socketio(server)

const getInitialMessagesPromise = channelName => (
  r.table('messages')
  .orderBy({ index: r.desc('timestamp') })
  .filter({ to: channelName })
  .limit(100)
)

const getMessagesBeforePromise = (channelName, timestamp) => (
  r.table('messages')
    .orderBy({ index: r.desc('timestamp') })
    .filter({ to: channelName })
    .filter(r.row('timestamp').le(r.ISO8601(timestamp)))
    .limit(101)
)

const subscribeToChannels = () => client => {
  r.table('channels').changes({ includeInitial: true }).run()
    .then(feed => {
      feed.each((err, change) => {
        client.emit('action', {
          type: 'client/CHANNEL_CHANGE',
          payload: change,
        })
      })
    })
}

const loadMessages = ({ channelName = null, timestamp = null }) => client => {
  if (!channelName) {
    return
  }

  let messagePromise
  if (timestamp === null) {
    messagePromise = getInitialMessagesPromise(channelName)
  } else {
    messagePromise = getMessagesBeforePromise(channelName, timestamp)
  }

  messagePromise.then(messages => {
    client.emit('action', {
      type: 'client/LOADED_MESSAGES',
      payload: {
        channelName,
        timestamp,
        messages: fp.reverse(messages),
      }
    })
  })
}

const subscribeToMessages = ({ channelName = null, timestamp = null }) => client => {
  if (!channelName || !timestamp) {
    return
  }

  r.table('messages')
    .orderBy({ index: r.desc('timestamp') })
    .filter({ to: channelName })
    .filter(r.row('timestamp').gt(r.ISO8601(timestamp)))
    .changes({ includeInitial: true })
    .run()
    .then(feed => {
      feed.each((err, change) => {
        client.emit('action', {
          type: 'client/MESSAGE_CHANGE',
          payload: change,
        })
      })
    })
}

const ACTIONS = {
  'server/SUBSCRIBE_TO_CHANNELS': subscribeToChannels,
  'server/LOAD_MESSAGES': loadMessages,
  'server/SUBSCRIBE_TO_MESSAGES': subscribeToMessages,
}

io.on('connection', client => {
  client.on('action', ({ type, payload = null }) => {
    if (!ACTIONS[type]) {
      console.error(`Unknown action: ${type}`)
      return
    }

    ACTIONS[type](payload || {})(client)
  })
})

server.listen(3001)
