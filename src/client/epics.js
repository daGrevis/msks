import fp from 'lodash/fp'
import { combineEpics } from 'redux-observable'

import { navigate } from './history'
import {
  noop, subscribeToMessages, addMessages, addMessage,
  subscribeToUsers, updateUnread, resetUnread, setFavicoBadge,
} from './actions'
import {
  getLastMessageSelector, isEmbedSelector, channelNameSelector,
} from './selectors'

const addMessagesEpic = action$ =>
  action$.ofType('client/LOADED_MESSAGES')
    .map(({ payload }) => addMessages(payload))

const subscribeToMessagesEpic = (action$, store) =>
  action$.ofType('client/LOADED_MESSAGES')
    .filter(({ payload }) => !payload.before)
    .map(({ payload: { channelName } }) => {
      const lastMessage = getLastMessageSelector(channelName)(store.getState())
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

const openChannelEpic = (action$, store) =>
  action$.ofType('OPEN_CHANNEL')
    .filter(() => !isEmbedSelector(store.getState()))
    .do(({ payload: channelName }) => {
      navigate(channelName)
    })
    .map(noop)

const closeChannelEpic = (action$, store) =>
  action$.ofType('CLOSE_CHANNEL')
    .filter(() => !isEmbedSelector(store.getState()))
    .do(({ payload: channelName }) => {
      navigate('')
    })
    .map(noop)

const titleEpic = (action$, store) =>
  action$.ofType('OPEN_CHANNEL', 'CLOSE_CHANNEL')
    .do(() => {
      const channelName = channelNameSelector(store.getState())
      document.title = channelName ? `${channelName} · msks` : 'msks'
    })
    .map(noop)

const subscribeToUsersEpic = action$ =>
  action$.ofType('OPEN_CHANNEL')
    .distinct(({ payload: channelName }) => (
      channelName
    ))
    .map(({ payload: channelName }) => (
      subscribeToUsers({ channelName })
    ))

const rootEpic = combineEpics(
  addMessagesEpic,
  subscribeToMessagesEpic,
  messageChangeEpic,
  subscribeToUsersEpic,
  updateUnreadEpic,
  setFavicoBadgeEpic,
  resetUnreadEpic,
  openChannelEpic,
  closeChannelEpic,
  titleEpic
)

export {
  rootEpic,
}
