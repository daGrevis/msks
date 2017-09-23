import fp from 'lodash/fp'
import { combineEpics } from 'redux-observable'

import {
  subscribeToChannels, subscribeToUsers, subscribeToMessages, searchMessages,
  updateUnread, resetUnread, setFavicoBadge,
} from './actions'

const subscribeToChannelsEpic = action$ =>
  action$.ofType('SOCKET_CONNECTED')
    .map(() => subscribeToChannels())

const subscribeToUsersEpic = action$ =>
  action$.ofType('SOCKET_CONNECTED')
    .map(() => subscribeToUsers())

const subscribeToMessagesEpic = (action$, store) =>
  action$.ofType('client/UPDATE_CHANNEL')
    .map(({ payload }) => subscribeToMessages({ channelName: payload.name }))

const searchEpic = (action$, store) =>
  action$.ofType('INPUT_SEARCH')
    .debounceTime(1000)
    .map(({ payload }) => searchMessages({ query: payload }))

const updateUnreadEpic = (action$, store) =>
  action$.ofType('client/ADD_MESSAGE')
    .filter(({ payload: message }) => {
      const state = store.getState()
      return (
        !state.isVisible
        && message.to === state.channelName
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
  subscribeToChannelsEpic,
  subscribeToUsersEpic,
  subscribeToMessagesEpic,
  searchEpic,
  updateUnreadEpic,
  setFavicoBadgeEpic,
  resetUnreadEpic,
)

export {
  rootEpic,
}
