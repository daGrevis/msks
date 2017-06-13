import fp from 'lodash/fp'
import { handleActions, concat } from 'redux-fp'

import { mo } from './utils'

const appUpdater = handleActions({
  SET_EMBED: () => fp.set('isEmbed', true),
  SET_BROKEN: () => fp.set('isBroken', true),
  SET_VISIBILITY: ({ payload }) => fp.set('isVisible', payload),
})

const historyUpdater = handleActions({
  NAVIGATED: ({ payload }) => fp.set('location', payload)
})

const socketUpdater = handleActions({
  SOCKET_DISCONNECTED: () => fp.pipe(
    fp.set('isSubscribedToUsers', {}),
    fp.set('isSubscribedToMessages', {}),
    fp.set('loadCache', {})
  )
})

const channelUpdater = handleActions({
  SET_CHANNEL_NAME: ({ payload }) => fp.set('channelName', payload),

  'client/INITIAL_CHANNELS': ({ payload: { channels }}) => fp.set(
    'channels',
    fp.keyBy('name', channels)
  ),
  'client/CHANNEL_CHANGE': ({ payload: { new_val, old_val } }) => (
    new_val
    ? fp.set(['channels', new_val.name], new_val)
    : fp.unset(['channels', old_val.name])
  ),

  'SET_SCROLL_POSITION': ({ payload: { channelName, position } }) => fp.set(
    ['scrollPositions', channelName],
    position
  ),
})

const addMessage = m => fp.update(
  ['messages', m.to],
  messages => {
    if (!messages || !messages.length) {
      return [m]
    }

    if (mo(m.timestamp) >= mo(fp.last(messages)['timestamp'])) {
      return fp.concat(messages, m)
    }

    return fp.concat(m, messages)
  }
)

const addMessages = newMessages => state => {
  if (!newMessages.length) {
    return state
  }

  const firstMessage = fp.first(newMessages)
  return fp.update(['messages', firstMessage.to], messages => {
    if (!messages || !messages.length) {
      return newMessages
    }

    if (mo(firstMessage.timestamp) >= mo(fp.last(messages)['timestamp'])) {
      return fp.concat(messages, newMessages)
    }

    return fp.concat(newMessages, messages)
  }, state)
}

const messagesUpdater = handleActions({
  'server/SUBSCRIBE_TO_MESSAGES': ({ payload }) => fp.set(['isSubscribedToMessages', payload.channelName], true),

  'server/LOAD_MESSAGES': ({ payload }) => (
    payload.messageId
    ? fp.set(['loadCache', payload.messageId], true)
    : fp.identity
  ),

  ADD_MESSAGE: ({ payload }) => addMessage(payload),
  ADD_MESSAGES: ({ payload: { channelName, messages }}) => (
    addMessages(messages)
  ),

  'client/LOADED_MESSAGES': ({ payload: { channelName, messages, before } }) => fp.set(
    ['hasReachedBeginning', channelName],
    before && !messages.length
  ),
})

const usersUpdater = handleActions({
  'server/SUBSCRIBE_TO_USERS': ({ payload }) => fp.set(['isSubscribedToUsers', payload.channelName], true),

  'client/INITIAL_USERS': ({ payload: { channelName, users }}) => fp.set(
    ['users', channelName],
    fp.keyBy('nick', users)
  ),
  'client/USER_CHANGE': ({ payload: { new_val, old_val }}) => (
    new_val
    ? fp.set(['users', new_val.channel, new_val.nick], new_val)
    : fp.unset(['users', old_val.channel, old_val.nick])
  ),
})

const faviconUpdater = handleActions({
  UPDATE_UNREAD: () => fp.update('unread', count => count + 1),
  RESET_UNREAD: () => fp.set('unread', 0),
})

const notificationUpdater = handleActions({
  ADD_NOTIFICATION: ({ payload }) => fp.update('notifications', notifs => fp.concat(notifs, payload)),
  REMOVE_NOTIFICATION: ({ payload }) => fp.update('notifications', fp.reject(({ key }) => key === payload)),
})

const rootReducer = (state, action) => concat(
  appUpdater,
  historyUpdater,
  socketUpdater,
  channelUpdater,
  messagesUpdater,
  usersUpdater,
  faviconUpdater,
  notificationUpdater
)(action)(state)

export {
  rootReducer,
}
