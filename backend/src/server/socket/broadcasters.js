const _ = require('lodash')
const fp = require('lodash/fp')

const store = require('../../store')
const {
  publicConnectionsSelector,
  createAccountConnectionsSelector,
} = require('../../store/selectors/connections')
const {
  createAccountChannelsSelector,
} = require('../../store/selectors/channels')
const { createChannelUsersSelector } = require('../../store/selectors/users')
const shouldNotify = require('../../irc/shouldNotify')

const broadcastConnection = change => {
  const state = store.getState()

  const connection = change.next

  const publicConnections = publicConnectionsSelector(state)

  _.forEach(state.socketClients, socket => {
    const isSubscribed = state.isSubscribedToConnections[socket.id]
    if (!isSubscribed) {
      return
    }

    const session = state.socketSessions[socket.id]

    if (
      (session && session.accountId === connection.accountId) ||
      publicConnections[connection.id]
    ) {
      // Connection belongs to this session or is public.
      const changes = [
        {
          next: {
            ...fp.omit('password', connection),
            isConnected: !!state.isIrcClientConnected[connection.id],
          },
        },
      ]

      socket.emit('action', {
        type: 'client/CONNECTION_CHANGES',
        payload: {
          changes,
        },
      })
    }
  })
}

const broadcastChannel = change => {
  const state = store.getState()

  const channel = change.next

  _.forEach(state.socketClients, socket => {
    const isSubscribed = state.isSubscribedToChannels[socket.id]
    if (!isSubscribed) {
      return
    }

    const session = state.socketSessions[socket.id]

    const accountChannels =
      session && createAccountChannelsSelector(session.accountId)(state)

    if (channel.isPublic || (session && accountChannels[channel.id])) {
      // Channel is public or it belongs to this session.
      const changes = [
        {
          prev: change.prev,
          next: {
            ...channel,
            isJoined: !!state.isJoinedIrcChannel[channel.id],
            unread: session ? state.unread[channel.id] || 0 : 0,
          },
        },
      ]

      socket.emit('action', {
        type: 'client/CHANNEL_CHANGES',
        payload: {
          changes,
        },
      })
    }
  })
}

const getRelevantSessionChannels = (session, channel) => {
  const state = store.getState()

  if (!session) {
    if (channel.isPublic) {
      return [channel]
    }
  } else {
    const accountConnections = createAccountConnectionsSelector(
      session.accountId,
    )(state)
    if (!channel.isPublic) {
      if (accountConnections[channel.connectionId]) {
        // It's a private channel and its connection belongs to this session.
        return [channel]
      }
    } else {
      const accountChannels = createAccountChannelsSelector(session.accountId)(
        state,
      )
      const connection = state.connections[channel.connectionId]

      const relevantChannels = fp.filter(
        ({ name, connectionId }) =>
          channel.name === name &&
          accountConnections[connectionId].serverId === connection.serverId,
        accountChannels,
      )

      // It's a public channel and this session has connection that's the tracker itself and/or someone with a private channel.
      return relevantChannels
    }
  }

  return []
}

const broadcastMessage = change => {
  const state = store.getState()

  const message = change.next

  const channel = state.channels[message.channelId]

  _.forEach(state.socketClients, socket => {
    const session = state.socketSessions[socket.id]

    const relevantChannels = getRelevantSessionChannels(session, channel)

    const changes = _.compact(
      _.map(relevantChannels, relevantChannel => {
        const relevantConnection =
          state.connections[relevantChannel.connectionId]

        const isSubscribed = fp.get(
          [socket.id, relevantChannel.id],
          state.isSubscribedToMessages,
        )

        const isNotification =
          session &&
          shouldNotify(
            relevantConnection,
            relevantChannel,
            message.nick,
            message.text,
          )

        if (
          !isSubscribed &&
          !isNotification &&
          relevantChannel.type !== 'server'
        ) {
          return
        }

        return {
          next: {
            ...message,
            channelId: relevantChannel.id,
            meta: message.meta && JSON.parse(message.meta),
            isNotification,
          },
        }
      }),
    )

    if (changes.length) {
      socket.emit('action', {
        type: 'client/MESSAGE_CHANGES',
        payload: {
          changes,
        },
      })
    }
  })
}

const broadcastUser = change => {
  const state = store.getState()

  const user = change.next || change.prev

  const channel = state.channels[user.channelId]

  _.forEach(state.socketClients, socket => {
    const session = state.socketSessions[socket.id]

    const relevantChannels = getRelevantSessionChannels(session, channel)

    const changes = _.compact(
      _.map(relevantChannels, relevantChannel => {
        const isSubscribed = fp.get(
          [socket.id, relevantChannel.id],
          state.isSubscribedToUsers,
        )
        if (!isSubscribed) {
          return
        }

        return {
          [change.next ? 'next' : 'prev']: {
            ...user,
            channelId: relevantChannel.id,
          },
        }
      }),
    )

    if (changes.length) {
      socket.emit('action', {
        type: 'client/USER_CHANGES',
        payload: {
          changes,
        },
      })
    }
  })
}

const broadcastUsers = channel => {
  const state = store.getState()

  _.forEach(state.socketClients, socket => {
    const session = state.socketSessions[socket.id]

    const relevantChannels = getRelevantSessionChannels(session, channel)

    for (const relevantChannel of relevantChannels) {
      const isSubscribed = fp.get(
        [socket.id, relevantChannel.id],
        state.isSubscribedToUsers,
      )
      if (!isSubscribed) {
        continue
      }

      const nextUsers = createChannelUsersSelector(relevantChannel)(state)

      socket.emit('action', {
        type: 'client/USER_CHANGES',
        payload: {
          isInitial: true,
          changes: _.map(nextUsers, user => ({
            next: {
              ...user,
              channelId: relevantChannel.id,
            },
          })),
        },
      })
    }
  })
}

module.exports = {
  broadcastConnection,
  broadcastChannel,
  broadcastMessage,
  broadcastUser,
  broadcastUsers,
}
