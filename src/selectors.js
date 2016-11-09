import _ from 'lodash'
import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import { stripURI, mo } from './utils'

const router = state => state.router

const channels = state => state.channels

const channelName = createSelector(
  [router, channels],
  (router, channels) => {
    // Can't store '#' in URI like in '/#vim' so we escape to '/vim' and later try to find match.
    const channel = fp.find(channel => (
      router.params.channel === stripURI(channel.name)
    ))(channels)
    return channel ? channel.name : null
  }
)

const messagesByChannel = state => state.messagesByChannel

const selectedChannel = createSelector(
  [channels, channelName],
  (channels, channelName) => channels[channelName]
)

const isAppLoading = () => false

const isChannelLoading = createSelector(
  [selectedChannel],
  (selectedChannel) => {
    return !selectedChannel
  }
)

const sortedChannels = createSelector(
  [channels],
  fp.sortBy('name')
)

const channelMessages = createSelector(
  [channelName, messagesByChannel],
  (channelName, messagesByChannel) => fp.sortBy('timestamp', messagesByChannel[channelName])
)

const messageRows = createSelector(
  [channelMessages],
  // TODO: Can this be expressed in a more declarative way without the performance penalty?
  messages => {
    if (messages.length === 0) {
      return []
    }

    let now = mo()

    let rows = []

    let currentDate
    _.forEach(messages, (message, i) => {
      let messageTimestamp = mo(message.timestamp)

      let messageDate = messageTimestamp.date()
      let isNewDay = !currentDate || messageDate !== currentDate

      if (isNewDay) {
        currentDate = messageDate

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

export {
  channelName,
  selectedChannel,
  isAppLoading,
  isChannelLoading,
  sortedChannels,
  channelMessages,
  messageRows,
}
