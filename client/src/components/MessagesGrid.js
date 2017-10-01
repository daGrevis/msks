import _ from 'lodash'
import format from 'date-fns/format'
import React from 'react'
import { connect } from 'react-redux'

import { isSameDay, isSameYear, getDaysBetween, getStartOfDay } from '../utils'
import {
  hasReachedBeginningSelector, searchHighlightsSelector,
  isSearchOpenSelector, isSearchOutdatedSelector, isSearchIntroSelector, isSearchNotFoundSelector,
} from '../selectors'
import Loader from '../components/Loader'
import Message from '../components/Message'

const DayHeader = ({ text, date }) => {
  return (
    <div className='day-header'>
      <span
        className='text strong'
        title={date && format(date, 'YYYY-MM-DDTHH:mm:ssZ')}
      >
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

  const now = new Date()

  const isTopLoading = (
    isSearchOpen
    ? !messages.length || !hasReachedBeginning || isSearchOutdated
    : !messages.length || !hasReachedBeginning
  )
  const isBottomLoading = (
    isSearchOpen
    ? false
    : !isSubscribedToMessages || isViewingArchive
  )

  let startOfDay, dayText

  return (
    <div className='messages'>
      {isTopLoading ? <Loader /> : null}

      {_.map(messages, (message, i) => {
        const prevMessage = i > 0 ? messages[i - 1] : null

        const messageDate = new Date(message.timestamp)
        const prevMessageDate = prevMessage ? new Date(prevMessage.timestamp) : null

        const isNewDay = (
          !prevMessage
          ? true
          : !isSameDay(prevMessageDate, messageDate)
        )

        if (isNewDay) {
          startOfDay = getStartOfDay(messageDate)

          const daysBetween = getDaysBetween(now, startOfDay)

          if (daysBetween === 0) {
            dayText = 'Today'
          } else if (daysBetween === 1) {
            dayText = 'Yesterday'
          } else {
            dayText = format(
              startOfDay,
              'dddd, MMMM Do' + (isSameYear(now, startOfDay) ? '' : ' (YYYY)')
            )
            if (daysBetween <= 7) {
              dayText = 'Last ' + dayText
            }
          }
        }

        const isFirst = (
          isNewDay
          || message.kind !== 'message'
          || prevMessage.kind !== 'message'
          || (
            prevMessage.from !== message.from
            || (messageDate - prevMessageDate) >= 60000
          )
        )

        const isActive = activeMessage && message.id === activeMessage.id

        return (
          <div key={message.id}>
            {isNewDay && (hasReachedBeginning || prevMessage)
                ? <DayHeader text={dayText} date={startOfDay} />
                : null}

            <Message
              message={message}
              date={messageDate}
              isFirst={isFirst}
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
