import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import { messageIdSelector } from './router'
import { channelIdSelector } from './channels'
import { isSearchOpenSelector, searchSelector } from './search'

const allMessagesSelector = state => state.messages

const messagesSelector = createSelector(
  allMessagesSelector,
  channelIdSelector,
  (messages, channelId) => messages[channelId],
)

const activeMessageSelector = createSelector(
  messageIdSelector,
  messagesSelector,
  (messageId, messages) =>
    messageId ? fp.find({ id: messageId }, messages) : null,
)

const isViewingArchiveSelector = createSelector(
  fp.get('isViewingArchive'),
  channelIdSelector,
  (isViewingArchive, channelId) => isViewingArchive[channelId],
)

const hasReachedBeginningSelector = createSelector(
  fp.get('hasReachedBeginning'),
  channelIdSelector,
  isSearchOpenSelector,
  searchSelector,
  (hasReachedBeginning, channelId, isSearchOpen, search) =>
    isSearchOpen ? search.hasReachedBeginning : hasReachedBeginning[channelId],
)

export {
  allMessagesSelector,
  messagesSelector,
  activeMessageSelector,
  isViewingArchiveSelector,
  hasReachedBeginningSelector,
}
