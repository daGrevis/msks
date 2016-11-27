import fp from 'lodash/fp'
import { combineEpics } from 'redux-observable'

import { updateChannel, subscribeToMessages, addMessages, addMessage } from './actions'

const channelChangeEpic = action$ =>
  action$.ofType('client/CHANNEL_CHANGE')
    .map(({ payload }) => updateChannel(payload.new_val))

const loadMessagesEpic = action$ =>
  action$.ofType('client/LOADED_MESSAGES')
    .map(({ payload }) => addMessages(payload))

const subscribeToMessagesEpic = action$ =>
  action$.ofType('client/LOADED_MESSAGES')
    .filter(({ payload }) => payload.timestamp === null)
    .map(({ payload }) => {
      const newestMessage = fp.first(payload.messages)
      return subscribeToMessages({
        channelName: payload.channelName,
        timestamp: newestMessage ? newestMessage.timestamp : new Date(),
      })
    })

const messageChangeEpic = action$ =>
  action$.ofType('client/MESSAGE_CHANGE')
    .map(({ payload }) => addMessage(payload.new_val))

const rootEpic = combineEpics(
  channelChangeEpic,
  loadMessagesEpic,
  subscribeToMessagesEpic,
  messageChangeEpic
)

export {
  rootEpic,
}
