const fp = require('lodash/fp')
const uuidv4 = require('uuid/v4')

const store = require('../../store')
const {
  createChannel,
  updateChannel,
} = require('../../postgres/queries/channels')
const { createMessage } = require('../../postgres/queries/messages')
const {
  broadcastChannel,
  broadcastMessage,
} = require('../../server/socket/broadcasters')

const newChannel = async (connection, channel) => {
  const state = store.getState()

  const existingChannel = fp.find(
    x =>
      x.connectionId === connection.id &&
      fp.toUpper(x.name) === fp.toUpper(channel.name),
    state.channels,
  )

  if (existingChannel) {
    if (channel.name !== existingChannel.name) {
      channel = await updateChannel(
        { id: existingChannel.id },
        { name: channel.name },
      )
      store.dispatch({
        type: 'SYNC_POSTGRES',
        payload: {
          table: 'channels',
          change: { next: channel },
        },
      })

      broadcastChannel({
        prev: existingChannel,
        next: channel,
      })
    }

    return existingChannel
  }

  channel = await createChannel({
    id: uuidv4(),
    connectionId: connection.id,
    ...channel,
  })
  store.dispatch({
    type: 'SYNC_POSTGRES',
    payload: {
      table: 'channels',
      change: { next: channel },
    },
  })

  broadcastChannel({
    next: channel,
  })

  return channel
}

const newMessage = async (channel, message) => {
  const state = store.getState()

  const user = fp.find(
    {
      channelId: channel.id,
      nick: message.nick,
    },
    state.users,
  )

  message = await createMessage({
    id: uuidv4(),
    channelId: channel.id,
    text: '',
    isOp: user && user.isOp,
    isVoiced: user && user.isVoiced,
    ...message,
    meta: JSON.stringify(message.meta),
  })

  broadcastMessage({ next: message })

  return message
}

const newStatusMessage = async (connection, message) => {
  const createdAt = message.createdAt || new Date()

  const serverChannel = await newChannel(connection, {
    createdAt,
    name: '*',
    type: 'server',
  })

  return newMessage(serverChannel, {
    type: 'status',
    nick: '',
    createdAt,
    ...message,
  })
}

module.exports = {
  newChannel,
  newMessage,
  newStatusMessage,
}
