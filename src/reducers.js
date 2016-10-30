import fp from 'lodash/fp'
import { createUpdater, pipeUpdaters } from 'redux-fp'

const initialState = {
  channels: {},

  loadMessagesCache: [],
  messagesByChannel: {},
}

const channelUpdater = createUpdater({
  UPDATE_CHANNEL: ({ payload }) => fp.set(['channels', payload.name], payload),
})

const addMessage = message => fp.set(['messagesByChannel', message.to, message.id], message)

const messagesUpdater = createUpdater({
  LOAD_MESSAGES: ({ payload }) => fp.update('loadMessagesCache', cache => fp.concat(cache, [payload])),
  ADD_MESSAGE: ({ payload }) => addMessage(payload),
  ADD_MESSAGES: ({ payload }) => state => fp.reduce((state, message) => (
    addMessage(message)(state)
  ), state, payload),
})

const reducer = (state, action) => pipeUpdaters(
  channelUpdater,
  messagesUpdater
)(action)(state)

export {
  initialState,
  reducer,
}
