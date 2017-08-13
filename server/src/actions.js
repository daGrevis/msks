const r = require('./rethink')

const {
  getInitialChannels, getInitialUsers,
  getInitialMessages, getMessagesBefore, getMessagesAfter, getMessagesAround,
} = require('./rethink/queries')
const { searchMessages } = require('./elastic/queries')

const subscribeToChannels = () => ({ socket, context }) => (
  getInitialChannels().then(channels => {
    socket.emit('action', {
      type: 'client/INITIAL_CHANNELS',
      payload: {
        channels,
      },
    })

    return (
      r.table('channels')
      .changes()
      .run()
      .then(changefeed => {
        context['changefeeds'].push(changefeed)

        changefeed.each((err, change) => {
          socket.emit('action', {
            type: 'client/CHANNEL_CHANGE',
            payload: change,
          })
        })
      })
    )
  })
)

const subscribeToUsers = ({ channelName = null }) => ({ socket, context }) => {
  if (!channelName) {
    console.error('SUBSCRIBE_TO_USERS: channelName missing!')
    return
  }

  getInitialUsers(channelName).then(users => {
    socket.emit('action', {
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
      .then(changefeed => {
        context['changefeeds'].push(changefeed)

        changefeed.each((err, change) => {
          socket.emit('action', {
            type: 'client/USER_CHANGE',
            payload: change,
          })
        })
      })
  })
}

const subscribeToMessages = payload => ({ socket, context }) => {
  const { channelName, timestamp, messageId } = payload

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
    .then(changefeed => {
      context['changefeeds'].push(changefeed)
      context['messagesChangefeeds'][channelName] = changefeed

      changefeed.each((err, change) => {
        socket.emit('action', {
          type: 'client/MESSAGE_CHANGE',
          payload: change,
        })
      })
    })
}

const unsubscribeFromMessages = payload => ({ socket, context }) => {
  const { channelName } = payload

  if (!channelName) {
    console.error('UNSUBSCRIBE_FROM_MESSAGES: channelName missing!')
    return
  }

  const changefeed = context['messagesChangefeeds'][channelName]

  if (changefeed) {
    changefeed.close()
  }
}

const loadMessages = payload => ({ socket }) => {
  const { channelName, before, after, messageId } = payload

  if (!channelName) {
    console.error('LOAD_MESSAGES: channelName missing!')
    return
  }

  if ((before && !messageId) || (after && !messageId)) {
    console.error('LOAD_MESSAGES: messageId missing!')
    return
  }

  let limit
  let messagePromise
  if (before) {
    limit = 75
    messagePromise = getMessagesBefore({
      channelName,
      messageId,
      timestamp: r.ISO8601(before),
      limit,
    })
  } else if (after) {
    limit = 75
    messagePromise = getMessagesAfter({
      channelName,
      messageId,
      timestamp: r.ISO8601(after),
      limit,
    })
  } else if (messageId) {
    limit = 150
    messagePromise = getMessagesAround({
      channelName,
      messageId,
      limit,
    })
  } else {
    limit = 75
    messagePromise = getInitialMessages({
      channelName,
      limit,
    })
  }

  messagePromise.then(messages => {
    socket.emit('action', {
      type: 'client/LOADED_MESSAGES',
      payload: {
        channelName,
        messages,
        messageId,
        before,
        after,
        limit,
      }
    })
  })
}

const search = ({ channel, query, offset }) => async ({ socket }) => {
  socket.emit('action', {
    type: 'client/FOUND_MESSAGES',
    payload: await searchMessages(channel, query, offset),
  })
}

module.exports = {
  subscribeToChannels,
  subscribeToUsers,
  loadMessages,
  subscribeToMessages,
  unsubscribeFromMessages,
  search,
}
