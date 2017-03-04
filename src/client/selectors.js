import _ from 'lodash'
import fp from 'lodash/fp'
import { createSelector } from 'reselect'

const isEmbedSelector = fp.get('isEmbed')

const locationSelector = fp.get('location')

const channelsSelector = fp.get('channels')

const sortedChannelsSelector = createSelector(
  channelsSelector,
  fp.sortBy('name')
)

const openedChannelsSelector = createSelector(
  channelsSelector, fp.get('messages'),
  (channels, messages) => fp.pipe(
    fp.map(channelName => channels[channelName]),
    fp.keyBy('name')
  )(fp.keys(messages))
)

const channelNameSelector = fp.get('channelName')

const getChannelSelector = (channelName = null) => createSelector(
  channelsSelector, channelNameSelector,
  (channels, name) => channels[channelName || name]
)

const getMessagesSelector = (channelName = null) => createSelector(
  fp.get('messages'), channelNameSelector,
  (messages, name) => (
    messages[channelName || name] || []
  )
)

const getLastMessageTimestampSelector = (channelName = null) => createSelector(
  getMessagesSelector(channelName),
  messages => fp.get('timestamp', fp.last(messages))
)

const usersSelector = createSelector(
  channelNameSelector, fp.get('users'),
  fp.get
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
  getChannelSelector(), usersSelector,
  (channel, users) => channel === undefined || users === undefined
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

const isSubscribedToMessagesSelector = createSelector(
  fp.get('isSubscribedToMessages'), channelNameSelector,
  (isSubscribedToMessages, channelName) => (
    isSubscribedToMessages[channelName]
  )
)

export {
  isEmbedSelector,
  locationSelector,
  channelsSelector,
  sortedChannelsSelector,
  openedChannelsSelector,
  channelNameSelector,
  getChannelSelector,
  getMessagesSelector,
  getLastMessageTimestampSelector,
  usersSelector,
  userCountSelector,
  groupedUsersSelector,
  isChannelLoadingSelector,
  isAppLoadingSelector,
  hasReachedBeginningSelector,
  isSubscribedToMessagesSelector,
}
