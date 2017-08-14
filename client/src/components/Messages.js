import _ from 'lodash'
import fp from 'lodash/fp'
import React from 'react'
import { connect } from 'react-redux'

import titles from '../../../common/src/titles'

import { mo } from '../utils'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { setTitle, loadMessages, setScrollPosition, search } from '../actions'
import {
  isEmbedSelector, messagesSelector, hasReachedBeginningSelector,
  isSearchOpenSelector, searchQuerySelector, isSearchOutdatedSelector, searchHighlightsSelector,
} from '../selectors'

const Notice = props => (
  <div className='notice'>
    {props.children}
  </div>
)

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

class Messages extends React.Component {
  wrapperNode = null
  scrollHeight = null
  scrollTop = null
  shouldScrollToBottom = null
  shouldScrollToMessage = null
  shouldAdjustScrollPosition = null
  shouldRestoreScrollPosition = null

  onRef = node => {
    this.wrapperNode = node
  }

  onScrolledTop = () => {
    const firstMessage = fp.first(this.props.messages)

    if (this.props.isSearchOpen) {
      this.props.search({
        query: this.props.searchQuery,
        offset: this.props.messages.length,
        messageId: firstMessage.id,
      })
    } else {
      this.props.loadMessages({
        channelName: this.props.channelName,
        before: firstMessage.timestamp,
        messageId: firstMessage.id,
      })
    }
  }

  onScrolledBottom = () => {
    if (this.props.isSearchOpen) {
      // Do nothing.
    } else if (!this.props.isSubscribedToMessages) {
      const lastMessage = fp.last(this.props.messages)

      this.props.loadMessages({
        channelName: this.props.channelName,
        after: lastMessage.timestamp,
        messageId: lastMessage.id,
      })
    }
  }

  onDebouncedScroll = _.debounce(() => {
    if (!this.wrapperNode || !this.props.messages.length) {
      return
    }

    const hasReachedTop = this.wrapperNode.scrollTop < 200
    const hasReachedBottom = (
      this.wrapperNode.scrollHeight - (this.wrapperNode.scrollTop + this.wrapperNode.clientHeight)
      < 200
    )

    if (hasReachedTop) {
      this.onScrolledTop()
    }

    if (hasReachedBottom) {
      this.onScrolledBottom()
    }

    if (!this.props.isSearchOpen) {
      this.props.setScrollPosition({
        channelName: this.props.channelName,
        position: this.wrapperNode.scrollTop,
      })
    }
  }, 100)

  onScroll = () => {
    this.onDebouncedScroll()
  }

  updateScroll = () => {
    if (!this.props.messages.length) {
      return
    }

    if (this.shouldScrollToBottom) {
      this.wrapperNode.scrollTop = this.wrapperNode.scrollHeight - this.wrapperNode.clientHeight

      this.shouldScrollToBottom = false

      return
    }

    if (this.shouldScrollToMessage) {
      const messageNode = document.getElementById(this.props.messageId)
      if (!messageNode) {
        return
      }

      this.wrapperNode.scrollTop = (
        messageNode.offsetTop - (this.wrapperNode.clientHeight / 2)
      )

      this.shouldScrollToMessage = false

      return
    }

    if (this.shouldAdjustScrollPosition) {
      this.wrapperNode.scrollTop = (
        this.scrollTop + (this.wrapperNode.scrollHeight - this.scrollHeight)
      )

      this.shouldAdjustScrollPosition = false

      return
    }

    if (this.shouldRestoreScrollPosition) {
      this.wrapperNode.scrollTop = this.props.scrollPosition

      this.shouldRestoreScrollPosition = false

      return
    }
  }

  updateTitle = () => {
    const activeMessage = fp.find({ id: this.props.messageId }, this.props.messages)

    this.props.setTitle(
      activeMessage
      ? titles.getMessageTitle(activeMessage)
      : titles.getChannelTitle(this.props.channel)
    )
  }

  componentWillMount() {
    this.onBeforeRender(this.props)

    this.shouldScrollToMessage = this.props.messageId

    this.updateTitle()
  }

