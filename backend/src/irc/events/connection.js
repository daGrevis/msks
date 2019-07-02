const _ = require('lodash')
const fp = require('lodash/fp')
const uuidv4 = require('uuid/v4')

const { newChannel, newStatusMessage, newMessage } = require('.')
const humanizeDelta = require('../../utils/humanizeDelta')
const humanizeOrdinal = require('../../utils/humanizeOrdinal')
const config = require('../../env/config')
const store = require('../../store')
const {
  createPublicChannelSelector,
  createPrivateChannelsSelector,
} = require('../../store/selectors/channels')
const {
  createChannel,
  updateChannel,
} = require('../../postgres/queries/channels')
const {
  broadcastConnection,
  broadcastChannel,
} = require('../../server/socket/broadcasters')
const join = require('../join')
const decideOnTracker = require('../decideOnTracker')
const shouldNotify = require('../shouldNotify')

const onRaw = async ({ payload, connection }) => {
  if (config.irc.raw) {
    console.log(
      `${connection.id} ${payload.from_server ? '<<<' : '>>>'} ${payload.line}`,
    )
  }
}

const onConnecting = async ({ connection }) => {
  const NOW = new Date()

  await newStatusMessage(connection, {
    createdAt: NOW,
    text: `Connecting as ${connection.nick}`,
    meta: {
      statusCode: 'CONNECTING',
      nick: connection.nick,
    },
  })

  store.dispatch({
    type: 'SET_IRC_CLIENT_NICK',
    payload: {
      connectionId: connection.id,
      nick: connection.nick,
    },
  })
}

const onConnected = async ({ connection, ircClient }) => {
  const NOW = new Date()

  await newStatusMessage(connection, {
    createdAt: NOW,
    text: `Connected as ${connection.nick}`,
    meta: {
      statusCode: 'CONNECTED',
      nick: connection.nick,
    },
  })

  const state = store.getState()

  store.dispatch({
    type: 'SET_IRC_CLIENT_CONNECTED',
    payload: {
      connectionId: connection.id,
    },
  })

  broadcastConnection({
    next: connection,
  })

  const connectionChannels = fp.filter(
    {
      connectionId: connection.id,
      type: 'shared',
    },
    state.channels,
  )

  const autoJoinChannelNames = fp.pipe(
    fp.filter(channel => {
      if (!channel.autoJoin) {
        return
      }

      const publicChannel = createPublicChannelSelector(channel)(state)
      if (publicChannel && publicChannel.autoJoin) {
        const { isTracker } = decideOnTracker(connection, channel.name)
        const publicConnection = state.connections[publicChannel.connectionId]
        const isTrackerJoined = state.isJoinedIrcChannel[publicChannel.id]

        const isTrackerJoining =
          publicConnection.autoConnect && !isTrackerJoined

        // Don't join the channel just yet because tracker is joining any moment now.
        // Done because we want our join messages to be public.
        if (!isTracker && isTrackerJoining) {
          return
        }
      }

      return true
    }),
    fp.map('name'),
    fp.sortBy(name => _.trimStart(_.toUpper(name), '#')),
  )(connectionChannels)

  if (autoJoinChannelNames.length) {
    for (const channelName of autoJoinChannelNames) {
      await newStatusMessage(connection, {
        createdAt: new Date(),
        text: `Auto-joining ${channelName}`,
        meta: {
          statusCode: 'AUTO_JOINING',
          nick: connection.nick,
          channelName,
        },
      })
    }

    join(connection, autoJoinChannelNames)
  }
}

