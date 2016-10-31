import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import { stripURI, mo } from './utils'

const router = state => state.router

const channels = state => state.channels

const channelName = createSelector(
  [router, channels],
  (router, channels) => {
    // Can't store '#' in URI like in '/#vim' so we escape to '/vim' and later try to find match.
    const channel = fp.find(channel => (
      router.params.channel === stripURI(channel.name)
    ))(channels)
    return channel ? channel.name : null
  }
)

const messagesByChannel = state => state.messagesByChannel

const selectedChannel = createSelector(
  [channels, channelName],
  (channels, channelName) => channels[channelName]
)

const isAppLoading = () => false

const isChannelLoading = createSelector(
  [selectedChannel],
  (selectedChannel) => {
    return !selectedChannel
  }
)

const sortedChannels = createSelector(
  [channels],
  fp.sortBy('name')
)

const channelMessages = createSelector(
  [channelName, messagesByChannel],
  (channelName, messagesByChannel) => fp.sortBy('timestamp', messagesByChannel[channelName])
)

const channelMessagesByDay = createSelector(
  [channelMessages],
  fp.pipe(
    fp.groupBy(m => mo(m.timestamp).startOf('day').toISOString()),
    fp.toPairs,
    fp.orderBy(x => mo(x[0]).unix(), 'asc')
  )
)

export {
  channelName,
  selectedChannel,
  isAppLoading,
  isChannelLoading,
  sortedChannels,
  channelMessages,
  channelMessagesByDay,
}
