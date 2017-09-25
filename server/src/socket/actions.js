const r = require('../rethink')
const api = require('../api')

const subscribeToChannels = () => async ({ socket, onDisconnect }) => {
  const changefeed = await (
    r.table('channels')
    .changes({ includeInitial: true })
    .run()
  )

  let changes = []

  changefeed.each((err, change) => {
    changes.push(change)
  })

  const interval = setInterval(() => {
    if (!changes.length) {
      return
    }

    socket.emit('action', {
      type: 'client/CHANNEL_CHANGES',
      payload: {
        changes,
      },
    })

    changes = []
  }, 100)

  onDisconnect(() => {
    changefeed.close()
    clearInterval(interval)
  })
}

const subscribeToUsers = ({ channelName }) => async ({ socket, onDisconnect }) => {
  if (!channelName) {
    console.error('SUBSCRIBE_TO_USERS: channelName missing!')
    return
  }

  const changefeed = await (
    r.table('users')
    .getAll(channelName, { index: 'channel' })
    .changes({ includeInitial: true })
    .run()
  )

  let changes = []

  changefeed.each((err, change) => {
    changes.push(change)
  })

  const interval = setInterval(() => {
    if (!changes.length) {
      return
    }

    socket.emit('action', {
      type: 'client/USER_CHANGES',
      payload: {
        channelName,
        changes,
      },
    })

    changes = []
  }, 100)

  onDisconnect(() => {
    changefeed.close()
    clearInterval(interval)
  })
}

const subscribeToMessages = payload => async ({ socket, onDisconnect }) => {
  const { channelName } = payload

  if (!channelName) {
    console.error('SUBSCRIBE_TO_MESSAGES: channelName missing!')
    return
  }

  const changefeed = await (
    r.table('messages')
    .getAll(channelName, { index: 'to' })
    .changes()
    .run()
  )

  changefeed.each((err, change) => {
    if (!change.old_val) {
      socket.emit('action', {
        type: 'client/ADD_MESSAGE',
        payload: change.new_val,
      })
    }
  })

  onDisconnect(() => {
    changefeed.close()
  })
}

const getMessages = ({ channel, limit }) => async ({ socket }) => {
  socket.emit('action', {
    type: 'client/SET_MESSAGES',
    payload: await api.getMessages(channel, limit || 100),
  })
}

const getMessagesBefore = ({ messageId, limit }) => async ({ socket }) => {
  socket.emit('action', {
    type: 'client/SET_MESSAGES_BEFORE',
    payload: await api.getMessagesBefore(messageId, limit || 100),
  })
}

const getMessagesAfter = ({ messageId, limit }) => async ({ socket }) => {
  socket.emit('action', {
    type: 'client/SET_MESSAGES_AFTER',
    payload: await api.getMessagesAfter(messageId, limit || 100),
  })
}

const getMessagesAround = ({ messageId, limit }) => async ({ socket }) => {
  socket.emit('action', {
    type: 'client/SET_MESSAGES_AROUND',
    payload: await api.getMessagesAround(messageId, limit || 150),
  })
}

const searchMessages = ({ channel, query, limit, messageId }) => async ({ socket }) => {
  socket.emit('action', {
    type: 'client/FOUND_MESSAGES',
    payload: await api.searchMessages(channel, query, limit || 50, messageId),
  })
}

module.exports = {
  subscribeToChannels,
  subscribeToUsers,
  subscribeToMessages,
  getMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
  searchMessages,
}
