import fp from 'lodash/fp'
import { createUpdater, pipeUpdaters } from 'redux-fp'

import { mo } from './utils'

const appUpdater = createUpdater({
  INIT_APP: ({ payload: channelName }) => fp.pipe(
    fp.set('isEmbed', !!channelName),
    fp.set('channelName', channelName)
  ),
})

const historyUpdater = createUpdater({
  NAVIGATED: ({ payload }) => fp.set('location', payload)
})

const channelUpdater = createUpdater({
  SET_CHANNEL_NAME: ({ payload }) => fp.set('channelName', payload),
  UPDATE_CHANNEL: ({ payload }) => fp.set(['channels', payload.name], payload),
})

const addMessage = m => fp.update(
  ['messages', m.to],
  messages => {
    if (messages === undefined || messages.length === 0) {
      return [m]
    }

    const t = mo(m.timestamp)
    if (t >= mo(fp.last(messages)['timestamp'])) {
      return fp.concat(messages, m)
    }
    if (t < mo(fp.first(messages)['timestamp'])) {
      return fp.concat(m, messages)
    }

    return fp.sortBy('timestamp')(fp.concat(messages, m))
  }
)

const addMessages = newMessages => fp.update(
  ['messages', fp.first(newMessages).to],
  messages => {
    if (messages === undefined || messages.length === 0) {
      return newMessages
    }

    const messageIds = fp.map('id', messages)
    newMessages = fp.reject(m => fp.includes(m.id, messageIds))(newMessages)

    if (newMessages.length === 0) {
      return messages
    }

    if (
      mo(fp.last(newMessages)['timestamp'])
      <= mo(fp.first(messages)['timestamp'])
    ) {
      return fp.concat(newMessages, messages)
    }

    if (
      mo(fp.first(newMessages)['timestamp'])
      >= mo(fp.last(messages)['timestamp'])
    ) {
      return fp.concat(messages, newMessages)
    }

    return fp.sortBy('timestamp')(fp.concat(messages, newMessages))
  }
)

const messagesUpdater = createUpdater({
  'server/SUBSCRIBE_TO_MESSAGES': ({ payload }) => fp.set(['isSubscribedToMessages', payload.channelName], true),
  'UNSUBSCRIBE_FROM_ALL_MESSAGES': () => fp.set('isSubscribedToMessages', {}),

  ADD_MESSAGE: ({ payload }) => addMessage(payload),
  ADD_MESSAGES: ({ payload: { channelName, messages }}) => state => fp.pipe(
    addMessages(messages),
    fp.set(['hasReachedBeginning', channelName], messages.length === 1 || messages.length < 100)
  )(state),
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
  notificationUpdater,
)(action)(state)

export {
  rootReducer,
}
