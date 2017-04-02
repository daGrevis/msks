import fp from 'lodash/fp'
import { createUpdater, pipeUpdaters } from 'redux-fp'

import { mo } from './utils'

const appUpdater = createUpdater({
  INIT_APP: ({ payload: channelName }) => fp.pipe(
    fp.set('isEmbed', !!channelName),
    fp.set('channelName', channelName)
  ),

  SET_VISIBILITY: ({ payload }) => fp.set('isVisible', payload),
})

const historyUpdater = createUpdater({
  NAVIGATED: ({ payload }) => fp.set('location', payload)
})

const channelUpdater = createUpdater({
  OPEN_CHANNEL: ({ payload }) => fp.set('channelName', payload),
  CLOSE_CHANNEL: () => fp.set('channelName', null),
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

const messagesUpdater = createUpdater({
  'server/SUBSCRIBE_TO_MESSAGES': ({ payload }) => fp.set(['isSubscribedToMessages', payload.channelName], true),
  UNSUBSCRIBE_FROM_ALL_MESSAGES: () => fp.set('isSubscribedToMessages', {}),

  ADD_MESSAGE: ({ payload }) => addMessage(payload),
  ADD_MESSAGES: ({ payload: { channelName, messages }}) => state => fp.pipe(
    addMessages(messages),
    fp.set(['hasReachedBeginning', channelName], !messages.length)
  )(state),
})

const usersUpdater = createUpdater({
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

const faviconUpdater = createUpdater({
  UPDATE_UNREAD: () => fp.update('unread', count => count + 1),
  RESET_UNREAD: () => fp.set('unread', 0),
})

const notificationUpdater = createUpdater({
  ADD_NOTIFICATION: ({ payload }) => fp.update('notifications', notifs => fp.concat(notifs, payload)),
  REMOVE_NOTIFICATION: ({ payload }) => fp.update('notifications', fp.reject(({ key }) => key === payload)),
})

const rootReducer = (state, action) => pipeUpdaters(
  appUpdater,
  historyUpdater,
  channelUpdater,
  messagesUpdater,
  usersUpdater,
  faviconUpdater,
  notificationUpdater
)(action)(state)

export {
  rootReducer,
}
