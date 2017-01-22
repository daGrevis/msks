import { combineEpics } from 'redux-observable'

import { navigate } from './history'
import {
  updateChannel, setChannelName,
  subscribeToMessages, loadMessagesFromServer,
  addMessages, addMessage,
  updateUnread, resetUnread, setFavicoBadge,
} from './actions'
import {
  getLastMessageTimestampSelector, isEmbedSelector, channelNameSelector,
} from './selectors'

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

const updateUnreadEpic = (action$, store) =>
  action$.ofType('client/MESSAGE_CHANGE')
    .filter(({ payload }) => {
      const state = store.getState()
      const message = payload.new_val
      return !state.isVisible && message.to === channelNameSelector(state)
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
    .map(({ payload: channelName }) => {
      navigate(`/${channelName || ''}`)
      return setChannelName(channelName)
    })

const titleEpic = action$ =>
  action$.ofType('SET_CHANNEL_NAME')
    .map(({ payload: channelName }) => {
      document.title = channelName ? `${channelName} · msks` : 'msks'
      return { type: 'SET_DOCUMENT_TITLE' }
    })

const rootEpic = combineEpics(
  channelChangeEpic,
  loadMessagesEpic,
  addMessagesEpic,
  subscribeToMessagesEpic,
  messageChangeEpic,
  updateUnreadEpic,
  setFavicoBadgeEpic,
  resetUnreadEpic,
  openChannelEpic,
  titleEpic
)

export {
  rootEpic,
}
