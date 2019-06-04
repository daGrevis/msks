const fp = require('lodash/fp')

const store = require('../../store')
const {
  createAccountConnectionsSelector,
  publicConnectionsSelector,
} = require('../../store/selectors/connections')
const {
  createAccountChannelsSelector,
  publicChannelsSelector,
} = require('../../store/selectors/channels')
const { createChannelUsersSelector } = require('../../store/selectors/users')
const { getSession } = require('../../postgres/queries/sessions')

const authenticateSocket = ({ sessionId, token }) => async socket => {
  if (!sessionId || !token) {
    socket.emit('action', {
      type: 'client/SOCKET_UNAUTHENTICATED',
      payload: {
        error: 'Param sessionId & token is required!',
      },
    })
    return
  }

  const session = await getSession(sessionId)

  if (!session || session.token !== token) {
    socket.emit('action', {
      type: 'client/SOCKET_UNAUTHENTICATED',
      payload: {
        error: 'Invalid token!',
      },
    })
    return
  }

  socket.emit('action', {
    type: 'client/SOCKET_AUTHENTICATED',
    payload: {
      session,
    },
  })

  store.dispatch({
    type: 'SET_SOCKET_SESSION',
    payload: {
      socket,
      session,
    },
  })
}

const subscribeToChannels = () => async socket => {
  const state = store.getState()

  const session = state.socketSessions[socket.id]

  const payload = {
    isInitial: true,
    changes: fp.map(
      channel => ({
        next: channel,
      }),
      session
        ? createAccountChannelsSelector(session.accountId)(state)
        : publicChannelsSelector(state),
    ),
  }
  socket.emit('action', {
    type: 'client/CHANNEL_CHANGES',
    payload,
  })

  store.dispatch({
    type: 'SET_SUBSCRIBED_TO_CHANNELS',
    payload: {
      socket,
    },
  })
}

const subscribeToConnections = () => async socket => {
  const state = store.getState()

  const session = state.socketSessions[socket.id]

  const payload = {
    isInitial: true,
    changes: fp.map(
      connection => ({
        next: {
          ...fp.omit('password', connection),
          isConnected: !!state.isIrcClientConnected[connection.id],
        },
      }),
      session
        ? createAccountConnectionsSelector(session.accountId)(state)
        : publicConnectionsSelector(state),
    ),
  }
  socket.emit('action', {
    type: 'client/CONNECTION_CHANGES',
    payload,
  })

  store.dispatch({
    type: 'SET_SUBSCRIBED_TO_CONNECTIONS',
    payload: {
      socket,
    },
  })
}

const subscribeToUsers = ({ channelId }) => async socket => {
  if (!channelId) {
    socket.emit('action', {
      type: 'client/SUBSCRIBE_TO_USERS_ERROR',
      payload: {
        error: 'Param channelId is required!',
      },
    })
    return
  }

  const state = store.getState()

  const session = state.socketSessions[socket.id]

  const channel = state.channels[channelId]

  if (!channel) {
    socket.emit('action', {
      type: 'client/SUBSCRIBE_TO_USERS_ERROR',
      payload: {
        error: 'Channel not found!',
      },
    })
    return
  }

  const connection = state.connections[channel.connectionId]

  if (!channel.isPublic) {
    if (!session) {
      socket.emit('action', {
        type: 'client/SUBSCRIBE_TO_USERS_ERROR',
        payload: {
          error: 'Session not found!',
        },
      })
      return
    }

    if (connection.accountId !== session.accountId) {
      socket.emit('action', {
        type: 'client/SUBSCRIBE_TO_USERS_ERROR',
        payload: {
          error: 'Connection forbidden for session!',
        },
      })
      return
    }
  }

  const channelUsers = createChannelUsersSelector(channel)(state)

  const payload = {
    isInitial: true,
    changes: fp.map(
      user => ({
        next: {
          ...user,
          channelId,
        },
      }),
      channelUsers,
    ),
  }

  socket.emit('action', {
    type: 'client/USER_CHANGES',
    payload,
  })

  store.dispatch({
    type: 'SET_SUBSCRIBED_TO_USERS',
    payload: {
      socket,
      channelId,
    },
  })
}

const subscribeToMessages = ({ channelId }) => async socket => {
  store.dispatch({
    type: 'SET_SUBSCRIBED_TO_MESSAGES',
    payload: {
      channelId,
      socket,
    },
  })
}

const actions = {
  'server/AUTHENTICATE_SOCKET': authenticateSocket,
  'server/SUBSCRIBE_TO_CHANNELS': subscribeToChannels,
  'server/SUBSCRIBE_TO_CONNECTIONS': subscribeToConnections,
  'server/SUBSCRIBE_TO_USERS': subscribeToUsers,
  'server/SUBSCRIBE_TO_MESSAGES': subscribeToMessages,
}

module.exports = actions
