import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import config from '../../env/config'
import isUuid from '../../utils/isUuid'

const routeSelector = fp.get('route')

const querySelector = createSelector(
  routeSelector,
  route => route.query,
)

const paramsSelector = createSelector(
  routeSelector,
  route => route.params,
)

const serverIdSelector = createSelector(
  paramsSelector,
  params => {
    if (config.isPublicEmbed) {
      return config.publicEmbedServerId
    }

    return params.serverId
  },
)

const sessionSelector = fp.get('session')

const connectionsSelector = fp.get('connections')

const channelsSelector = fp.get('channels')

// Logged in with single connection.
const singleConnectionSelector = createSelector(
  sessionSelector,
  connectionsSelector,
  (session, connections) =>
    session && fp.size(connections) === 1
      ? fp.values(connections)[0]
      : undefined,
)

// Route like /freenode/~meeseekeria/:id? is missing nick, but /freenode/msks/~meeseekeria/:id? is not.
const isNickMissingSelector = createSelector(
  paramsSelector,
  singleConnectionSelector,
  (params, singleConnection) =>
    !!(
      !params.messageId &&
      (!params.channelNameOrMessageId ||
        isUuid(params.channelNameOrMessageId) ||
        singleConnection)
    ),
)

const channelNameSelector = createSelector(
  paramsSelector,
  isNickMissingSelector,
  (params, isNickMissing) => {
    if (config.isPublicEmbed) {
      return config.publicEmbedChannelName
    }

    let channelName = isNickMissing
      ? params.channelNameOrNick
      : params.channelNameOrMessageId

    if (!channelName) {
      return
    }

    channelName = channelName.replace(/~/g, '#')

    return channelName
  },
)

const nickSelector = createSelector(
  connectionsSelector,
  channelsSelector,
  paramsSelector,
  serverIdSelector,
  channelNameSelector,
  isNickMissingSelector,
  singleConnectionSelector,
  (
    connections,
    channels,
    params,
    serverId,
    channelName,
    isNickMissing,
    singleConnection,
  ) => {
    if (singleConnection) {
      return singleConnection.nick
    }

    const isMyNick =
      !isNickMissing &&
      fp.some(
        connection => connection.nick === params.channelNameOrNick,
        connections,
      )

    // Logged in with multiple connections.
    if (isMyNick) {
      return params.channelNameOrNick
    }

    const matchingChannels = fp.filter({ name: channelName }, channels)
    const matchingConnections = fp.pipe(
      fp.map(channel => connections[channel.connectionId]),
      fp.filter({ serverId }),
    )(matchingChannels)

    if (!matchingConnections.length) {
      return undefined
    }

    const firstConnection = fp.first(
      fp.sortBy(
        connection => [connection.serverId, connection.nick],
        matchingConnections,
      ),
    )

    return firstConnection.nick
  },
)

const messageIdSelector = createSelector(
  paramsSelector,
  isNickMissingSelector,
  (params, isNickMissing) => {
    if (config.isPublicEmbed) {
      return params.messageId
    }

    return isNickMissing ? params.channelNameOrMessageId : params.messageId
  },
)

export {
  routeSelector,
  querySelector,
  paramsSelector,
  serverIdSelector,
  channelNameSelector,
  nickSelector,
  messageIdSelector,
}
