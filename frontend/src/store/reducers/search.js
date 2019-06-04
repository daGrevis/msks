import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

import { searchQuerySelector } from '../selectors/search'
import { channelSelector } from '../selectors/channels'

const foundMessages = ({ payload }) => state => {
  const { query, messages } = payload

  const prevQuery = searchQuerySelector(state)
  const isRelevant =
    prevQuery.text !== query.text || prevQuery.nick !== query.nick
  if (isRelevant) {
    return state
  }

  return fp.update(['search', query.channelId], prevSearch => {
    let nextMessages
    if (query.before) {
      nextMessages = fp.concat(messages, prevSearch.messages)
    } else if (query.after) {
      nextMessages = fp.concat(prevSearch.messages, messages)
    } else {
      nextMessages = messages
    }

    let nextHasReachedBeginning
    if (!query.after) {
      nextHasReachedBeginning = messages.length < query.limit
    } else {
      nextHasReachedBeginning = prevSearch.hasReachedBeginning
    }

    return {
      query,
      hasReachedBeginning: nextHasReachedBeginning,
      messages: nextMessages,
    }
  })(state)
}

export default handleActions({
  INPUT_SEARCH: () => fp.set(['search', 'hasReachedBeginning'], false),

  FOUND_MESSAGES: foundMessages,
  FOUND_MESSAGES_BEFORE: foundMessages,
  FOUND_MESSAGES_AFTER: foundMessages,

  OUTDATE_SEARCH: ({ payload }) =>
    fp.set(['search', payload.channelId, 'isOutdated'], true),

  SOCKET_CONNECTED: ({ payload }) => state => {
    if (!payload.isReconnected) {
      return state
    }

    const channel = channelSelector(state)
    if (!channel) {
      return state
    }

    return fp.set(['search', channel.id, 'isOutdated'], true)(state)
  },
})
