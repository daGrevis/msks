import _ from 'lodash'
import React, { Component } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import { mo } from '../utils'
import {
  getChannelSelector, getMessagesSelector,
  hasReachedBeginningSelector, isSubscribedToMessagesSelector,
} from '../selectors'
import { loadMessages, openChannel } from '../actions'
import Maybe from '../components/Maybe'
import Text from '../components/Text'
import Message from '../components/Message'
import Loader from '../components/Loader'

import './Channel.css'

const DayHeader = ({ text, isoTimestamp }) => {
  return (
    <div className='day-header'>
      <span className='text bold' title={isoTimestamp}>
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
      <Maybe when={messageLength === 0}>
        <Loader />
      </Maybe>

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

        const isFirst = isNewDay || (
          previousMessage.from !== message.from
          || (timestamp - previousTimestamp) >= 60000
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
            <Maybe when={isLoadingTop}>
              <Loader />
            </Maybe>

            <Maybe when={isNewDay}>
              <DayHeader text={dayText} isoTimestamp={currentDay && currentDay.format()} />
            </Maybe>

            <Message
              message={message}
              isFirst={isFirst}
              isoTimestamp={timestamp.format()}
              timestampText={timestamp.format('HH:mm')}
            />

            <Maybe when={isLoadingBottom}>
              <Loader />
            </Maybe>
          </div>
        )
      })}
    </div>
  )
}

class Channel extends Component {
  wrapperNode = null

  autoScroll = true
  persistScroll = false
  scrollHeight = 0
  scrollTop = 0

  state = {
    isTopicClipped: true,
  }

  componentDidMount() {
    this.props.loadMessages({ channelName: this.props.channel.name })

    this.autoScroll = true
    this.scroll()
  }

  componentWillUpdate(nextProps) {
    const { wrapperNode } = this

    if (!wrapperNode) {
      return
    }

    this.autoScroll = (
      wrapperNode.scrollHeight - wrapperNode.scrollTop
      <= wrapperNode.clientHeight + 10
    )

    if (!this.autoScroll) {
      this.persistScroll = (
        !_.isEmpty(nextProps.messages)
        && _.first(nextProps.messages) !== _.first(this.props.messages)
      )

      if (this.persistScroll) {
        this.scrollHeight = wrapperNode.scrollHeight
        this.scrollTop = wrapperNode.scrollTop
      }
    }
  }

  componentDidUpdate() {
    this.props.loadMessages({ channelName: this.props.channel.name })

    this.scroll()
  }

  scroll() {
    const { wrapperNode } = this

    if (wrapperNode) {
      if (this.autoScroll) {
        setTimeout(() => {
          wrapperNode.scrollTop = wrapperNode.scrollHeight
        })
      } else if (this.persistScroll) {
        wrapperNode.scrollTop = this.scrollTop + (wrapperNode.scrollHeight - this.scrollHeight)
      }
    }
  }

  onRef = node => {
    this.wrapperNode = node
  }

  onScroll = ev => {
    const { target: wrapperNode } = ev

    const threshold = document.documentElement.clientHeight
    if (wrapperNode.scrollTop <= threshold) {
      const messageFirst = _.first(this.props.messages)
      this.props.loadMessages({
        channelName: this.props.channel.name,
        before: messageFirst ? messageFirst.timestamp : null
      })
    }
  }

  onTopicClick = () => {
    this.setState({ isTopicClipped: !this.state.isTopicClipped })
  }

  render() {
    const { channel } = this.props

    const topicClasses = classNames('topic', {
      'is-topic-clipped': this.state.isTopicClipped,
    })

    return (
      <div id='channel'>
        <div className='header'>
          <h2 className='name bold' onClick={this.props.goToFront}>{channel.name}</h2>

          <Maybe when={channel.topic}>
            <div className={topicClasses} onClick={this.onTopicClick}>
              <Text>{channel.topic}</Text>
            </div>
          </Maybe>
        </div>

        <div className='messages-wrapper' ref={this.onRef} onScroll={this.onScroll}>
          <Messages {...this.props} />
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, props) => ({
  channel: getChannelSelector()(state),
  messages: getMessagesSelector()(state),
  hasReachedBeginning: hasReachedBeginningSelector(state),
  isSubscribedToMessages: isSubscribedToMessagesSelector(state),
})

const mapDispatchToProps = dispatch => ({
  loadMessages: p => dispatch(loadMessages(p)),
  goToFront: () => dispatch(openChannel()),
})

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
