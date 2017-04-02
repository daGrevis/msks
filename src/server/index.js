const fp = require('lodash/fp')
const http = require('http')
const socketio = require('socket.io')

const r = require('./rethink')

console.log('starting server...')

let server = http.createServer()
let io = socketio(server)

const getInitialChannelsPromise = () => (
  r.table('channels')
)

const getInitialUsersPromise = channelName => (
  r.table('users')
  .getAll(channelName, { index: 'channel' })
)

const getInitialMessagesPromise = channelName => (
  r.table('messages')
  .between([channelName, r.minval], [channelName, r.maxval], { index: 'toAndTimestamp' })
  .orderBy({ index: r.desc('toAndTimestamp') })
  .limit(75)
)

const getMessagesBeforePromise = (channelName, timestamp, messageId) => (
  r.table('messages')
  .between(
    [channelName, r.minval],
    [channelName, r.ISO8601(timestamp)],
    { index: 'toAndTimestamp' }
  )
  .orderBy({ index: r.desc('toAndTimestamp') })
  .filter(r.row('id').ne(messageId))
  .limit(100)
)

const getMessagesAfterPromise = (channelName, timestamp, messageId) => (
  // TODO: Add limit and retry requests on client.
  r.table('messages')
  .between([channelName, r.ISO8601(timestamp)], [channelName, r.maxval], { index: 'toAndTimestamp' })
  .orderBy({ index: r.desc('toAndTimestamp') })
  .filter(r.row('id').ne(messageId))
)

const subscribeToChannels = () => client => (
  getInitialChannelsPromise().then(channels => {
    client.emit('action', {
      type: 'client/INITIAL_CHANNELS',
      payload: {
        channels,
      },
    })

    return (
      r.table('channels')
      .changes()
      .run()
      .then(feed => {
        feed.each((err, change) => {
          client.emit('action', {
            type: 'client/CHANNEL_CHANGE',
            payload: change,
          })
        })
      })
    )
  })
)

const subscribeToUsers = ({ channelName = null }) => client => {
  if (!channelName) {
    console.error('SUBSCRIBE_TO_USERS: channelName missing!')
    return
  }

  getInitialUsersPromise(channelName).then(users => {
    client.emit('action', {
      type: 'client/INITIAL_USERS',
      payload: {
        channelName,
        users,
      },
    })

    r.table('users')
      .getAll(channelName, { index: 'channel' })
      .changes()
      .run()
      .then(feed => {
        feed.each((err, change) => {
          client.emit('action', {
            type: 'client/USER_CHANGE',
            payload: change,
          })
        })
      })
  })
}

const loadMessages = ({ channelName = null, before = null, after = null, messageId = null }) => client => {
  if (!channelName) {
    console.error('LOADED_MESSAGES: channelName missing!')
    return
  }

  if ((before && !messageId) || (after && !messageId)) {
    console.error('LOADED_MESSAGES: messageId missing!')
    return
  }

  let messagePromise
  if (before) {
    messagePromise = getMessagesBeforePromise(channelName, before, messageId)
  } else if (after) {
    messagePromise = getMessagesAfterPromise(channelName, after, messageId)
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

const subscribeToMessages = ({ channelName = null, timestamp = null, messageId = null }) => client => {
  if (!channelName || !timestamp || !messageId) {
    console.error('SUBSCRIBE_TO_MESSAGES: channelName, timestamp or messageId missing!')
    return
  }

  r.table('messages')
    .between([channelName, r.ISO8601(timestamp)], [channelName, r.maxval], { index: 'toAndTimestamp' })
    .orderBy({ index: r.desc('toAndTimestamp') })
    .filter(r.row('id').ne(messageId))
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
  'server/SUBSCRIBE_TO_USERS': subscribeToUsers,
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
