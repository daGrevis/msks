import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import { querySelector, channelNameSelector } from './router'
import { channelSelector } from './channels'

const searchSelector = createSelector(
  fp.get('search'),
  channelSelector,
  (search, channel) => (channel ? search[channel.id] || {} : {}),
)

const isSearchOpenSelector = createSelector(
  querySelector,
  query => query.search !== undefined,
)

const searchQuerySelector = createSelector(
  querySelector,
  query => fp.pick(['text', 'nick'], query),
)

const isSearchQueryEmptySelector = createSelector(
  searchQuerySelector,
  query => fp.isEmpty(query) || fp.every(fp.isEmpty, query),
)

const isSearchRelevantSelector = createSelector(
  searchSelector,
  searchQuerySelector,
  channelNameSelector,
  (search, searchQuery) =>
    !fp.isEqual(
      fp.pick(['text', 'nick'], search.query),
      fp.pick(['text', 'nick'], searchQuery),
    ),
)

const isSearchOutdatedSelector = createSelector(
  searchSelector,
  search => search.isOutdated,
)

const foundMessagesSelector = createSelector(
  searchSelector,
  isSearchRelevantSelector,
  (search, isOutdated) =>
    search.messages && !isOutdated ? search.messages : undefined,
)

const searchHighlightsSelector = createSelector(
  searchQuerySelector,
  ({ text }) => (!text ? [] : text.split(' ')),
)

const isSearchIntroSelector = createSelector(
  isSearchOpenSelector,
  isSearchQueryEmptySelector,
  (isSearchOpen, isSearchQueryEmpty) => isSearchOpen && isSearchQueryEmpty,
)

const isSearchNotFoundSelector = createSelector(
  isSearchOpenSelector,
  isSearchIntroSelector,
  isSearchRelevantSelector,
  foundMessagesSelector,
  (isSearchOpen, isSearchIntro, isSearchOutdated, messages) =>
    isSearchOpen && !isSearchIntro && !isSearchOutdated && !messages.length,
)

export {
  searchSelector,
  isSearchOpenSelector,
  searchQuerySelector,
  isSearchQueryEmptySelector,
  isSearchRelevantSelector,
  isSearchOutdatedSelector,
  foundMessagesSelector,
  searchHighlightsSelector,
  isSearchIntroSelector,
  isSearchNotFoundSelector,
}