  componentWillUpdate(nextProps) {
    this.onBeforeRender(nextProps)

    this.scrollHeight = this.wrapperNode.scrollHeight
    this.scrollTop = this.wrapperNode.scrollTop

    this.shouldScrollToBottom = (
      !this.props.messageId
      && (this.props.isSubscribedToMessages || !this.props.messages.length)
      && (
        this.wrapperNode.scrollHeight
        === (this.wrapperNode.scrollTop + this.wrapperNode.clientHeight)
      )
    )

    if (nextProps.messageId && this.props.messageId !== nextProps.messageId) {
      this.shouldScrollToMessage = true
    }

    this.shouldAdjustScrollPosition = (
      this.props.messages.length
      && nextProps.messages.length
      && this.props.messages[0].id !== nextProps.messages[0].id
    )
  }

  onBeforeRender(props) {
    if (props.isSearchOpen) {
      return
    }

    if (props.messageId) {
      props.loadMessages({
        channelName: props.channelName,
        messageId: props.messageId,
      })
    } else {
      props.loadMessages({
        channelName: props.channelName,
      })
    }
  }

  componentDidMount() {
    this.shouldRestoreScrollPosition = this.props.scrollPosition

    if (this.props.isSearchOpen) {
      this.props.search({
        query: this.props.searchQuery,
      })
    }

    this.onAfterRender()
  }

  componentDidUpdate() {
    this.onAfterRender()
  }

  onAfterRender() {
    this.updateTitle()

    this.onScroll()

    this.updateScroll()
  }

  render() {
    const {
      messages, hasReachedBeginning, isSubscribedToMessages,
      isSearchOpen, searchQuery, isSearchOutdated, searchHighlights,
    } = this.props

    const now = mo()
    const messageLength = messages.length

    let currentDay, dayText

    const isSearchIntro = (
      isSearchOpen
      && fp.isEmpty(searchQuery)
    )
    const isSearchNotFound = (
      isSearchOpen
      && !isSearchIntro
      && !isSearchOutdated
      && !messageLength
    )

    const isTopLoading = (
      isSearchOpen
      ? (
        // Show when not reached beginning or outdated.
        (!hasReachedBeginning || isSearchOutdated)
        // Don't show when intro or not found.
        && (!isSearchIntro && !isSearchNotFound)
      )
      // Show when not reached beginning or no messages.
      : (!hasReachedBeginning || !messageLength)
    )
    const isBottomLoading = (
      // Never show when search.
      !isSearchOpen
      // Never show when no messages.
      && messageLength
      // Show when not subscribed.
      && !isSubscribedToMessages
    )

    return (
      <div className='messages-wrapper' ref={this.onRef} onScroll={this.onScroll}>
        <div className='messages'>
          {isSearchIntro ? (
            <Notice>Start typing to search...</Notice>
          ) : null}

          {isSearchNotFound ? (
            <Notice>Nothing was found...</Notice>
          ) : null}

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

            const isActive = message.id === this.props.messageId

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
                  isEmbed={this.props.isEmbed}
                  highlights={searchHighlights}
                />
              </div>
            )
          })}

          {isBottomLoading ? <Loader /> : null}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, props) => {
  return {
    messageId: props.messageId,

    isEmbed: isEmbedSelector(state),
    isSubscribedToMessages: state.isSubscribedToMessages[state.channelName],
    channelName: state.channelName,
    channel: state.channels[state.channelName],
    loadCache: state.loadCache,
    messages: messagesSelector(state),
    scrollPosition: state.scrollPositions[state.channelName],
    hasReachedBeginning: hasReachedBeginningSelector(state),
    isSearchOpen: isSearchOpenSelector(state),
    searchQuery: searchQuerySelector(state),
    isSearchOutdated: isSearchOutdatedSelector(state),
    searchHighlights: searchHighlightsSelector(state),
    searchCache: state.searchCache,
  }
}

const mapDispatchToProps = {
  setTitle,
  setScrollPosition,
  loadMessages,
  search,
}

export default connect(mapStateToProps, mapDispatchToProps)(Messages)
