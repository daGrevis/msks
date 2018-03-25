import fp from 'lodash/fp'
import { handleActions, concat } from 'redux-fp'

import config from './config'
import { searchQuerySelector } from './selectors'

const appUpdater = handleActions({
  SET_BROKEN: () => fp.set('isBroken', true),
  SET_VISIBILITY: ({ payload }) => fp.set('isVisible', payload),

  SAVE_LAST_SCROLL_POSITION: ({ payload: { id, position } }) => fp.set(
    ['scrollPositions', id],
    position
  ),
})

const historyUpdater = handleActions({
  NAVIGATED: ({ payload }) => fp.set('route', payload)
})

const socketUpdater = handleActions({
  SOCKET_CONNECTED: () => fp.set('isSocketConnected', true),

  SOCKET_DISCONNECTED: () => fp.pipe(
    fp.set('isSocketConnected', false),
    fp.update('isSubscribedToChannels', fp.mapValues(() => false)),
    fp.update('isSubscribedToUsers', fp.mapValues(() => false)),
    fp.update('isSubscribedToMessages', fp.mapValues(() => false)),
    fp.update('isViewingArchive', fp.mapValues(() => true)),
  ),

  SOCKET_RECONNECTED: () => state => fp.pipe(
    fp.set('isSocketReconnected', true),
    fp.set('resetChannels', true),
    fp.set('resetUsers', fp.mapValues(() => true, state.users)),
  )(state),
})

const channelUpdater = handleActions({
  NAVIGATED: ({ payload }) => fp.set('channelName', (
    config.embedChannel
    ? config.embedChannel
    : payload.params.channelName || null
  )),

  'client/CHANNEL_CHANGES': ({ payload: { changes }}) => state => fp.pipe(
    fp.update('channels', prevChannels => {
      prevChannels = state.resetChannels ? {} : prevChannels

      const nextChannels = fp.reduce((channels, { new_val, old_val }) => (
        new_val
        ? fp.set(new_val.name, new_val, channels)
        : fp.unset(old_val.name, channels)
      ), prevChannels, changes)

      return nextChannels
    }),
    fp.set('resetChannels', false)
  )(state),
})

const usersUpdater = handleActions({
  'server/SUBSCRIBE_TO_USERS': ({ payload }) => fp.set(
    ['isSubscribedToUsers', payload.channelName],
    true
  ),

  'client/USER_CHANGES': ({ payload: { channelName, changes }}) => state => fp.pipe(
    fp.update(['users', channelName], prevUsers => {
      prevUsers = state.resetUsers[channelName] ? {} : prevUsers

      const nextUsers = fp.reduce((users, { new_val, old_val }) => (
        new_val
        ? fp.set([new_val.nick], new_val, users)
        : fp.unset([old_val.nick], users)
      ), prevUsers, changes)

      return nextUsers
    }),
    fp.set(['resetUsers', channelName], false)
  )(state),
})

const messagesUpdater = handleActions({
  SET_MESSAGES: ({ payload }) => fp.pipe(
    fp.set(['messages', payload.channel], payload.messages),
    fp.set(['isViewingArchive', payload.channel], false)
  ),

  SET_MESSAGES_BEFORE: ({ payload }) => fp.pipe(
    fp.update(
      ['messages', payload.channel],
      currentMessages => fp.concat(payload.messages, currentMessages)
    ),
    fp.set(
      ['hasReachedBeginning', payload.channel],
      payload.messages.length === 0,
    )
  ),

  SET_MESSAGES_AFTER: ({ payload }) => fp.pipe(
    fp.update(
      ['messages', payload.channel],
      currentMessages => {
        // For some reason, on rare occasions, SET_MESSAGES_AFTER action is dispatched twice when reconnecting.
        // It should not happen and I can't reproduce it. Nevertheless, it happens.
        // Quick-fix below should prevent duplicate messages.
        const firstMessage = payload.messages.length ? payload.messages[0] : null
        if (firstMessage && fp.find({ id: firstMessage.id }, currentMessages)) {
          console.log('SET_MESSAGES_AFTER with duplicate messages')
          return currentMessages
        }

        return fp.concat(currentMessages, payload.messages)
      },
    ),
    fp.set(
      ['isViewingArchive', payload.channel],
      payload.messages.length !== 0
    )
  ),

  GET_MESSAGES_AROUND: () => state => fp.pipe(
    fp.set(['messages', state.channelName], []),
    fp.unset(['scrollPositions', `messages.${state.channelName}`])
  )(state),
  SET_MESSAGES_AROUND: ({ payload }) => fp.pipe(
    fp.set(['messages', payload.channel], payload.messages),
    fp.set(['isViewingArchive', payload.channel], true)
  ),

  'server/SUBSCRIBE_TO_MESSAGES': ({ payload }) => fp.set(
    ['isSubscribedToMessages', payload.channelName],
    true
  ),

  'client/ADD_MESSAGE': ({ payload }) => state => {
    if (state.isViewingArchive[payload.to]) {
      return state
    }

    const prevMessages = state.messages[payload.to]

    if (!prevMessages || !prevMessages.length) {
      return state
    }

    // Message order is not guaranteed.
    const messageDatetime = Date.parse(payload.timestamp)
    const newerMessages = fp.takeRightWhile(
      m => Date.parse(m.timestamp) > messageDatetime,
      prevMessages
    )

    return fp.update(
      ['messages', payload.to],
      messages => (
        !newerMessages.length
        // If there are no newer messages, append it.
        ? fp.concat(messages, payload)
        // If there are newer messages, insert the message in right place.
        : fp.concat(
          messages.slice(0, messages.length - newerMessages.length),
          fp.concat(payload, newerMessages)
        )
      )
    )(state)
  },

  INPUT_SEARCH: ({ payload }) => fp.set(['search', 'hasReachedBeginning'], false),

  FOUND_MESSAGES: ({ payload }) => state => {
    const { messages, channel, query, limit, messageId } = payload

    const isOutdated = (
      channel !== state.channelName
      || !fp.isEqual(query, searchQuerySelector(state))
    )
    if (isOutdated) {
      return state
    }

    return fp.update('search', search => ({
      channelName: channel,
      query,
      messageId,
      hasReachedBeginning: messages.length < limit,
      messages: (
        !messageId
        ? messages
        : fp.concat(messages, search.messages)
      ),
    }))(state)
  },

  LEAVE_ARCHIVE: () => state => fp.pipe(
    fp.set(['messages', state.channelName], []),
    fp.set(['isViewingArchive', state.channelName], false),
    fp.set(['hasReachedBeginning', state.channelName], false),
  )(state),
})

const faviconUpdater = handleActions({
  UPDATE_UNREAD: () => fp.update('unread', count => count + 1),
  RESET_UNREAD: () => fp.set('unread', 0),
})

const rootReducer = (state, action) => concat(
  appUpdater,
  historyUpdater,
  socketUpdater,
  channelUpdater,
  usersUpdater,
  messagesUpdater,
  faviconUpdater,
)(action)(state)

export {
  rootReducer,
}
