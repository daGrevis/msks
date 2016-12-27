import _ from 'lodash'
import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import { mo } from './utils'

const locationSelector = fp.get('location')

const channelsSelector = fp.get('channels')

const sortedChannelsSelector = createSelector(
  channelsSelector,
  fp.sortBy('name')
)

const openedChannelsSelector = createSelector(
  channelsSelector, fp.get('messages'),
  (channels, messages) => fp.pipe(
    fp.map(channelName => channels[channelName]),
    fp.keyBy('name')
  )(fp.keys(messages))
)

const channelNameSelector = createSelector(
  locationSelector,
  fp.get('hash')
)

const getChannelSelector = (channelName = null) => createSelector(
  channelsSelector, channelNameSelector,
  (channels, name) => channels[channelName || name]
)

const getMessagesSelector = (channelName = null) => createSelector(
  fp.get('messages'), channelNameSelector,
  (messages, name) => (
    messages[channelName || name] || []
  )
)

const getLastMessageTimestampSelector = (channelName = null) => createSelector(
  getMessagesSelector(channelName),
  messages => fp.last(messages).timestamp
)

const isChannelLoadingSelector = createSelector(
  getChannelSelector(),
  channel => !channel
)

const isAppLoadingSelector = createSelector(
  channelsSelector, channelNameSelector, isChannelLoadingSelector,
  (channels, channelName, isChannelLoading) => (
    channelName ? isChannelLoading : fp.isEmpty(channels)
  )
)

const hasReachedBeginningSelector = createSelector(
  fp.get('hasReachedBeginning'), channelNameSelector,
  (hasReachedBeginning, channelName) => (
    hasReachedBeginning[channelName]
  )
)

const isSubscribedToMessagesSelector = createSelector(
  fp.get('isSubscribedToMessages'), channelNameSelector,
  (isSubscribedToMessages, channelName) => (
    isSubscribedToMessages[channelName]
  )
)

const messageRowsSelector = createSelector(
  getMessagesSelector(), hasReachedBeginningSelector, isSubscribedToMessagesSelector,
  (messages, hasReachedBeginning, isSubscribedToMessages) => {
    // TODO: Can this be expressed in a more declarative way without performance penalty?
    let rows = []

    if (hasReachedBeginning && messages.length === 0) {
      return rows
    }

    if (!hasReachedBeginning) {
      rows.push({
        type: 'loader',
        payload: { key: 'has-not-reached-beginning' },
      })
    }

    let now = mo()

    let currentDate
    _.forEach(messages, (message, i) => {
      let messageTimestamp = mo(message.timestamp)

      let messageDate = messageTimestamp.date()
      let isNewDay = !currentDate || messageDate !== currentDate

      if (isNewDay) {
        currentDate = messageDate

        if (i !== 0 || hasReachedBeginning) {
          let currentDay = messageTimestamp.startOf('day')

          let text
          if (currentDay.isSame(now, 'day')) {
            text = 'Today'
          } else if (currentDay.isSame(now.subtract(1, 'd'), 'day')) {
            text = 'Yesterday'
          } else {
            text = currentDay.format('dddd, MMMM Do')
          }

          let isoTimestamp = currentDay.format()

          rows.push({
            type: 'day',
            payload: { text, isoTimestamp },
          })
        }
      }

      let isFirst

      if (isNewDay) {
        isFirst = true
      } else {
        let messageBefore = messages[i - 1]

        isFirst = (
          messageBefore.from !== message.from
          || messageTimestamp - mo(messageBefore.timestamp) >= 60000
        )
      }

      let timestampText = messageTimestamp.format('HH:mm')
      let isoTimestamp = messageTimestamp.format()

      rows.push({
        type: 'message',
        payload: { message, timestampText, isoTimestamp, isFirst },
      })
    })

    if (messages.length && !isSubscribedToMessages) {
      rows.push({
        type: 'loader',
        payload: { key: 'is-not-subscribed-to-messages' },
      })
    }

    return rows
  }
)

export {
  locationSelector,
  channelsSelector,
  sortedChannelsSelector,
  openedChannelsSelector,
  channelNameSelector,
  getChannelSelector,
  getMessagesSelector,
  getLastMessageTimestampSelector,
  isChannelLoadingSelector,
  isAppLoadingSelector,
  hasReachedBeginningSelector,
  messageRowsSelector,
}
