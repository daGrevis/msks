const fp = require('lodash/fp')
const http = require('http')
const socketio = require('socket.io')

const r = require('./rethink')

console.log('starting server...')
let server = http.createServer()
let io = socketio(server)

const getInitialUsersPromise = channelName => (
  r.table('users')
    .getAll(channelName, { index: 'channel' })
)

const getInitialMessagesPromise = channelName => (
  r.table('messages')
    .between([channelName, r.minval], [channelName, r.maxval], { index: 'toAndTimestamp' })
    .orderBy({ index: r.desc('toAndTimestamp') })
    .limit(100)
)

const getMessagesBeforePromise = (channelName, timestamp) => (
  r.table('messages')
    .between([channelName, r.minval], [channelName, r.ISO8601(timestamp)], { index: 'toAndTimestamp' })
    .orderBy({ index: r.desc('toAndTimestamp') })
    .limit(101)
)

const getMessagesAfterPromise = (channelName, timestamp) => (
  // TODO: Add limit and retry requests on client.
  r.table('messages')
    .between([channelName, r.ISO8601(timestamp)], [channelName, r.maxval], { index: 'toAndTimestamp' })
    .orderBy({ index: r.desc('toAndTimestamp') })
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
    console.error('LOADED_MESSAGES: channelName missing!')
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
    console.error('SUBSCRIBE_TO_MESSAGES: channelName or timestamp missing!')
    return
  }

  r.table('messages')
    .between([channelName, r.ISO8601(timestamp)], [channelName, r.maxval], { index: 'toAndTimestamp' })
    .orderBy({ index: r.desc('toAndTimestamp') })
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

const ACTIONS = {
  'server/SUBSCRIBE_TO_CHANNELS': subscribeToChannels,
  'server/LOAD_MESSAGES': loadMessages,
  'server/SUBSCRIBE_TO_MESSAGES': subscribeToMessages,
  'server/SUBSCRIBE_TO_USERS': subscribeToUsers,
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
