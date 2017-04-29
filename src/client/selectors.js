import _ from 'lodash'
import fp from 'lodash/fp'
import { createSelector } from 'reselect'

const isEmbedSelector = fp.get('isEmbed')

const locationSelector = fp.get('location')

const channelsSelector = state => state.channels || []

const sortedChannelsSelector = createSelector(
  channelsSelector,
  fp.sortBy('name')
)

const openChannelsSelector = createSelector(
  channelsSelector, fp.get('messages'),
  (channels, messages) => fp.pipe(
    fp.map(channelName => channels[channelName]),
    fp.keyBy('name')
  )(fp.keys(messages))
)

const channelNameSelector = fp.get('channelName')

const channelSelector = createSelector(
  channelsSelector, channelNameSelector,
  (channels, channelName) => channels[channelName]
)

const allMessagesSelector = state => state.messages || []

const messagesSelector = createSelector(
  allMessagesSelector, channelNameSelector,
  (messages, channelName) => messages[channelName] || []
)

const allUsersSelector = state => state.users || []

const usersSelector = createSelector(
  allUsersSelector, channelNameSelector,
  (users, channelName) => users[channelName]
)

const userCountSelector = createSelector(
  usersSelector,
  fp.size
)

const groupedUsersSelector = createSelector(
  usersSelector,
  fp.pipe(
    fp.groupBy(({ isOp, isVoiced }) => {
      if (isOp) return 'op'
      if (isVoiced) return 'voiced'
      return 'normal'
    }),
    fp.mapValues(fp.sortBy(user => fp.toUpper(user.nick)))
  )
)

const isChannelLoadingSelector = createSelector(
  channelSelector,
  channel => !channel
)

const isAppLoadingSelector = createSelector(
  channelsSelector, channelNameSelector, isChannelLoadingSelector,
  (channels, channelName, isChannelLoading) => (
    channelName ? isChannelLoading : fp.isEmpty(channels)
  )
)

const hasReachedBeginningSelector = createSelector(
  fp.get('hasReachedBeginning'), channelNameSelector,
  (hasReachedBeginning, channelName) => (
    hasReachedBeginning[channelName]
  )
)

export {
  isEmbedSelector,
  locationSelector,
  channelsSelector,
  sortedChannelsSelector,
  openChannelsSelector,
  channelNameSelector,
  channelSelector,
  allMessagesSelector,
  messagesSelector,
  allUsersSelector,
  usersSelector,
  userCountSelector,
  groupedUsersSelector,
  isChannelLoadingSelector,
  isAppLoadingSelector,
  hasReachedBeginningSelector,
}
