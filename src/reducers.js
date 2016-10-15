import fp from 'lodash/fp'
import { createUpdater, pipeUpdaters } from 'redux-fp'

const initialState = {
  messages: {},
}

const messagesUpdater = createUpdater({
  LOAD_MESSAGES: ({ payload }) => fp.set('isMessagesLoaded', true),
  ADD_MESSAGE: ({ payload }) => fp.set(['messages', payload.id], payload),
})

const reducer = (state, action) => pipeUpdaters(
  messagesUpdater
)(action)(state)

export {
  initialState,
  reducer,
}
