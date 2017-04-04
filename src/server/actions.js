const fp = require('lodash/fp')
const r = require('./rethink')

const { getInitialChannels, getInitialUsers, getInitialMessages, getMessagesBefore, getMessagesAfter} = require('./queries')

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
  const { channelName = null, timestamp = null, messageId = null } = payload

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
  const { channelName = null, before = null, after = null, messageId = null } = payload

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
    messagePromise = getMessagesBefore(channelName, before, messageId)
  } else if (after) {
    messagePromise = getMessagesAfter(channelName, after, messageId)
  } else {
    messagePromise = getInitialMessages(channelName)
  }

  messagePromise.then(messages => {
    socket.emit('action', {
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

module.exports = {
  subscribeToChannels,
  subscribeToUsers,
  loadMessages,
  subscribeToMessages,
}
