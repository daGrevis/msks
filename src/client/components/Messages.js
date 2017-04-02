import _ from 'lodash'
import React from 'react'

import { mo } from '../utils'
import Loader from '../components/Loader'
import Message from '../components/Message'

const DayHeader = ({ text, isoTimestamp }) => {
  return (
    <div className='day-header'>
      <span className='text strong' title={isoTimestamp}>
        {text}
      </span>
      <div className='divider' />
    </div>
  )
}

const Messages = ({ messages, hasReachedBeginning, isSubscribedToMessages }) => {
  const now = mo()
  const messageLength = messages.length

  let currentDay, dayText

  return (
    <div className='messages'>
      {messageLength === 0 ? <Loader /> : null}

      {_.map(messages, (message, i) => {
        const previousMessage = i > 0 ? messages[i - 1] : null

        const timestamp = mo(message.timestamp)
        const previousTimestamp = previousMessage ? mo(previousMessage.timestamp) : null

        const isNewDay = (
          !previousMessage
          ? true
          : previousTimestamp.date() !== timestamp.date()
        )

        if (isNewDay) {
          currentDay = timestamp.startOf('day')

          if (currentDay.isSame(now, 'day')) {
            dayText = 'Today'
          } else if (currentDay.isSame(now.subtract(1, 'd'), 'day')) {
            dayText = 'Yesterday'
          } else {
            dayText = currentDay.format('dddd, MMMM Do')
          }
        }

        const isFirst = (
          isNewDay
          || message.kind !== 'message'
          || previousMessage.kind !== 'message'
          || (
            previousMessage.from !== message.from
            || (timestamp - previousTimestamp) >= 60000
          )
        )

        const isLoadingTop = (
          i === 0
          && !hasReachedBeginning
        )

        const isLoadingBottom = (
          messageLength && (messageLength - 1 === i)
          && !isSubscribedToMessages
        )

        return (
          <div key={message.id}>
            {isLoadingTop ? <Loader /> : null}

            {!isLoadingTop && isNewDay ? <DayHeader text={dayText} isoTimestamp={currentDay && currentDay.format()} /> : null}

            <Message
              message={message}
              isFirst={isFirst}
              isoTimestamp={timestamp.format()}
              timestampText={timestamp.format('HH:mm')}
            />

            {isLoadingBottom ? <Loader /> : null}
          </div>
        )
      })}
    </div>
  )
}

export default Messages
