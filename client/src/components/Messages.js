import _ from 'lodash'
import fp from 'lodash/fp'
import React from 'react'
import { connect } from 'react-redux'

import titles from '../../../common/src/titles'

import { mo } from '../utils'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { setTitle, loadMessages, setScrollPosition } from '../actions'
import { isEmbedSelector, messagesSelector, hasReachedBeginningSelector } from '../selectors'

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

  onScroll = _.debounce(() => {
    if (!this.props.messages.length) {
      return
    }

    const hasReachedTop = this.wrapperNode.scrollTop < 200
    const hasReachedBottom = (
      this.wrapperNode.scrollHeight - (this.wrapperNode.scrollTop + this.wrapperNode.clientHeight)
      < 200
    )

    if (hasReachedTop) {
      const firstMessage = fp.first(this.props.messages)

      this.props.loadMessages({
        channelName: this.props.channel.name,
        before: firstMessage.timestamp,
        messageId: firstMessage.id,
      })
    }

    if (hasReachedBottom && !this.props.isSubscribedToMessages) {
      const lastMessage = fp.last(this.props.messages)

      this.props.loadMessages({
        channelName: this.props.channel.name,
        after: lastMessage.timestamp,
        messageId: lastMessage.id,
      })
    }

    this.props.setScrollPosition({
      channelName: this.props.channel.name,
      position: this.wrapperNode.scrollTop,
    })
  }, 100)

  updateScroll = () => {
    if (!this.props.messages.length) {
      return
    }

    if (this.shouldScrollToBottom) {
      this.wrapperNode.scrollTop = this.wrapperNode.scrollHeight - this.wrapperNode.clientHeight

      return
    }

    if (this.shouldScrollToMessage) {
      const messageNode = document.getElementById(this.props.messageId)
      if (messageNode) {
        this.wrapperNode.scrollTop = (
          messageNode.offsetTop - (this.wrapperNode.clientHeight / 2)
        )

        this.shouldScrollToMessage = false
      }

      return
    }

    if (this.shouldAdjustScrollPosition) {
      this.wrapperNode.scrollTop = (
        this.scrollTop + (this.wrapperNode.scrollHeight - this.scrollHeight)
      )

      return
    }

    if (this.shouldRestoreScrollPosition) {
      this.wrapperNode.scrollTop = this.props.scrollPosition

      return
    }
  }

  getActiveMessage = () => (
    fp.find({ id: this.props.messageId }, this.props.messages)
  )

  updateTitle = () => {
    const activeMessage = this.getActiveMessage()

    this.props.setTitle(
      activeMessage
      ? titles.getMessageTitle(activeMessage)
      : titles.getChannelTitle(this.props.channel)
    )
  }

  componentWillMount() {
    this.updateTitle()

    if (this.props.messageId) {
      if (!this.getActiveMessage()) {
        this.props.loadMessages({
          channelName: this.props.channel.name,
          messageId: this.props.messageId,
        })
      }
    } else {
      if (!this.props.messages.length) {
        this.props.loadMessages({
          channelName: this.props.channel.name,
        })
      }
    }
  }

  componentWillUpdate(nextProps) {
    if (!this.props.messages.length || !nextProps.messages.length) {
      return
    }

    this.scrollHeight = this.wrapperNode.scrollHeight
    this.scrollTop = this.wrapperNode.scrollTop

    this.shouldScrollToBottom = (
      !this.props.messageId
      && this.props.isSubscribedToMessages
      && (
        this.wrapperNode.scrollHeight
        === (this.wrapperNode.scrollTop + this.wrapperNode.clientHeight)
      )
    )

    this.shouldScrollToMessage = false

    this.shouldRestoreScrollPosition = false

    this.shouldAdjustScrollPosition = (
      this.props.messages[0].id !== nextProps.messages[0].id
    )
  }

  componentDidMount() {
    this.shouldScrollToBottom = !this.props.messageId && !this.props.messages.length

    this.shouldScrollToMessage = this.props.messageId

    this.shouldRestoreScrollPosition = this.props.scrollPosition

    this.shouldAdjustScrollPosition = false

    this.updateScroll()
    this.onScroll()
  }

  componentDidUpdate() {
    this.updateTitle()
    this.updateScroll()
    this.onScroll()
  }

  render() {
    const { messages, hasReachedBeginning, isSubscribedToMessages } = this.props

    const now = mo()
    const messageLength = messages.length

    let currentDay, dayText

    return (
      <div className='messages-wrapper' ref={this.onRef} onScroll={this.onScroll}>
        <div className='messages'>
          {messageLength === 0 ? <Loader /> : null}

          {messageLength && !hasReachedBeginning ? <Loader /> : null}

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
                />
              </div>
            )
          })}

          {messageLength && !isSubscribedToMessages ? <Loader /> : null}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, props) => {
  const { channelName } = state

  return {
    messageId: props.messageId,

    isEmbed: isEmbedSelector(state),
    isSubscribedToMessages: state.isSubscribedToMessages[channelName],
    loadCache: state.loadCache,
    channel: state.channels[channelName],
    messages: messagesSelector(state),
    scrollPosition: state.scrollPositions[channelName],
    hasReachedBeginning: hasReachedBeginningSelector(state),
  }
}

const mapDispatchToProps = dispatch => ({
  dispatch,
})

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  return {
    ...stateProps,
    ...ownProps,

    setTitle: payload => dispatch(setTitle(payload)),
    setScrollPosition: payload => dispatch(setScrollPosition(payload)),
    loadMessages: payload => {
      if (payload.messageId && stateProps.loadCache[payload.messageId]) {
        return
      }

      dispatch(loadMessages(payload))
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Messages)
