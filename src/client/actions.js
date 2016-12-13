import _ from 'lodash'
import fp from 'lodash/fp'
import { createAction } from 'redux-actions'
import uuid from 'uuid'

import { channelNameSelector } from './selectors'

const navigated = createAction('NAVIGATED')

const subscribeToChannels = createAction('server/SUBSCRIBE_TO_CHANNELS')

const updateChannel = createAction('UPDATE_CHANNEL')

const loadMessages = (timestamp = null) => (dispatch, getState) => {
  const state = getState()

  const channelName = channelNameSelector(state)

  if (!channelName) {
    return
  }

  const cacheKey = [channelName, timestamp]

  if (fp.some(fp.isEqual(cacheKey), state.loadMessagesCache)) {
    return
  }

  dispatch({
    type: 'server/LOAD_MESSAGES',
    payload: { channelName, timestamp },
  })
}

const addMessage = createAction('ADD_MESSAGE')
const addMessages = createAction('ADD_MESSAGES')

const subscribeToMessages = createAction('server/SUBSCRIBE_TO_MESSAGES')

const addNotification = message => dispatch => {
  dispatch({ type: 'ADD_NOTIFICATION', payload: {
    message,
    key: uuid(),
  }})
}

const removeNotification = createAction('REMOVE_NOTIFICATION')

export {
  navigated,
  subscribeToChannels,
  updateChannel,
  loadMessages,
  addMessage,
  addMessages,
  subscribeToMessages,
  addNotification,
  removeNotification,
}
