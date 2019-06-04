import _ from 'lodash'
import format from 'date-fns/format'
import React from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import {
  isSameDay,
  isSameYear,
  getDaysBetween,
  getStartOfDay,
} from '../utils/date'
import {
  isViewingArchiveSelector,
  hasReachedBeginningSelector,
} from '../store/selectors/messages'
import {
  searchHighlightsSelector,
  isSearchOpenSelector,
  isSearchIntroSelector,
  isSearchNotFoundSelector,
  isSearchOutdatedSelector,
} from '../store/selectors/search'
import { connectionSelector } from '../store/selectors/connections'
import { channelSelector } from '../store/selectors/channels'
import Loader from './Loader'
import Message from './Message'

import '../styles/MessagesGrid.css'

const DayHeader = ({ text, date }) => (
  <div className="day-header">
    <span
      className="text strong"
      title={date && format(date, 'YYYY-MM-DDTHH:mm:ssZ')}
    >
      {text}
    </span>
    <div className="divider" />
  </div>
)

const MessagesGrid = props => {
  const {
    messages,
    activeMessage,
    isSocketConnected,
    isViewingArchive,
    hasReachedBeginning,
    searchHighlights,
    isSearchOpen,
    isSearchIntro,
    isSearchNotFound,
    isSearchOutdated,
    connection,
    channel,
  } = props

  if (isSearchIntro || isSearchNotFound) {
    return null
  }

  const now = new Date()

  const isTopLoading = !hasReachedBeginning
  const isBottomLoading = !!(
    messages &&
    messages.length &&
    (!isSocketConnected || (isSearchOpen ? isSearchOutdated : isViewingArchive))
  )

  const isTall = !messages

  let startOfDay
  let dayText

  return (
    <div className={classNames('messages-grid', { 'is-tall': isTall })}>
      {isTopLoading && <Loader isTall={isTall} />}

      {_.map(messages, (message, i) => {
        const prevMessage = i > 0 ? messages[i - 1] : null

        const messageDate = new Date(message.createdAt)
        const prevMessageDate = prevMessage
          ? new Date(prevMessage.createdAt)
          : null

        const isNewDay = !prevMessage
          ? true
          : !isSameDay(prevMessageDate, messageDate)

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
              'dddd, MMMM Do' + (isSameYear(now, startOfDay) ? '' : ' (YYYY)'),
            )
            if (daysBetween <= 7) {
              dayText = 'Last ' + dayText
            }
          }
        }

        const isFirst =
          isNewDay ||
          message.type !== 'text' ||
          prevMessage.type !== 'text' ||
          (prevMessage.from !== message.from ||
            messageDate - prevMessageDate >= 60000)

        const isActive = activeMessage && message.id === activeMessage.id

        return (
          <div key={message.id}>
            {isNewDay && (hasReachedBeginning || prevMessage) ? (
              <DayHeader text={dayText} date={startOfDay} />
            ) : null}

            <Message
              message={message}
              connection={connection}
              channel={channel}
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

const mapStateToProps = (state, ownProps) => ({
  messages: ownProps.messages,
  activeMessage: ownProps.activeMessage,

  isSocketConnected: state.isSocketConnected,
  isViewingArchive: isViewingArchiveSelector(state),
  hasReachedBeginning: hasReachedBeginningSelector(state),
  searchHighlights: searchHighlightsSelector(state),
  isSearchOpen: isSearchOpenSelector(state),
  isSearchIntro: isSearchIntroSelector(state),
  isSearchNotFound: isSearchNotFoundSelector(state),
  isSearchOutdated: isSearchOutdatedSelector(state),
  connection: connectionSelector(state),
  channel: channelSelector(state),
})

export default connect(mapStateToProps)(MessagesGrid)
