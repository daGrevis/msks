const r = require('./rethink')

const queries = require('./queries')

const subscribeToChannels = () => ({ socket, context }) => (
  queries.getInitialChannels().then(channels => {
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

  queries.getInitialUsers(channelName).then(users => {
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

      changefeed.each((err, change) => {
        socket.emit('action', {
          type: 'client/MESSAGE_CHANGE',
          payload: change,
        })
      })
    })
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

  let messagePromise
  let isInitial = false
  if (before) {
    messagePromise = queries.getMessagesBefore(channelName, r.ISO8601(before), messageId)
  } else if (after) {
    messagePromise = queries.getMessagesAfter(channelName, r.ISO8601(after), messageId)
  } else if (messageId) {
    messagePromise = queries.getMessagesAround(channelName, messageId)
  } else {
    isInitial = true
    messagePromise = queries.getInitialMessages(channelName)
  }

  messagePromise.then(messages => {
    socket.emit('action', {
      type: 'client/LOADED_MESSAGES',
      payload: {
        channelName,
        messages,
        isInitial,
        before,
        after,
      }
    })
  })
}

module.exports = {
  subscribeToChannels,
  subscribeToUsers,
  loadMessages,
  subscribeToMessages,
}
