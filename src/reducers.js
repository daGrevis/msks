import fp from 'lodash/fp'
import { createUpdater, pipeUpdaters } from 'redux-fp'

const initialState = {
  channels: {},
  messagesByChannel: {},
  isChannelLoadingInitiated: {},
}

const channelUpdater = createUpdater({
  UPDATE_CHANNEL: ({ payload }) => fp.set(['channels', payload.name], payload),
  LOAD_CHANNEL: ({ payload }) => fp.set(['isChannelLoadingInitiated', payload], true)
})

const messagesUpdater = createUpdater({
  ADD_MESSAGE: ({ payload }) => fp.set(['messagesByChannel', payload.to, payload.id], payload),
})

const reducer = (state, action) => pipeUpdaters(
  channelUpdater,
  messagesUpdater
)(action)(state)

export {
  initialState,
  reducer,
}
