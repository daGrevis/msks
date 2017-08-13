import fp from 'lodash/fp'
import { Observable } from 'rxjs'
import { combineEpics } from 'redux-observable'

import {
  noop, subscribeToChannels, addMessages, addMessage, subscribeToMessages,
  updateUnread, resetUnread, setFavicoBadge, search,
} from './actions'
import { channelNameSelector, allMessagesSelector } from './selectors'

const subscribeToChannelsEpic = action$ =>
  action$.ofType('SOCKET_CONNECTED')
    .map(() => subscribeToChannels())

const addMessagesEpic = action$ =>
  action$.ofType('client/LOADED_MESSAGES')
    .filter(({ payload }) => payload.messages.length)
    .map(({ payload }) => addMessages(payload))

const messageChangeEpic = (action$, store) =>
  action$.ofType('client/MESSAGE_CHANGE')
    .filter(({ payload: { new_val: message }}) => {
      return store.getState().isSubscribedToMessages[message.to]
    })
    .map(({ payload }) => addMessage(payload.new_val))

const subscribeToMessagesEpic = (action$, store) =>
  action$.ofType('SOCKET_CONNECTED')
    .flatMap(action => {
      const state = store.getState()

      const channelNames = fp.keys(state.isSubscribedToMessages)
      const allMessages = allMessagesSelector(state)

      const actions = fp.map(channelName => {
        const lastMessage = fp.last(allMessages[channelName])

        if (!lastMessage) {
          return noop()
        }

        return subscribeToMessages({
          channelName,
          timestamp: lastMessage.timestamp,
          messageId: lastMessage.id,
        })
      }, channelNames)

      return Observable.concat(...fp.map(Observable.of, actions))
    })

const subscribeToLoadedMessagesEpic = (action$, store) =>
  action$.ofType('client/LOADED_MESSAGES')
    .filter(({ payload: { messages, before }}) =>
      !messages.length
      && !before
    )
    .map(({ payload: { channelName }}) => {
      const state = store.getState()

      if (state.isSubscribedToMessages[channelName]) {
        return noop()
      }

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
    .map(() => updateUnread())

const resetUnreadEpic = action$ =>
  action$.ofType('SET_VISIBILITY')
    .filter(({ payload: isVisible }) => isVisible)
    .map(() => resetUnread())

const setFavicoBadgeEpic = action$ =>
  action$.ofType('UPDATE_UNREAD', 'RESET_UNREAD')
    .map(() => setFavicoBadge())

const searchEpic = (action$, store) =>
  action$.ofType('INPUT_SEARCH')
    .debounceTime(1000)
    .map(({ payload }) => search({ query: payload }))

const rootEpic = combineEpics(
  subscribeToChannelsEpic,
  addMessagesEpic,
  subscribeToMessagesEpic,
  subscribeToLoadedMessagesEpic,
  messageChangeEpic,
  updateUnreadEpic,
  setFavicoBadgeEpic,
  resetUnreadEpic,
  searchEpic
)

export {
  rootEpic,
}
