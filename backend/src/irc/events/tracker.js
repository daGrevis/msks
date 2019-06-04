const _ = require('lodash')
const fp = require('lodash/fp')
const uuidv4 = require('uuid/v4')

const { newMessage } = require('.')
const store = require('../../store')
const {
  createPrivateChannelsSelector,
} = require('../../store/selectors/channels')
const decideOnTracker = require('../decideOnTracker')
const { updateChannel } = require('../../postgres/queries/channels')
const {
  replaceUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../../postgres/queries/users')
const {
  broadcastChannel,
  broadcastUser,
  broadcastUsers,
} = require('../../server/socket/broadcasters')

const getTrackingChannelsByNick = (connection, nick) => {
  const state = store.getState()

  const connectionChannels = fp.filter(
    {
      connectionId: connection.id,
    },
    state.channels,
  )

  const trackingChannels = fp.filter(channel => {
    const { isTracking } = decideOnTracker(connection, channel.name, nick)

    if (!isTracking) {
      return false
    }

    const hasNick = !!fp.find(
      {
        channelId: channel.id,
        nick,
      },
      state.users,
    )

    if (!hasNick) {
      return false
    }

    return true
  }, connectionChannels)

  return trackingChannels
}

const trackQuits = async (trackingChannels, quitterNick) => {
  await Promise.all(
    _.map(trackingChannels, async channel => {
      await newMessage(channel, {
        createdAt: new Date(),
        nick: quitterNick,
        type: 'quit',
      })

      const user = await deleteUser({
        channelId: channel.id,
        nick: quitterNick,
      })
      store.dispatch({
        type: 'SYNC_POSTGRES',
        payload: {
          table: 'users',
          change: { prev: user },
        },
      })

      broadcastUser({ prev: user })
    }),
  )
}

const resetPrivateChannelsUsers = async publicChannel => {
  const state = store.getState()

  const privateChannels = createPrivateChannelsSelector(publicChannel)(state)

  if (!privateChannels.length) {
    return
  }

  const trackerUsers = fp.filter({ channelId: publicChannel.id }, state.users)

  await Promise.all(
    _.map(privateChannels, async privateChannel => {
      const isJoined = !!state.isJoinedIrcChannel[privateChannel.id]
      const isTrackerJoined = !!state.isJoinedIrcChannel[publicChannel.id]

      if (isJoined && !isTrackerJoined) {
        const nextUsers = fp.map(
          user => ({
            ...user,
            id: uuidv4(),
            channelId: privateChannel.id,
          }),
          trackerUsers,
        )

        const prevUsers = await replaceUsers(privateChannel.id, nextUsers)

        const changes = fp.concat(
          fp.map(user => ({ prev: user }), prevUsers),
          fp.map(user => ({ next: user }), nextUsers),
        )

        store.dispatch({
          type: 'SYNC_POSTGRES',
          payload: {
            table: 'users',
            changes,
          },
        })
      }

      broadcastUsers(publicChannel)
    }),
  )
}

const setPrivateChannelsTopic = async publicChannel => {
  const state = store.getState()

  const privateChannels = createPrivateChannelsSelector(publicChannel)(state)

  await Promise.all(
    _.map(privateChannels, async privateChannel => {
      privateChannel = await updateChannel(
        { id: privateChannel.id },
        { topic: publicChannel.topic },
      )
      store.dispatch({
        type: 'SYNC_POSTGRES',
        payload: {
          table: 'channels',
          change: { next: privateChannel },
        },
      })

      broadcastChannel({
        next: privateChannel,
      })
    }),
  )
}

const onMessage = async ({ payload, connection }) => {
  const NOW = new Date()
  const state = store.getState()

  const { isTracking } = decideOnTracker(connection, payload.target)

  if (!isTracking) {
    return
  }

  const channelName =
    payload.target === connection.nick ? payload.nick : payload.target

  const channel = fp.find(
    {
      connectionId: connection.id,
      name: channelName,
    },
    state.channels,
  )

  const messageType = {
    privmsg: 'text',
    notice: 'notice',
    action: 'action',
  }[payload.type]

  await newMessage(channel, {
    createdAt: NOW,
    nick: payload.nick,
    type: messageType,
    text: payload.message,
  })
}

const onJoin = async ({ payload, connection }) => {
  const NOW = new Date()
  const state = store.getState()

  const { isTracking } = decideOnTracker(
    connection,
    payload.channel,
    payload.nick,
  )

  if (!isTracking) {
    return
  }

  const channel = fp.find(
    {
      connectionId: connection.id,
      name: payload.channel,
    },
    state.channels,
  )

  let user = fp.find(
    {
      channelId: channel.id,
      nick: payload.nick,
    },
    state.users,
  )

  // User can already exist because of data inconsistencies caused by crash.
  // Don't create a user when this connection joins because onUserlist will come right after.
  if (!user && payload.nick !== connection.nick) {
    user = await createUser({
      id: uuidv4(),
      createdAt: NOW,
      channelId: channel.id,
      nick: payload.nick,
    })
    store.dispatch({
      type: 'SYNC_POSTGRES',
      payload: {
        table: 'users',
        change: { next: user },
      },
    })

    broadcastUser({ next: user })
  }

  await newMessage(channel, {
    createdAt: NOW,
    nick: payload.nick,
    type: 'join',
  })
}

const onPart = async ({ payload, connection }) => {
  const NOW = new Date()
  const state = store.getState()

  const { isTracking } = decideOnTracker(
    connection,
    payload.channel,
    payload.nick,
  )

  if (!isTracking) {
    return
  }

  const channel = fp.find(
    {
      connectionId: connection.id,
      name: payload.channel,
    },
    state.channels,
  )

  await newMessage(channel, {
    createdAt: NOW,
    nick: payload.nick,
    type: 'part',
  })

  const user = fp.find(
    {
      channelId: channel.id,
      nick: payload.nick,
    },
    state.users,
  )

  if (user) {
    await deleteUser({
      id: user.id,
    })
    store.dispatch({
      type: 'SYNC_POSTGRES',
      payload: {
        table: 'users',
        change: { prev: user },
      },
    })

    broadcastUser({ prev: user })
  }

  const isPublicChannelTracker =
    channel.isPublic && payload.nick === connection.nick
  if (isPublicChannelTracker) {
    await resetPrivateChannelsUsers(channel)
  }
}

const onKick = async ({ payload, connection }) => {
  const NOW = new Date()
  const state = store.getState()

  const { isTracking } = decideOnTracker(connection, payload.channel)

  if (!isTracking) {
    return
  }

  const channel = fp.find(
    {
      connectionId: connection.id,
      name: payload.channel,
    },
    state.channels,
  )

  const user = fp.find(
    {
      channelId: channel.id,
      nick: payload.kicked,
    },
    state.users,
  )

  if (user) {
    await deleteUser({
      id: user.id,
    })
    store.dispatch({
      type: 'SYNC_POSTGRES',
      payload: {
        table: 'users',
        change: { prev: user },
      },
    })

    broadcastUser({ prev: user })
  }

  const isPublicChannelTracker =
    channel.isPublic && payload.nick === connection.nick
  if (isPublicChannelTracker) {
    await resetPrivateChannelsUsers(channel)
  }

  await newMessage(channel, {
    createdAt: NOW,
    nick: payload.nick,
    type: 'kick',
    text: payload.message === payload.kicked ? '' : payload.message,
    meta: {
      kicked: payload.kicked,
      isOp: user.isOp,
      isVoiced: user.isVoiced,
    },
  })
}

const onUserlist = async ({ payload, connection }) => {
  const NOW = new Date()
  const state = store.getState()

  const { isTracking } = decideOnTracker(connection, payload.channel)

  if (!isTracking) {
    return
  }

  const channel = fp.find(
    {
      connectionId: connection.id,
      name: payload.channel,
    },
    state.channels,
  )

  const nextUsers = fp.map(
    user => ({
      id: uuidv4(),
      createdAt: NOW,
      channelId: channel.id,
      nick: user.nick,
      isOp: _.includes(user.modes, 'o'),
      isVoiced: _.includes(user.modes, 'v'),
    }),
    payload.users,
  )

  const prevUsers = await replaceUsers(channel.id, nextUsers)

  const changes = fp.concat(
    fp.map(user => ({ prev: user }), prevUsers),
    fp.map(user => ({ next: user }), nextUsers),
  )

  store.dispatch({
    type: 'SYNC_POSTGRES',
    payload: {
      table: 'users',
      changes,
    },
  })

  broadcastUsers(channel)
}

const onQuit = async ({ payload, connection }) => {
  const state = store.getState()

  // Self quits are tracked in onSocketClose because we might not receive onQuit for self quit.
  if (payload.nick === connection.nick) {
    return
  }

  const trackingChannels = fp.filter(
    channel => state.isJoinedIrcChannel[channel.id],
    getTrackingChannelsByNick(connection, payload.nick),
  )

  // Someone who we are tracking quits.
  await trackQuits(trackingChannels, payload.nick)
}

const onSocketClose = async ({ connection }) => {
  const state = store.getState()

  const trackingChannels = getTrackingChannelsByNick(
    connection,
    connection.nick,
  )

  // Someone who is tracking quits.
  await trackQuits(trackingChannels, connection.nick)

  const trackerChannels = fp.filter(
    {
      isPublic: true,
      connectionId: connection.id,
    },
    state.channels,
  )

  await Promise.all(
    _.map(trackerChannels, async channel => resetPrivateChannelsUsers(channel)),
  )
}

const onMode = async ({ payload, connection }) => {
  const NOW = new Date()
  const state = store.getState()

  const { isTracking } = decideOnTracker(connection, payload.target)

  if (!isTracking) {
    return
  }

  const channel = fp.find(
    {
      connectionId: connection.id,
      name: payload.target,
    },
    state.channels,
  )

  await Promise.all(
    _.map(payload.modes, async ({ mode, param }) => {
      const isOpMode = mode === '+o' || mode === '-o'
      const isVoiceMode = mode === '+v' || mode === '-v'
      const isBanMode = mode === '+b' || mode === '-b'

      if (isOpMode || isVoiceMode) {
        const user = await updateUser(
          {
            channelId: channel.id,
            nick: param,
          },
          {
            [isOpMode ? 'isOp' : 'isVoiced']: mode[0] === '+',
          },
        )
        store.dispatch({
          type: 'SYNC_POSTGRES',
          payload: {
            table: 'users',
            change: { next: user },
          },
        })

        broadcastUser({
          next: user,
        })

        await newMessage(channel, {
          createdAt: NOW,
          nick: payload.nick,
          type: 'mode',
          text: `${payload.nick} set ${mode} on ${param}`,
          meta: {
            mode,
            param,
            isOp: user.isOp,
            isVoiced: user.isVoiced,
          },
        })
      }

      if (isBanMode) {
        await newMessage(channel, {
          createdAt: NOW,
          nick: payload.nick,
          type: 'mode',
          text: `${payload.nick} set ${mode} on ${param}`,
          meta: {
            mode,
            param,
          },
        })
      }
    }),
  )
}

const onTopic = async ({ payload, connection }) => {
  const NOW = new Date()

  const { isTracking } = decideOnTracker(connection, payload.channel)

  if (!isTracking) {
    return
  }

  const channel = await updateChannel(
    {
      connectionId: connection.id,
      name: payload.channel,
    },
    { topic: payload.topic },
  )
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

  if (payload.nick) {
    await newMessage(channel, {
      createdAt: NOW,
      nick: payload.nick,
      type: 'topic',
      text: payload.topic,
    })
  }

  if (channel.isPublic) {
    await setPrivateChannelsTopic(channel)
  }
}

const onNick = async ({ payload, connection }) => {
  const state = store.getState()

  const trackingChannels = fp.filter(
    channel => state.isJoinedIrcChannel[channel.id],
    getTrackingChannelsByNick(connection, payload.nick),
  )

  await Promise.all(
    _.map(trackingChannels, async channel => {
      await newMessage(channel, {
        createdAt: new Date(),
        nick: payload.nick,
        type: 'nick',
        meta: {
          newNick: payload.new_nick,
        },
      })

      const user = await updateUser(
        {
          channelId: channel.id,
          nick: payload.nick,
        },
        {
          nick: payload.new_nick,
        },
      )
      store.dispatch({
        type: 'SYNC_POSTGRES',
        payload: {
          table: 'users',
          change: { next: user },
        },
      })

      broadcastUser({
        next: user,
      })
    }),
  )
}

module.exports = {
  onMessage,
  onJoin,
  onPart,
  onKick,
  onUserlist,
  onQuit,
  onSocketClose,
  onMode,
  onTopic,
  onNick,
}
