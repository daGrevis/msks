import fp from 'lodash/fp'

import { push, replace } from './router'
import http from '../../networking/http'
import { getLinkToSearch } from '../../routing/links'
import { channelSelector } from '../selectors/channels'
import { connectionSelector } from '../selectors/connections'
import {
  foundMessagesSelector,
  searchQuerySelector,
  isSearchQueryEmptySelector,
} from '../selectors/search'

const inputSearch = query => (dispatch, getState) => {
  const state = getState()

  const connection = connectionSelector(state)
  const channel = channelSelector(state)

  const prevQuery = searchQuerySelector(state)

  const nextQuery = fp.omitBy(fp.isEmpty, {
    text: query.text !== undefined ? query.text : prevQuery.text,
    nick: query.nick !== undefined ? query.nick : prevQuery.nick,
  })

  dispatch({
    type: 'INPUT_SEARCH',
    payload: nextQuery,
  })

  const href =
    getLinkToSearch(connection.serverId, connection.nick, channel.name) +
    (!fp.isEmpty(nextQuery) ? '&' : '')

  if (fp.isEmpty(prevQuery)) {
    dispatch(push(href, nextQuery))
  } else {
    dispatch(replace(href, nextQuery))
  }
}

const searchMessages = ({ query }) => async (dispatch, getState) => {
  const state = getState()

  if (isSearchQueryEmptySelector(state)) {
    return
  }

  const channel = channelSelector(state)

  query = {
    ...query,
    channelId: channel.id,
  }

  dispatch({
    type: 'SEARCH_MESSAGES',
    payload: {
      query,
    },
  })

  const response = await http.get(`/api/messages`, { params: query })

  dispatch({
    type: 'FOUND_MESSAGES',
    payload: response.data,
  })
}

const searchMessagesBefore = ({ query }) => async (dispatch, getState) => {
  const state = getState()

  const channel = channelSelector(state)
  const messages = foundMessagesSelector(state)

  const firstMessage = messages[0]

  query = {
    ...query,
    channelId: channel.id,
    before: firstMessage ? firstMessage.id : null,
  }

  dispatch({
    type: 'SEARCH_MESSAGES_BEFORE',
    payload: {
      query,
    },
  })

  const response = await http.get(`/api/messages`, { params: query })

  dispatch({
    type: 'FOUND_MESSAGES_BEFORE',
    payload: response.data,
  })
}

const searchMessagesAfter = ({ query }) => async (dispatch, getState) => {
  const state = getState()

  const channel = channelSelector(state)
  const messages = foundMessagesSelector(state)

  const lastMessage = fp.last(messages)

  query = {
    ...query,
    channelId: channel.id,
    after: lastMessage ? lastMessage.id : null,
  }

  dispatch({
    type: 'SEARCH_MESSAGES_AFTER',
    payload: {
      query,
    },
  })

  const response = await http.get(`/api/messages`, { params: query })

  dispatch({
    type: 'FOUND_MESSAGES_AFTER',
    payload: response.data,
  })
}

const outdateSearch = channelId => dispatch => {
  dispatch({
    type: 'OUTDATE_SEARCH',
    payload: { channelId },
  })
}

export {
  inputSearch,
  searchMessages,
  searchMessagesBefore,
  searchMessagesAfter,
  outdateSearch,
}
