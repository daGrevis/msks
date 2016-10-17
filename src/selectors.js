import fp from 'lodash/fp'
import { createSelector } from 'reselect'

const channelName = state => state.channelName

const channels = state => state.channels

const messages = state => state.messages

const selectedChannel = createSelector(
  [channels, channelName],
  (channels, channelName) => channels[channelName] || '',
)

const sortedMessages = createSelector(
  [messages],
  messages => fp.sortBy('timestamp', messages)
)

export {
  selectedChannel,
  sortedMessages,
}
