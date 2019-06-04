import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import { serverIdSelector, channelNameSelector, nickSelector } from './router'
import { hasSessionSelector } from './session'

const connectionSelector = createSelector(
  fp.get('connections'),
  fp.get('channels'),
  hasSessionSelector,
  serverIdSelector,
  channelNameSelector,
  nickSelector,
  (connections, channels, hasSession, serverId, channelName, nick) => {
    if (!channelName) {
      return
    }

    if (!hasSession) {
      const publicChannel = fp.find(
        {
          isPublic: true,
          name: channelName,
        },
        channels,
      )

      if (!publicChannel) {
        return
      }

      return fp.find({ id: publicChannel.connectionId }, connections)
    }

    return fp.find({ serverId, nick }, connections)
  },
)

export { serverIdSelector, nickSelector, connectionSelector }
