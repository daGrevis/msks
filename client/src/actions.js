import fp from 'lodash/fp'
import { createAction } from 'redux-actions'
import * as qs from 'querystring'
import Favico from 'favico.js'

import config from './config'
import { navigate } from './history'
import {
  messagesSelector,
  foundMessagesSelector, isSearchOpenSelector, isSearchQueryEmptySelector, searchQuerySelector,
} from './selectors'

const favico = new Favico({
  animation: 'none',
  bgColor: '#e91e63',
})

const setBroken = createAction('SET_BROKEN')
const setVisibility = createAction('SET_VISIBILITY')

const saveLastScrollPosition = createAction('SAVE_LAST_SCROLL_POSITION')

const setTitle = title => dispatch => {
  if (document.title !== title) {
    dispatch({
      type: 'SET_TITLE',
      payload: title,
    })

    document.title = title
  }
}

const navigated = createAction('NAVIGATED')

const socketConnected = createAction('SOCKET_CONNECTED')
const socketDisconnected = createAction('SOCKET_DISCONNECTED')
const socketReconnected = createAction('SOCKET_RECONNECTED')

const subscribeToChannels = createAction('server/SUBSCRIBE_TO_CHANNELS')

const subscribeToUsers = channelName => (dispatch, getState) => {
  const state = getState()

  const channelNames = channelName ? [channelName] : fp.keys(state.isSubscribedToUsers)

  for (const channelName of channelNames) {
    if (state.isSubscribedToUsers[channelName]) {
      continue
    }

    dispatch({
      type: 'server/SUBSCRIBE_TO_USERS',
      payload: { channelName },
    })
  }
}

const subscribeToMessages = () => (dispatch, getState) => {
  const state = getState()

  const channelNames = config.embedChannel ? [config.embedChannel] : fp.keys(state.channels)

  for (const channelName of channelNames) {
    if (state.isSubscribedToMessages[channelName]) {
      continue
    }

    dispatch({
      type: 'server/SUBSCRIBE_TO_MESSAGES',
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

const getMessagesAround = messageId => dispatch => {
  dispatch({
    type: 'server/GET_MESSAGES_AROUND',
    payload: {
      messageId: messageId,
    },
  })
}

const leaveArchive = () => (dispatch, getState) => {
  dispatch({
    type: 'LEAVE_ARCHIVE',
  })

  const state = getState()

  const href = config.embedChannel ? '' : state.channelName

  navigate(href)

  dispatch(
    getMessages()
  )
}

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
  dispatch({
    type: 'TOGGLE_SEARCH',
  })

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
  const state = getState()

  if (isSearchQueryEmptySelector(state)) {
    return
  }

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
  saveLastScrollPosition,
  setTitle,
  navigated,
  socketConnected,
  socketDisconnected,
  socketReconnected,
  subscribeToChannels,
  subscribeToUsers,
  subscribeToMessages,
  getMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
  leaveArchive,
  updateUnread,
  resetUnread,
  setFavicoBadge,
  toggleSearch,
  inputSearch,
  searchMessages,
}