const onSocketClose = async ({ connection }) => {
  const NOW = new Date()
  const state = store.getState()

  await newStatusMessage(connection, {
    createdAt: NOW,
    text: `Disconnected as ${connection.nick}`,
    meta: {
      statusCode: 'DISCONNECTED',
      nick: connection.nick,
    },
  })

  store.dispatch({
    type: 'SET_IRC_CLIENT_DISCONNECTED',
    payload: {
      connectionId: connection.id,
    },
  })

  broadcastConnection({
    next: connection,
  })

  const connectionChannels = fp.filter(
    {
      connectionId: connection.id,
      type: 'shared',
    },
    state.channels,
  )

  for (const channel of connectionChannels) {
    store.dispatch({
      type: 'UNSET_JOINED_IRC_CHANNEL',
      payload: {
        channelId: channel.id,
      },
    })

    broadcastChannel({
      next: channel,
    })
  }

  // FIXME: Make this a static import.
  // eslint-disable-next-line global-require
  const connect = require('../connect')

  if (connection.autoConnect) {
    const attempt = (state.connectionAttempts[connection.id] || 0) + 1

    store.dispatch({
      type: 'SET_CONNECTION_ATTEMPT',
      payload: {
        connectionId: connection.id,
        attempt,
      },
    })

    // http://dthain.blogspot.com/2009/02/exponential-backoff-in-distributed.html
    const delay = Math.round(
      Math.min(
        config.irc.autoReconnectMinDelay *
          config.irc.autoReconnectGrowFactor ** attempt,
        config.irc.autoReconnectMaxDelay,
      ) *
        (1 + Math.random() * config.irc.autoReconnectRandomFactor),
    )

    await newStatusMessage(connection, {
      createdAt: NOW,
      text: `Will attempt to reconnect in ${humanizeDelta(delay)} ${
        attempt > 1 ? ` [${humanizeOrdinal(attempt)} attempt]` : ''
      }`,
      meta: {
        statusCode: 'WILL_RECONNECT',
        nick: connection.nick,
        attempt,
        delay,
      },
    })

    setTimeout(() => {
      connect(connection)
    }, delay)
  }
}

const onIrcError = async ({ payload, connection }) => {
  const NOW = new Date()

  if (payload.error === 'no_such_nick') {
    await newStatusMessage(connection, {
      createdAt: NOW,
      text: `No such nick/channel ${payload.nick}`,
      meta: {
        statusCode: 'NO_SUCH_NICK',
        nick: payload.nick,
      },
    })
  }

  if (payload.error === 'cannot_send_to_channel') {
    await newStatusMessage(connection, {
      createdAt: NOW,
      text: `Cannot send to ${payload.channel}`,
      meta: {
        statusCode: 'CANNOT_SEND_TO_CHANNEL',
        channel: payload.channel,
      },
    })
  }

  if (payload.error === 'banned_from_channel') {
    await newStatusMessage(connection, {
      createdAt: NOW,
      text: `Banned from ${payload.channel}`,
      meta: {
        statusCode: 'BANNED_FROM_CHANNEL',
        channel: payload.channel,
      },
    })
  }
}

const onJoin = async ({ payload, connection }) => {
  if (payload.nick !== connection.nick) {
    return
  }

  const NOW = new Date()
  const state = store.getState()

  let channel = fp.find(
    {
      connectionId: connection.id,
      name: payload.channel,
    },
    state.channels,
  )

  if (channel) {
    if (!channel.autoJoin || channel.isHidden) {
      channel = await updateChannel(
        { id: channel.id },
        { autoJoin: true, isHidden: false },
      )
      store.dispatch({
        type: 'SYNC_POSTGRES',
        payload: {
          table: 'channels',
          change: { next: channel },
        },
      })
    }
  } else {
    // Create channel if it doesn't exist.
    channel = await createChannel({
      id: uuidv4(),
      createdAt: NOW,
      connectionId: connection.id,
      name: payload.channel,
      type: 'shared',
      autoJoin: true,
    })
    store.dispatch({
      type: 'SYNC_POSTGRES',
      payload: {
        table: 'channels',
        change: { next: channel },
      },
    })
  }

  store.dispatch({
    type: 'SET_JOINED_IRC_CHANNEL',
    payload: {
      channelId: channel.id,
    },
  })

  broadcastChannel({
    next: channel,
  })

  const { isTracker } = decideOnTracker(connection, payload.channel)

  // When tracker has joined, finally auto-join private channels.
  if (isTracker) {
    const privateChannels = createPrivateChannelsSelector(channel)(state)

    const autoJoinPrivateChannels = fp.filter(privateChannel => {
      if (!privateChannel.autoJoin) {
        return
      }

      if (!state.isIrcClientConnected[privateChannel.connectionId]) {
        return
      }

      if (state.isJoinedIrcChannel[privateChannel.id]) {
        return
      }

      return true
    }, privateChannels)

    for (const privateChannel of autoJoinPrivateChannels) {
      const privateConnection = state.connections[privateChannel.connectionId]

      await newStatusMessage(privateConnection, {
        createdAt: new Date(),
        text: `Auto-joining ${privateChannel.name}`,
        meta: {
          statusCode: 'AUTO_JOINING_DELAYED',
          nick: privateConnection.nick,
          channelName: privateChannel.name,
        },
      })

      join(privateConnection, [privateChannel.name])
    }
  }
}

