import fp from 'lodash/fp'
import { createAction } from 'redux-actions'
import uuid from 'uuid'
import Favico from 'favico.js'

import { allMessagesSelector } from './selectors'

const favicon = new Favico({
  animation: 'none',
})

const noop = createAction('NOOP')

const setEmbed = createAction('SET_EMBED')

const setVisibility = createAction('SET_VISIBILITY')

const navigated = createAction('NAVIGATED')

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

const unsubscribeFromAllMessages = createAction('UNSUBSCRIBE_FROM_ALL_MESSAGES')

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

const reconnect = () => (dispatch, getState) => {
  const state = getState()

  dispatch(subscribeToChannels())

  const { channelName } = state

  if (channelName) {
    const lastMessage = fp.last(allMessagesSelector(state)[channelName])

    if (!lastMessage) {
      return
    }

    dispatch(
      subscribeToMessages({
        channelName,
        timestamp: lastMessage.timestamp,
        messageId: lastMessage.id,
      })
    )
  }
}

export {
  noop,
  setEmbed,
  setVisibility,
  navigated,
  setTitle,
  setChannelName,
  subscribeToChannels,
  loadMessages,
  addMessage,
  addMessages,
  subscribeToMessages,
  unsubscribeFromAllMessages,
  subscribeToUsers,
  setScrollPosition,
  updateUnread,
  resetUnread,
  setFavicoBadge,
  addNotification,
  removeNotification,
  reconnect,
}
