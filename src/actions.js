import _ from 'lodash'
import moment from 'moment'
import { createAction } from 'redux-actions'

import { channelName } from './selectors'
import socket from './websocket-client'

const navigate = location => dispatch => {
  dispatch({
    type: 'ROUTER_PUSH',
    payload: location,
  })
}

const addMessage = createAction('ADD_MESSAGE')
const addMessages = createAction('ADD_MESSAGES')

const subscribeToChannels = () => dispatch => {
  socket.emit('action', { type: 'SUBSCRIBE_TO_CHANNELS' })
}

const updateChannel = createAction('UPDATE_CHANNEL')

const channelChange = change => dispatch => {
  const { new_val = null } = change

  if (new_val !== null) {
    dispatch(updateChannel(new_val))
  }
}

const loadChannel = () => (dispatch, getState) => {
  const state = getState()

  const name = channelName(state)

  if (!name) {
    return
  }

  if (_.has(state, ['isChannelLoadingInitiated', name])) {
    return
  } else {
    dispatch(createAction('LOAD_CHANNEL')(name))
  }

  // Code below gets run only once.

  dispatch(loadMessages(name))
}

const loadMessages = channelName => dispatch => {
  dispatch(createAction('LOAD_MESSAGES')(channelName))

  socket.emit('action', {
    type: 'LOAD_MESSAGES',
    payload: { channelName },
  })
}

const subscribeToMessages = (channelName, timestamp) => dispatch => {
  socket.emit('action', {
    type: 'SUBSCRIBE_TO_MESSAGES',
    payload: { channelName, timestamp },
  })
}

const loadedMessages = ({ channelName, timestamp, messages }) => dispatch => {
  dispatch(addMessages(messages))

  if (timestamp === null) {
    const newestMessage = _.first(messages)

    dispatch(
      subscribeToMessages(
        channelName,
        newestMessage ? newestMessage.timestamp : new Date()
      )
    )
  }
}

const messageChange = change => dispatch => {
  dispatch(createAction('MESSAGE_CHANGE')(change))

  const messageNew = change.new_val
  dispatch(addMessage(messageNew))
}

const TYPE_TO_ACTION = {
  CHANNEL_CHANGE: channelChange,

  LOADED_MESSAGES: loadedMessages,
  MESSAGE_CHANGE: messageChange,
}

const subscribeToSocket = () => dispatch => {
  dispatch(createAction('SUBSCRIBE_TO_SOCKET')())

  socket.on('action', action => {
    const { type, payload = null } = action
    dispatch(TYPE_TO_ACTION[type](payload))
  })
}

export {
  navigate,
  subscribeToSocket,
  subscribeToChannels,
  loadChannel,
}
