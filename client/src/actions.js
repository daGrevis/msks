import fp from 'lodash/fp'
import { createAction } from 'redux-actions'
import uuid from 'uuid'
import * as qs from 'querystring'
import Favico from 'favico.js'

import { navigate } from './history'
import { messagesSelector, isSearchOpenSelector, searchQuerySelector } from './selectors'

const favicon = new Favico({
  animation: 'none',
})

const noop = createAction('NOOP')

const setEmbed = createAction('SET_EMBED')

const setBroken = createAction('SET_BROKEN')

const setVisibility = createAction('SET_VISIBILITY')

const navigated = createAction('NAVIGATED')

const socketConnected = createAction('SOCKET_CONNECTED')

const socketDisconnected = createAction('SOCKET_DISCONNECTED')

const setTitle = title => (dispatch, getState) => {
  if (document.title !== title) {
    dispatch({ type: 'SET_TITLE', payload: title })

    document.title = title
  }
}

const setChannelName = payload => (dispatch, getState) => {
  if (getState().channelName !== payload) {
    dispatch({ type: 'SET_CHANNEL_NAME', payload })
  }
}

const subscribeToChannels = createAction('server/SUBSCRIBE_TO_CHANNELS')

const subscribeToMessages = createAction('server/SUBSCRIBE_TO_MESSAGES')

const unsubscribeFromMessages = payload => (dispatch, getState) => {
  const isSubscribed = getState().isSubscribedToMessages[payload.channelName]
  if (!isSubscribed) {
    return
  }

  dispatch({
    type: 'server/UNSUBSCRIBE_FROM_MESSAGES',
    payload,
  })
}

const subscribeToUsers = createAction('server/SUBSCRIBE_TO_USERS')

const loadMessages = payload => (dispatch, getState) => {
  const state = getState()

  const isInitialMessages = !payload.messageId && !payload.before && !payload.after

  // Avoid loading initial messages twice.
  if (isInitialMessages && state.loadCache[state.channelName]) {
    return
  }

  // Avoid loading before/after messages twice.
  if (payload.messageId && state.loadCache[payload.messageId]) {
    return
  }

  const messages = messagesSelector(state)

  // Avoid loading initial messages when not needed.
  if (isInitialMessages && messages.length) {
    return
  }

  // Avoid loading existing message.
  if (payload.messageId && !payload.before && !payload.after && fp.find({ id: payload.messageId }, messages)) {
    return
  }

  if (payload.messageId && !payload.before && !payload.after) {
    dispatch(unsubscribeFromMessages({ channelName: payload.channelName }))
  }

  dispatch({
    type: 'server/LOAD_MESSAGES',
    payload,
  })
}

const addMessage = createAction('ADD_MESSAGE')
const addMessages = createAction('ADD_MESSAGES')

const setScrollPosition = createAction('SET_SCROLL_POSITION')

const updateUnread = createAction('UPDATE_UNREAD')
const resetUnread = createAction('RESET_UNREAD')

const setFavicoBadge = () => (dispatch, getState) => {
  favicon.badge(getState().unread)
}

const addNotification = message => dispatch => {
  dispatch({ type: 'ADD_NOTIFICATION', payload: {
    message,
    key: uuid(),
  }})
}

const removeNotification = createAction('REMOVE_NOTIFICATION')

const toggleSearch = () => (dispatch, getState) => {
  dispatch({ type: 'TOGGLE_SEARCH' })

  const state = getState()
  const { channelName } = state
  const isOpen = isSearchOpenSelector(state)

  const search = isOpen ? '' : '?search'
  const href = state.isEmbed ? search : `${channelName}${search}`

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

  dispatch({ type: 'INPUT_SEARCH', payload: nextQuery })

  const search = (
    '?search'
    + (!fp.isEmpty(nextQuery) ? '&' : '')
    + qs.encode(nextQuery)
  )
  const href = state.isEmbed ? search : `${channelName}${search}`

  navigate(href)
}

const search = ({ query, offset, messageId }) => (dispatch, getState) => {
  if (fp.isEmpty(query)) {
    return
  }

  const state = getState()
  const messages = messagesSelector(state)

  if (messages.length && state.searchCache[messageId]) {
    return
  }

  dispatch({
    type: 'server/SEARCH',
    payload: {
      channel: state.channelName,
      query,
      offset,
      messageId,
    },
  })
}

export {
  noop,
  setEmbed,
  setBroken,
  setVisibility,
  navigated,
  socketConnected,
  socketDisconnected,
  setTitle,
  setChannelName,
  subscribeToChannels,
  loadMessages,
  addMessage,
  addMessages,
  subscribeToMessages,
  unsubscribeFromMessages,
  subscribeToUsers,
  setScrollPosition,
  updateUnread,
  resetUnread,
  setFavicoBadge,
  addNotification,
  removeNotification,
  toggleSearch,
  inputSearch,
  search,
}
