import _ from 'lodash'
import fp from 'lodash/fp'
import { createSelector } from 'reselect'

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

const isSearchQueryEmptySelector = createSelector(
  searchQuerySelector,
  query => fp.isEmpty(query) || fp.every(fp.isEmpty, query)
)

const searchSelector = fp.get('search')

const isSearchOutdatedSelector = createSelector(
  searchSelector, searchQuerySelector, channelNameSelector,
  (search, searchQuery, channelName) => (
    search.channelName !== channelName
    || !fp.isEqual(search.query, searchQuery)
  )
)

const searchHighlightsSelector = createSelector(
  searchQuerySelector,
  ({ text }) => !text ? [] : text.split(' ')
)

const foundMessagesSelector = createSelector(
  searchSelector, isSearchOutdatedSelector,
  ({ messages }, isOutdated) => isOutdated ? [] : messages
)

const isSearchIntroSelector = createSelector(
  isSearchOpenSelector, isSearchQueryEmptySelector,
  (isSearchOpen, isSearchQueryEmpty) => isSearchOpen && isSearchQueryEmpty
)

const isSearchNotFoundSelector = createSelector(
  isSearchOpenSelector, isSearchIntroSelector, isSearchOutdatedSelector, foundMessagesSelector,
  (isSearchOpen, isSearchIntro, isSearchOutdated, messages) => (
    isSearchOpen
    && !isSearchIntro
    && !isSearchOutdated
    && !messages.length
  )
)

const allMessagesSelector = state => state.messages || []

const messagesSelector = createSelector(
  allMessagesSelector, channelNameSelector,
  (messages, channelName) => messages[channelName] || []
)

const activeMessageSelector = createSelector(
  routeSelector, messagesSelector,
  (route, messages) => (
    route.params.messageId
    ? fp.find({ id: route.params.messageId }, messages)
    : null
  )
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

const isAppLoadingSelector = createSelector(
  routeSelector, channelSelector, channelsSelector,
  (route, channel, channels) => (
    route.meta.isChannel ? !channel : fp.isEmpty(channels)
  )
)

const hasReachedBeginningSelector = createSelector(
  fp.get('hasReachedBeginning'), channelNameSelector, isSearchOpenSelector, searchSelector,
  (hasReachedBeginning, channelName, isSearchOpen, search) => (
    isSearchOpen ? search.hasReachedBeginning : hasReachedBeginning[channelName]
  )
)

export {
  routeSelector,
  channelsSelector,
  sortedChannelsSelector,
  channelNameSelector,
  channelSelector,
  isSearchOpenSelector,
  searchQuerySelector,
  isSearchQueryEmptySelector,
  isSearchOutdatedSelector,
  searchHighlightsSelector,
  foundMessagesSelector,
  isSearchIntroSelector,
  isSearchNotFoundSelector,
  allMessagesSelector,
  messagesSelector,
  activeMessageSelector,
  allUsersSelector,
  usersSelector,
  userCountSelector,
  groupedUsersSelector,
  isAppLoadingSelector,
  hasReachedBeginningSelector,
}
