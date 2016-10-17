import fp from 'lodash/fp'
import { createSelector } from 'reselect'

const channelName = state => state.channelName

const channels = state => state.channels

const messages = state => state.messages

const selectedChannel = state => state.channels[state.channelName]

const isLoading = createSelector(
  [selectedChannel],
  fp.isUndefined
)

const sortedMessages = createSelector(
  [messages],
  messages => fp.sortBy('timestamp', messages)
)

export {
  selectedChannel,
  isLoading,
  sortedMessages,
}
