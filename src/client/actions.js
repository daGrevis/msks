import _ from 'lodash'
import { createAction } from 'redux-actions'
import uuid from 'uuid'

const initApp = createAction('INIT_APP')

const navigated = createAction('NAVIGATED')

const openChannel = createAction('OPEN_CHANNEL')

const setChannelName = createAction('SET_CHANNEL_NAME')

const subscribeToChannels = createAction('server/SUBSCRIBE_TO_CHANNELS')

const updateChannel = createAction('UPDATE_CHANNEL')

const loadMessages = createAction('LOAD_MESSAGES')
const loadMessagesFromServer = createAction('server/LOAD_MESSAGES')

const addMessage = createAction('ADD_MESSAGE')
const addMessages = createAction('ADD_MESSAGES')

const subscribeToMessages = createAction('server/SUBSCRIBE_TO_MESSAGES')

const unsubscribeFromAllMessages = createAction('UNSUBSCRIBE_FROM_ALL_MESSAGES')

const addNotification = message => dispatch => {
  dispatch({ type: 'ADD_NOTIFICATION', payload: {
    message,
    key: uuid(),
  }})
}

const removeNotification = createAction('REMOVE_NOTIFICATION')

export {
  initApp,
  navigated,
  openChannel,
  setChannelName,
  subscribeToChannels,
  updateChannel,
  loadMessages,
  loadMessagesFromServer,
  addMessage,
  addMessages,
  subscribeToMessages,
  unsubscribeFromAllMessages,
  addNotification,
  removeNotification,
}
