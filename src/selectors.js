import fp from 'lodash/fp'
import { createSelector } from 'reselect'

const channelName = state => state.channelName

const messagesByChannel = state => state.messagesByChannel

const messages = state => state.messages

const selectedChannel = state => state.channels[state.channelName]

const isLoading = createSelector(
  [selectedChannel],
  fp.isUndefined
)

const channelMessages = createSelector(
  [channelName, messagesByChannel],
  (channelName, messages) => fp.sortBy('timestamp', messages[channelName])
)

export {
  selectedChannel,
  isLoading,
  channelMessages,
}
