import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { mo } from '../utils'
import {
  hasReachedBeginningSelector, searchHighlightsSelector,
  isSearchOpenSelector, isSearchOutdatedSelector, isSearchIntroSelector, isSearchNotFoundSelector,
} from '../selectors'
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

const MessagesGrid = props => {
  const {
    messages, activeMessage, isViewingArchive, hasReachedBeginning, isSubscribedToMessages,
    searchHighlights, isSearchOpen, isSearchOutdated, isSearchIntro, isSearchNotFound,
  } = props

  if (isSearchIntro || isSearchNotFound) {
    return null
  }

  const now = mo()
  const messageLength = messages.length

  let currentDay, dayText

  const isTopLoading = (
    isSearchOpen
    ? !messageLength || !hasReachedBeginning || isSearchOutdated
    : !messageLength || !hasReachedBeginning
  )
  const isBottomLoading = (
    isSearchOpen
    ? false
    : !isSubscribedToMessages || isViewingArchive
  )

  return (
    <div className='messages'>
      {isTopLoading ? <Loader /> : null}

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
            dayText = currentDay.format(
              'dddd, MMMM Do' + (currentDay.isSame(now, 'year') ? '' : ' (YYYY)')
            )
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

        const isActive = activeMessage && message.id === activeMessage.id

        return (
          <div key={message.id}>
            {isNewDay && (hasReachedBeginning || previousMessage)
                ? <DayHeader text={dayText} isoTimestamp={currentDay && currentDay.format()} />
                : null}

            <Message
              message={message}
              isFirst={isFirst}
              isoTimestamp={timestamp.format()}
              timestampText={timestamp.format('HH:mm')}
              isActive={isActive}
              highlights={searchHighlights}
            />
          </div>
        )
      })}

      {isBottomLoading ? <Loader /> : null}
    </div>
  )
}

const mapStateToProps = (state, props) => ({
  messages: props.messages,
  activeMessage: props.activeMessage,
  isViewingArchive: state.isViewingArchive[state.channelName],
  hasReachedBeginning: hasReachedBeginningSelector(state),
  isSubscribedToMessages: state.isSubscribedToMessages[state.channelName],
  searchHighlights: searchHighlightsSelector(state),
  isSearchOpen: isSearchOpenSelector(state),
  isSearchOutdated: isSearchOutdatedSelector(state),
  isSearchIntro: isSearchIntroSelector(state),
  isSearchNotFound: isSearchNotFoundSelector(state),
})

export default connect(mapStateToProps)(MessagesGrid)
