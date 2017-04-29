import _ from 'lodash'
import fp from 'lodash/fp'
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

class Messages extends React.Component {
  wrapperNode = null
  scrollHeight = null
  scrollTop = null
  shouldScrollToBottom = null
  shouldScrollToMessage = null
  shouldAdjustScrollPosition = null
  shouldRestoreScrollPosition = null
  loadCache = {}

  onRef = node => {
    this.wrapperNode = node
    window.wrapperNode = node
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

      if (this.loadCache[firstMessage.id]) {
        return
      }
      this.loadCache[firstMessage.id] = true

      this.props.loadMessages({
        channelName: this.props.channel.name,
        before: firstMessage.timestamp,
        messageId: firstMessage.id,
      })
    }

    if (hasReachedBottom && !this.props.isSubscribedToMessages) {
      const lastMessage = fp.last(this.props.messages)

      if (this.loadCache[lastMessage.id]) {
        return
      }
      this.loadCache[lastMessage.id] = true

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

  componentWillMount() {
    if (this.props.messageId) {
      if (!fp.find({ id: this.props.messageId }, this.props.messages)) {
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

    const scrollBottom = (
      this.wrapperNode.scrollHeight - (this.wrapperNode.scrollTop + this.wrapperNode.clientHeight)
    )
    this.shouldScrollToBottom = !this.props.messageId && scrollBottom < 50

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
                {isNewDay ? <DayHeader text={dayText} isoTimestamp={currentDay && currentDay.format()} /> : null}

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

export default Messages
