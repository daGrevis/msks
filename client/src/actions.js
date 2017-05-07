import { createAction } from 'redux-actions'
import uuid from 'uuid'
import Favico from 'favico.js'

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

const setTitle = title => dispatch => {
  dispatch(createAction('SET_TITLE'))

  document.title = title
}

const setChannelName = createAction('SET_CHANNEL_NAME')

const subscribeToChannels = createAction('server/SUBSCRIBE_TO_CHANNELS')

const loadMessages = createAction('server/LOAD_MESSAGES')

const addMessage = createAction('ADD_MESSAGE')
const addMessages = createAction('ADD_MESSAGES')

const subscribeToMessages = createAction('server/SUBSCRIBE_TO_MESSAGES')

const subscribeToUsers = createAction('server/SUBSCRIBE_TO_USERS')

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
  subscribeToUsers,
  setScrollPosition,
  updateUnread,
  resetUnread,
  setFavicoBadge,
  addNotification,
  removeNotification,
}
