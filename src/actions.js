import { createAction } from 'redux-actions'
import moment from 'moment'

import socket from './websocket-client'

const addMessage = createAction('ADD_MESSAGE')

const subscribeToMessages = channelName => dispatch => {
  dispatch(createAction('SUBSCRIBE_TO_MESSAGES'))

  socket.on('messages', change => {
    const messageNew = change.new_val
    dispatch(addMessage(messageNew))
  })
}

const loadChannel = channelName => dispatch => {
  dispatch(createAction('LOAD_CHANNEL')(channelName))

  dispatch(subscribeToMessages(channelName))
}

const loadMessages = (channelName, day) => dispatch => {
  dispatch(createAction('LOAD_MESSAGES'))
}

export {
  loadChannel,
  loadMessages,
}
