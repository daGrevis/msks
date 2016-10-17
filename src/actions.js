import _ from 'lodash'
import moment from 'moment'
import { createAction } from 'redux-actions'

import socket from './websocket-client'

const addMessage = createAction('ADD_MESSAGE')

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

const loadChannel = channelName => dispatch => {
  dispatch(createAction('LOAD_CHANNEL')(channelName))

  dispatch(loadMessages(channelName))
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
  _.forEach(messages, message => dispatch(addMessage(message)))

  if (timestamp === null) {
    const lastMessage = _.last(messages)

    dispatch(subscribeToMessages(channelName, lastMessage.timestamp))
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
  subscribeToSocket,
  subscribeToChannels,
  loadChannel,
}
