import fp from 'lodash/fp'
import { combineEpics } from 'redux-observable'

import { channelNameSelector } from './selectors'
import {
  socketReconnected, subscribeToChannels, subscribeToUsers, subscribeToMessages,
  updateUnread, resetUnread, setFavicoBadge,
} from './actions'

// Listening for socket.on('reconnect') doesn't work with socket.disconnect() and socket.connect().
const socketReconnectedEpic = (action$, store) =>
  action$.ofType('SOCKET_DISCONNECTED')
    .mergeMap(() =>
      action$.ofType('SOCKET_CONNECTED')
      .take(1)
      .map(() => socketReconnected())
    )

const subscribeToChannelsEpic = action$ =>
  action$.ofType('SOCKET_CONNECTED')
    .map(() => subscribeToChannels())

const subscribeToUsersEpic = action$ =>
  action$.ofType('SOCKET_CONNECTED')
    .map(() => subscribeToUsers())

const subscribeToMessagesEpic = (action$, store) =>
  action$.ofType('client/CHANNEL_CHANGES')
    .map(() => subscribeToMessages())

const updateUnreadEpic = (action$, store) =>
  action$.ofType('client/ADD_MESSAGE')
    .filter(({ payload: message }) => {
      const state = store.getState()

      return (
        !state.isVisible
        && message.to === channelNameSelector(state)
        && !fp.includes(message.kind, ['join', 'quit', 'part', 'nick'])
      )
    })
    .map(() => updateUnread())

const resetUnreadEpic = action$ =>
  action$.ofType('SET_VISIBILITY')
    .filter(({ payload: isVisible }) => isVisible)
    .map(() => resetUnread())

const setFavicoBadgeEpic = action$ =>
  action$.ofType('UPDATE_UNREAD', 'RESET_UNREAD')
    .map(() => setFavicoBadge())

const rootEpic = combineEpics(
  socketReconnectedEpic,
  subscribeToChannelsEpic,
  subscribeToUsersEpic,
  subscribeToMessagesEpic,
  updateUnreadEpic,
  setFavicoBadgeEpic,
  resetUnreadEpic,
)

export {
  rootEpic,
}
