import _ from 'lodash'
import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import { mo } from './utils'

const location = state => state.location

const channels = state => state.channels

const channelName = createSelector(
  [location, channels],
  (location, channels) => location.hash || null
)

const messagesByChannel = state => state.messagesByChannel

const hasReachedChannelBeginning = state => state.hasReachedChannelBeginning

const selectedChannel = createSelector(
  [channels, channelName],
  (channels, channelName) => channels[channelName]
)

const openedChannels = createSelector(
  [channels, messagesByChannel],
  (channels, messagesByChannel) => fp.pipe(
    fp.map(k => channels[k]),
    fp.keyBy('name')
  )(fp.keys(messagesByChannel))
)

const isChannelLoading = createSelector(
  [selectedChannel],
  (selectedChannel) => (
    !selectedChannel
  )
)

const isAppLoading = createSelector(
  [channels, channelName, isChannelLoading],
  (channels, channelName, isChannelLoading) => (
    channelName ? isChannelLoading : fp.isEmpty(channels)
  )
)

const sortedChannels = createSelector(
  [channels],
  fp.sortBy('name')
)

const channelMessages = channelName => createSelector(
  [messagesByChannel],
  messagesByChannel => fp.sortBy('timestamp', messagesByChannel[channelName])
)

const messageRows = channelName => createSelector(
  [channelMessages(channelName), hasReachedChannelBeginning],
  (messages, hasReachedChannelBeginning) => {
    // TODO: Can this be expressed in a more declarative way without performance penalty?
    const hasReachedBeginning = hasReachedChannelBeginning[channelName]

    let rows = []

    if (hasReachedBeginning && messages.length === 0) {
      return rows
    }

    if (!hasReachedBeginning) {
      rows.push({
        type: 'loader',
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

    return rows
  },
)

const mostRecentChannelMessage = channelName => createSelector(
  [channelMessages(channelName)],
  fp.last
)

const mostRecentChannelTimestamp = channelName => createSelector(
  [mostRecentChannelMessage(channelName)],
  m => m ? m.timestamp : new Date()
)

export {
  channelName,
  selectedChannel,
  openedChannels,
  isAppLoading,
  isChannelLoading,
  sortedChannels,
  channelMessages,
  messageRows,
  mostRecentChannelMessage,
  mostRecentChannelTimestamp,
}
