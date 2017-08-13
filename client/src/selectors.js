import _ from 'lodash'
import fp from 'lodash/fp'
import { createSelector } from 'reselect'

const isEmbedSelector = fp.get('isEmbed')

const routeSelector = fp.get('route')

const querySelector = createSelector(
  routeSelector,
  fp.get('query')
)

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

const isSearchOpenSelector = createSelector(
  querySelector,
  query => fp.has('search', query)
)

const searchQuerySelector = createSelector(
  querySelector,
  query => fp.pick(['text', 'nick'], query)
)

const searchSelector = fp.get('search')

const isSearchOutdatedSelector = createSelector(
  searchSelector, searchQuerySelector,
  ({ query }, searchQuery) => !fp.isEqual(query, searchQuery)
)

const searchHighlightsSelector = createSelector(
  searchQuerySelector,
  ({ text }) => !text ? [] : text.split(' ')

)

const foundMessagesSelector = createSelector(
  searchSelector, isSearchOutdatedSelector,
  ({ messages }, isOutdated) => isOutdated ? [] : messages
)

const allMessagesSelector = state => state.messages || []

const messagesSelector = createSelector(
  allMessagesSelector, channelNameSelector, isSearchOpenSelector, foundMessagesSelector,
  (messages, channelName, isSearchOpen, foundMessages) => {
    if (isSearchOpen) {
      return foundMessages
    }

    return messages[channelName] || []
  }
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
  fp.get('hasReachedBeginning'), channelNameSelector, isSearchOpenSelector, searchSelector,
  (hasReachedBeginning, channelName, isSearchOpen, search) => {
    if (isSearchOpen) {
      return search.hasReachedBeginning
    }

    return hasReachedBeginning[channelName]
  }
)

export {
  isEmbedSelector,
  routeSelector,
  channelsSelector,
  sortedChannelsSelector,
  openChannelsSelector,
  channelNameSelector,
  channelSelector,
  isSearchOpenSelector,
  searchQuerySelector,
  isSearchOutdatedSelector,
  searchHighlightsSelector,
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
