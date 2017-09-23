import fp from 'lodash/fp'
import { createAction } from 'redux-actions'
import * as qs from 'querystring'
import Favico from 'favico.js'

import config from './config'
import { navigate } from './history'
import {
  messagesSelector, foundMessagesSelector, isSearchOpenSelector, searchQuerySelector,
} from './selectors'

const favico = new Favico({
  animation: 'none',
  bgColor: '#e91e63',
})

const setBroken = createAction('SET_BROKEN')

const setVisibility = createAction('SET_VISIBILITY')

const navigated = createAction('NAVIGATED')

const socketConnected = createAction('SOCKET_CONNECTED')

const socketDisconnected = createAction('SOCKET_DISCONNECTED')

const setTitle = title => (dispatch, getState) => {
  if (document.title !== title) {
    dispatch({
      type: 'SET_TITLE',
      payload: title,
    })

    document.title = title
  }
}

const subscribeToChannels = createAction('server/SUBSCRIBE_TO_CHANNELS')

const subscribeToMessages = ({ channelName }) => (dispatch, getState) => {
  const state = getState()

  const isSubscribedToMessages = fp.get(['isSubscribedToMessages', channelName], state)
  if (isSubscribedToMessages) {
    return
  }

  dispatch({
    type: 'server/SUBSCRIBE_TO_MESSAGES',
    payload: { channelName },
  })
}

const subscribeToUsers = channelName => (dispatch, getState) => {
  const state = getState()

  const channelNames = channelName ? [channelName] : fp.keys(state.isSubscribedToUsers)

  for (const channelName of channelNames) {
    if (state.isSubscribedToUsers[channelName]) {
      break
    }

    dispatch({
      type: 'server/SUBSCRIBE_TO_USERS',
      payload: { channelName },
    })
  }
}

const getMessages = () => (dispatch, getState) => {
  const state = getState()

  const messages = messagesSelector(state)

  if (messages.length) {
    return
  }

  dispatch({
    type: 'server/GET_MESSAGES',
    payload: {
      channel: state.channelName,
    },
  })
}

const getMessagesBefore = () => (dispatch, getState) => {
  const state = getState()

  const messages = messagesSelector(state)

  if (!messages.length) {
    return
  }

  const firstMessage = fp.first(messages)

  if (state.loadCache[firstMessage.id]) {
    return
  }

  dispatch({
    type: 'server/GET_MESSAGES_BEFORE',
    payload: {
      messageId: firstMessage.id,
    },
  })
}

const getMessagesAfter = () => (dispatch, getState) => {
  const state = getState()

  if (!state.isViewingArchive[state.channelName]) {
    return
  }

  const messages = messagesSelector(state)

  if (!messages.length) {
    return
  }

  const lastMessage = fp.last(messages)

  if (state.loadCache[lastMessage.id]) {
    return
  }

  dispatch({
    type: 'server/GET_MESSAGES_AFTER',
    payload: {
      messageId: lastMessage.id,
    },
  })
}

const getMessagesAround = messageId => (dispatch, getState) => {
  dispatch({
    type: 'server/GET_MESSAGES_AROUND',
    payload: {
      messageId: messageId,
    },
  })
}

const setScrollPosition = createAction('SET_SCROLL_POSITION')

const updateUnread = createAction('UPDATE_UNREAD')
const resetUnread = createAction('RESET_UNREAD')

const setFavicoBadge = () => (dispatch, getState) => {
  const { unread } = getState()

  dispatch({
    type: 'SET_FAVICO_BADGE',
    payload: unread,
  })

  favico.badge(unread)
}

const toggleSearch = () => (dispatch, getState) => {
  dispatch({ type: 'TOGGLE_SEARCH' })

  const state = getState()
  const { channelName } = state
  const isOpen = isSearchOpenSelector(state)

  const search = isOpen ? '' : '?search'
  const href = config.embedChannel ? search : `${channelName}${search}`

  navigate(href)
}

const inputSearch = query => (dispatch, getState) => {
  const state = getState()
  const { channelName } = state
  const prevQuery = searchQuerySelector(state)

  const nextQuery = fp.omitBy(fp.isEmpty, {
    text: query.text !== undefined ? query.text : prevQuery.text,
    nick: query.nick !== undefined ? query.nick : prevQuery.nick,
  })

  dispatch({
    type: 'INPUT_SEARCH',
    payload: nextQuery,
  })

  const search = (
    '?search'
    + (!fp.isEmpty(nextQuery) ? '&' : '')
    + qs.encode(nextQuery)
  )
  const href = config.embedChannel ? search : `${channelName}${search}`

  navigate(href)
}

const searchMessages = ({ query }) => (dispatch, getState) => {
  if (fp.isEmpty(query)) {
    return
  }

  const state = getState()
  const messages = foundMessagesSelector(state)

  const firstMessage = messages[0]

  if (firstMessage && state.searchCache === firstMessage.id) {
    return
  }

  dispatch({
    type: 'server/SEARCH_MESSAGES',
    payload: {
      channel: state.channelName,
      query,
      messageId: firstMessage ? firstMessage.id : null,
    },
  })
}

export {
  setBroken,
  setVisibility,
  navigated,
  socketConnected,
  socketDisconnected,
  setTitle,
  subscribeToChannels,
  getMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
  subscribeToMessages,
  subscribeToUsers,
  setScrollPosition,
  updateUnread,
  resetUnread,
  setFavicoBadge,
  toggleSearch,
  inputSearch,
  searchMessages,
}
