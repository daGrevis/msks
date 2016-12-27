import { combineEpics } from 'redux-observable'

import { navigate } from './history'
import {
  updateChannel, setChannelName,
  subscribeToMessages, loadMessagesFromServer,
  addMessages, addMessage,
} from './actions'
import { getLastMessageTimestampSelector, isEmbedSelector } from './selectors'

const channelChangeEpic = action$ =>
  action$.ofType('client/CHANNEL_CHANGE')
    .map(({ payload }) => updateChannel(payload.new_val))

const loadMessagesEpic = action$ =>
  action$.ofType('LOAD_MESSAGES')
    .distinct(({ payload: { channelName, before, after }}) => (
      JSON.stringify([channelName, before, after])
    ))
    .map(({ payload }) => loadMessagesFromServer(payload))

const addMessagesEpic = action$ =>
  action$.ofType('client/LOADED_MESSAGES')
    .map(({ payload }) => addMessages(payload))

const subscribeToMessagesEpic = (action$, store) =>
  action$.ofType('client/LOADED_MESSAGES')
    .filter(({ payload }) => !payload.before)
    .map(({ payload: { channelName } }) => {
      const timestamp = getLastMessageTimestampSelector(channelName)(store.getState())
      return subscribeToMessages({
        channelName,
        timestamp,
      })
    })

const messageChangeEpic = action$ =>
  action$.ofType('client/MESSAGE_CHANGE')
    .map(({ payload }) => addMessage(payload.new_val))

const openChannelEpic = (action$, store) =>
  action$.ofType('OPEN_CHANNEL')
    .filter(() => !isEmbedSelector(store.getState()))
    .map(({ payload: channelName }) => {
      navigate(`/${channelName || ''}`)
      return setChannelName(channelName)
    })

const rootEpic = combineEpics(
  channelChangeEpic,
  loadMessagesEpic,
  addMessagesEpic,
  subscribeToMessagesEpic,
  messageChangeEpic,
  openChannelEpic
)

export {
  rootEpic,
}
