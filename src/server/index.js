const fp = require('lodash/fp')
const http = require('http')
const socketio = require('socket.io')

const r = require('./rethink')

console.log('starting server...')
let server = http.createServer()
let io = socketio(server)

const getInitialMessagesPromise = channelName => (
  r.table('messages')
    .between([channelName, r.minval], [channelName, r.maxval], { index: 'toAndTimestamp' })
    .orderBy({ index: r.desc('toAndTimestamp') })
    .limit(100)
)

const getMessagesBeforePromise = (channelName, timestamp) => (
  r.table('messages')
    .between(r.minval, r.ISO8601(timestamp), { index: 'timestamp' })
    .orderBy({ index: r.desc('timestamp') })
    .filter({ to: channelName })
    .limit(101)
)

const getMessagesAfterPromise = (channelName, timestamp) => (
  // TODO: Add limit and retry requests on client.
  r.table('messages')
    .between(r.ISO8601(timestamp), r.maxval, { index: 'timestamp' })
    .orderBy({ index: r.desc('timestamp') })
    .filter({ to: channelName })
)

const subscribeToChannels = () => client => {
  r.table('channels').changes({ includeInitial: true }).run()
    .then(feed => {
      feed.each((err, change) => {
        if (err) {
          console.error('error from channels feed', err)
          return
        }

        client.emit('action', {
          type: 'client/CHANNEL_CHANGE',
          payload: change,
        })
      })
    })
}

const loadMessages = ({ channelName = null, before = null, after = null }) => client => {
  if (!channelName) {
    return
  }

  let messagePromise
  if (before) {
    messagePromise = getMessagesBeforePromise(channelName, before)
  } else if (after) {
    messagePromise = getMessagesAfterPromise(channelName, after)
  } else {
    messagePromise = getInitialMessagesPromise(channelName)
  }

  messagePromise.then(messages => {
    client.emit('action', {
      type: 'client/LOADED_MESSAGES',
      payload: {
        channelName,
        before,
        after,
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
    .between(r.ISO8601(timestamp), r.maxval, { index: 'timestamp' })
    .orderBy({ index: r.desc('timestamp') })
    .filter({ to: channelName })
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
