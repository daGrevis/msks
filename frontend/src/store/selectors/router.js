import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import config from '../../env/config'

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

const singleConnectionSelector = createSelector(
  fp.get('connections'),
  connections => fp.size(connections) === 1 && fp.first(fp.values(connections)),
)

const channelNameSelector = createSelector(
  paramsSelector,
  singleConnectionSelector,
  (params, singleConnection) => {
    if (config.isPublicEmbed) {
      return config.publicEmbedChannelName
    }

    const { channelNameOrNick, channelNameOrMessageId } = params

    let channelName = singleConnection
      ? channelNameOrNick
      : channelNameOrMessageId

    if (!channelName) {
      return
    }

    channelName = channelName.replace(/~/g, '#')

    return channelName
  },
)

const nickSelector = createSelector(
  paramsSelector,
  singleConnectionSelector,
  (params, singleConnection) => {
    const { channelNameOrNick } = params

    return singleConnection ? singleConnection.nick : channelNameOrNick
  },
)

const messageIdSelector = createSelector(
  paramsSelector,
  singleConnectionSelector,
  (params, singleConnection) => {
    const { channelNameOrMessageId, messageId } = params

    if (config.isPublicEmbed) {
      return messageId
    }

    return singleConnection ? channelNameOrMessageId : messageId
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
