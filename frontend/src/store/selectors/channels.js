import _ from 'lodash'
import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import { channelNameSelector } from './router'
import { serverIdSelector, connectionSelector } from './connections'

const channelsSelector = fp.get('channels')

const groupedChannelsByConnectionSelector = createSelector(
  channelsSelector,
  fp.get('connections'),
  (channels, connections) =>
    fp.pipe(
      fp.reject({ isHidden: true }),
      fp.groupBy('connectionId'),
      fp.mapValues(
        fp.pipe(
          fp.sortBy(channel => [
            channel.unread > 0 ? 0 : 1,
            fp.pipe(
              fp.toUpper,
              s => _.trimStart(s, '#'),
            )(channel.name),
          ]),
          fp.groupBy('type'),
        ),
      ),
      fp.toPairs,
      fp.sortBy(([connectionId]) => {
        const connection = connections[connectionId]
        return [connection.serverId, connection.nick]
      }),
    )(channels),
)

const channelSelector = createSelector(
  connectionSelector,
  channelsSelector,
  serverIdSelector,
  channelNameSelector,
  (connection, channels, serverId, channelName) => {
    if (!connection) {
      return
    }

    return fp.find(
      channel =>
        channel.connectionId === connection.id &&
        fp.toUpper(channel.name) === fp.toUpper(channelName),
      channels,
    )
  },
)

const channelIdSelector = createSelector(
  channelSelector,
  channel => (channel ? channel.id : undefined),
)

const unreadChannelsSelector = createSelector(
  channelsSelector,
  channelSelector,
  (channels, channel) =>
    fp.filter(
      ({ unread, id }) => unread > 0 && (channel ? channel.id !== id : true),
      channels,
    ),
)

const hasAnyUnreadSelector = createSelector(
  unreadChannelsSelector,
  channels => channels.length > 0,
)

const createIsChannelDisabledSelector = (connection, channel) => () => {
  if (!channel) {
    return true
  }

  return channel.type === 'shared' ? !channel.isJoined : !connection.isConnected
}

export {
  channelsSelector,
  groupedChannelsByConnectionSelector,
  channelSelector,
  channelIdSelector,
  unreadChannelsSelector,
  hasAnyUnreadSelector,
  createIsChannelDisabledSelector,
}