const onPart = async ({ payload, connection }) => {
  if (payload.nick !== connection.nick) {
    return
  }

  const state = store.getState()

  let channel = fp.find(
    {
      connectionId: connection.id,
      name: payload.channel,
    },
    state.channels,
  )

  store.dispatch({
    type: 'UNSET_JOINED_IRC_CHANNEL',
    payload: {
      channelId: channel.id,
    },
  })

  channel = await updateChannel({ id: channel.id }, { autoJoin: false })
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
}

const onKick = async ({ payload, connection }) => {
  // When you are kicked.
  if (connection.nick !== payload.kicked) {
    return
  }

  const state = store.getState()

  const channel = fp.find(
    {
      connectionId: connection.id,
      name: payload.channel,
    },
    state.channels,
  )

  store.dispatch({
    type: 'UNSET_JOINED_IRC_CHANNEL',
    payload: {
      channelId: channel.id,
    },
  })

  broadcastChannel({
    next: channel,
  })
}

const onMessage = async ({ payload, connection }) => {
  const NOW = new Date()

  const channelName =
    payload.target === connection.nick ? payload.nick : payload.target

  let channelType = 'user'
  if (payload.target === '*' || payload.target[0] === '$') {
    // https://tools.ietf.org/html/rfc1459#section-4.4.1
    channelType = 'server'
  } else if (channelName[0] === '#') {
    channelType = 'shared'
  }

  let channel = await newChannel(connection, {
    createdAt: NOW,
    name: channelName,
    type: channelType,
    isHidden: false,
  })

  if (channel.isHidden) {
    channel = await updateChannel({ id: channel.id }, { isHidden: false })
    store.dispatch({
      type: 'SYNC_POSTGRES',
      payload: {
        table: 'channels',
        change: { next: channel },
      },
    })
  }

  const isNotification = shouldNotify(
    connection,
    channel,
    channelName,
    payload.message,
  )

  if (isNotification) {
    store.dispatch({
      type: 'INCREASE_UNREAD',
      payload: {
        channelId: channel.id,
      },
    })
  }

  if (channel.isHidden || isNotification) {
    broadcastChannel({
      next: channel,
    })
  }
}

const onNick = async () => {
  // if (payload.nick !== connection.nick) {
  //   return
  // }
  // TODO: Set the new nick.
}

const onNickInUse = async ({ payload, connection }) => {
  if (payload.nick !== connection.nick) {
    return
  }

  const NOW = new Date()

  await newStatusMessage(connection, {
    createdAt: NOW,
    text: `Nick ${payload.nick} is in use`,
    meta: {
      statusCode: 'NICK_IN_USE',
      nick: payload.nick,
    },
  })
}

const onNickInvalid = async ({ payload, connection }) => {
  if (payload.nick !== connection.nick) {
    return
  }

  const NOW = new Date()

  await newStatusMessage(connection, {
    createdAt: NOW,
    text: `Nick ${payload.nick} is invalid`,
    meta: {
      statusCode: 'NICK_INVALID',
      nick: payload.nick,
    },
  })
}

const onBanlist = async ({ payload, connection }) => {
  const NOW = new Date()
  const state = store.getState()

  const serverChannel = fp.find(
    {
      connectionId: connection.id,
      name: '*',
    },
    state.channels,
  )

  await newMessage(serverChannel, {
    createdAt: NOW,
    nick: connection.nick,
    type: 'banlist',
    meta: {
      channelName: payload.channel,
      bans: fp.map(
        ban => ({
          target: ban.banned,
          author: ban.banned_by,
          timestamp: Number(ban.banned_at),
        }),
        payload.bans,
      ),
    },
  })
}

const onWhois = async ({ payload, connection }) => {
  const NOW = new Date()

  const channel = await newChannel(connection, {
    createdAt: NOW,
    name: payload.nick,
    type: 'user',
  })

  await newMessage(channel, {
    createdAt: NOW,
    nick: payload.nick,
    type: 'whois',
    meta: payload.error
      ? { error: payload.error }
      : {
          account: payload.account,
          ident: payload.ident,
          hostname: payload.hostname,
          realName: payload.real_name,
          server: payload.server,
          serverInfo: payload.server_info,
          secure: payload.secure,
          away: payload.away,
        },
  })
}

module.exports = {
  onRaw,
  onConnecting,
  onConnected,
  onSocketClose,
  onIrcError,
  onJoin,
  onPart,
  onKick,
  onMessage,
  onNick,
  onNickInUse,
  onNickInvalid,
  onBanlist,
  onWhois,
}
