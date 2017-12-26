import Promise from 'bluebird'
import fp from 'lodash/fp'
import { createAction } from 'redux-actions'
import * as qs from 'querystring'
import Favico from 'favico.js'

import config from './config'
import http from './http'
import { history } from './history'
import {
  messagesSelector, hasReachedBeginningSelector,
  foundMessagesSelector, isSearchOpenSelector, isSearchQueryEmptySelector, searchQuerySelector,
} from './selectors'

let getMessagesBeforePromise = Promise.resolve()
let getMessagesAfterPromise = Promise.resolve()
let searchMessagesPromise = Promise.resolve()

const favico = new Favico({
  animation: 'none',
  bgColor: '#e91e63',
})

const setBroken = createAction('SET_BROKEN')
const setVisibility = createAction('SET_VISIBILITY')

const saveLastScrollPosition = ({ id, position }) => (dispatch, getState) => {
  const state = getState()

  if (fp.isEqual(fp.get(['scrollPositions', id], state), position)) {
    return
  }

  dispatch({
    type: 'SAVE_LAST_SCROLL_POSITION',
    payload: { id, position },
  })
}

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

const getMessages = () => async (dispatch, getState) => {
  const state = getState()

  const messages = messagesSelector(state)

  if (messages.length) {
    return
  }

  dispatch({
    type: 'GET_MESSAGES',
    payload: {
      channel: state.channelName,
    },
  })

  const response = await http.get('/api/messages', {
    params: {
      channel: state.channelName,
    },
  })

  dispatch({
    type: 'SET_MESSAGES',
    payload: response.data,
  })
}

const getMessagesBefore = () => async (dispatch, getState) => {
  if (!getMessagesBeforePromise.isFulfilled()) {
    return
  }

  const state = getState()

  const hasReachedBeginning = hasReachedBeginningSelector(state)

  if (hasReachedBeginning) {
    return
  }

  const messages = messagesSelector(state)

  if (!messages.length) {
    return
  }

  const firstMessage = fp.first(messages)

  dispatch({
    type: 'GET_MESSAGES_BEFORE',
    payload: {
      messageId: firstMessage.id,
    },
  })

  getMessagesBeforePromise = http.get(`/api/messages/before/${firstMessage.id}`)
  const response = await getMessagesBeforePromise

  dispatch({
    type: 'SET_MESSAGES_BEFORE',
    payload: response.data,
  })
}

const getMessagesAfter = () => async (dispatch, getState) => {
  if (!getMessagesAfterPromise.isFulfilled()) {
    return
  }

  const state = getState()

  if (!state.isViewingArchive[state.channelName]) {
    return
  }

  const messages = messagesSelector(state)

  if (!messages.length) {
    return
  }

  const lastMessage = fp.last(messages)

  dispatch({
    type: 'GET_MESSAGES_AFTER',
    payload: {
      messageId: lastMessage.id,
    },
  })

  getMessagesAfterPromise = http.get(`/api/messages/after/${lastMessage.id}`)
  const response = await getMessagesAfterPromise

  dispatch({
    type: 'SET_MESSAGES_AFTER',
    payload: response.data,
  })
}

const getMessagesAround = messageId => async dispatch => {
  dispatch({
    type: 'GET_MESSAGES_AROUND',
    payload: {
      messageId,
    },
  })

  const response = await http.get(`/api/messages/around/${messageId}`)

  dispatch({
    type: 'SET_MESSAGES_AROUND',
    payload: response.data,
  })
}

const leaveArchive = () => (dispatch, getState) => {
  dispatch({
    type: 'LEAVE_ARCHIVE',
  })

  const state = getState()

  const href = config.embedChannel ? '' : state.channelName

  history.push(href)

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

  history.push(href)
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

  if (fp.isEmpty(prevQuery)) {
    history.push(href)
  } else {
    history.replace(href)
  }
}

const searchMessages = ({ query }) => async (dispatch, getState) => {
  const state = getState()

  const hasReachedBeginning = hasReachedBeginningSelector(state)

  if (hasReachedBeginning) {
    return
  }

  if (isSearchQueryEmptySelector(state)) {
    return
  }

  const messages = foundMessagesSelector(state)

  const firstMessage = messages[0]

  if (firstMessage && !getMessagesBeforePromise.isFulfilled()) {
    return
  }

  dispatch({
    type: 'SEARCH_MESSAGES',
    payload: {
      channel: state.channelName,
      text: query.text,
      nick: query.nick,
      messageId: firstMessage ? firstMessage.id : null,
    },
  })

  searchMessagesPromise = http.get('/api/messages/search', {
    params: {
      channel: state.channelName,
      text: query.text,
      nick: query.nick,
      messageId: firstMessage ? firstMessage.id : null,
    },
  })
  const response = await searchMessagesPromise

  dispatch({
    type: 'FOUND_MESSAGES',
    payload: response.data,
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
