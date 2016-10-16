import fp from 'lodash/fp'
import { createUpdater, pipeUpdaters } from 'redux-fp'

const initialState = {
  channelName: null,
  messages: {},
}

const channelUpdater = createUpdater({
  LOAD_CHANNEL: ({ payload }) => fp.set('channelName', payload)
})

const messagesUpdater = createUpdater({
  ADD_MESSAGE: ({ payload }) => fp.set(['messages', payload.id], payload),
})

const reducer = (state, action) => pipeUpdaters(
  channelUpdater,
  messagesUpdater
)(action)(state)

export {
  initialState,
  reducer,
}
