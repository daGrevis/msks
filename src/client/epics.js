import fp from 'lodash/fp'
import { combineEpics } from 'redux-observable'

import {
  noop, subscribeToMessages, addMessages, addMessage,
  updateUnread, resetUnread, setFavicoBadge,
} from './actions'
import { allMessagesSelector, channelNameSelector } from './selectors'

const addMessagesEpic = action$ =>
  action$.ofType('client/LOADED_MESSAGES')
    .map(({ payload }) => addMessages(payload))

const subscribeToMessagesEpic = (action$, store) =>
  action$.ofType('client/LOADED_MESSAGES')
    .filter(({ payload }) => !payload.before)
    .map(({ payload: { channelName } }) => {
      const state = store.getState()
      const lastMessage = fp.last(allMessagesSelector(state)[channelName])
      if (!lastMessage) {
        return noop()
      }
      return subscribeToMessages({
        channelName,
        timestamp: lastMessage.timestamp,
        messageId: lastMessage.id,
      })
    })

const messageChangeEpic = action$ =>
  action$.ofType('client/MESSAGE_CHANGE')
    .map(({ payload }) => addMessage(payload.new_val))

const updateUnreadEpic = (action$, store) =>
  action$.ofType('client/MESSAGE_CHANGE')
    .filter(({ payload }) => {
      const state = store.getState()
      const message = payload.new_val
      return (
        !state.isVisible
        && message.to === channelNameSelector(state)
        && !fp.includes(message.kind, ['join', 'quit', 'part', 'nick'])
      )
    })
    .map(updateUnread)

const resetUnreadEpic = action$ =>
  action$.ofType('SET_VISIBILITY')
    .filter(({ payload: isVisible }) => isVisible)
    .map(resetUnread)

const setFavicoBadgeEpic = action$ =>
  action$.ofType('UPDATE_UNREAD', 'RESET_UNREAD')
    .map(setFavicoBadge)

const rootEpic = combineEpics(
  addMessagesEpic,
  subscribeToMessagesEpic,
  messageChangeEpic,
  updateUnreadEpic,
  setFavicoBadgeEpic,
  resetUnreadEpic
)

export {
  rootEpic,
}
