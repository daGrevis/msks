import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { mo } from '../utils'
import { isChannelLoading, selectedChannel, channelMessages, channelMessagesByDay } from '../selectors'
import { loadMessages } from '../actions'
import Message from '../components/Message'

class Messages extends Component {
  isFirst(messages, message, i) {
    const messageBefore = i > 0 ? messages[i - 1] : null
    const timestamp = new Date(message.timestamp)
    const timestampBefore = messageBefore ? new Date(messageBefore.timestamp) : null
    const isFirst = (
      !messageBefore
      || messageBefore.from !== message.from
      || mo(timestamp).diff(timestampBefore, 'minutes') > 1
    )

    return isFirst
  }

  getHeaderText(day) {
    day = mo(day)
    const now = mo()

    if (day.isSame(now, 'day')) {
      return 'Today'
    }

    if (day.isSame(now.subtract(1, 'd'), 'day')) {
      return 'Yesterday'
    }

    return day.format('dddd, MMMM Do')
  }

  render() {
    const { messagesByDay } = this.props

    return (
      <div className='messages'>
        {_.map(messagesByDay, ([day, messages]) =>
          <div key={day} className='day'>
            <div className='header'>
              <span className='text bold'>
                {this.getHeaderText(day)}
              </span>
              <div className='divider' />
            </div>

            {_.map(messages, (message, i) => (
              <Message
                key={message.id}
                message={message}
                isFirst={this.isFirst(messages, message, i)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
}

class Channel extends Component {
  wrapperNode = null

  state = {
    autoScroll: true,
    scrollOffset: 0,
  }

  scroll() {
    const { wrapperNode } = this

    if (!wrapperNode) {
      return
    }

    const { scrollOffset } = this.state

    let scrollTop
    if (this.state.autoScroll) {
      scrollTop = wrapperNode.scrollHeight
    } else {
      scrollTop = (wrapperNode.scrollHeight - wrapperNode.clientHeight) - scrollOffset
    }
    wrapperNode.scrollTop = scrollTop
  }

  componentDidRender() {
    this.props.loadMessages()
    this.scroll()
  }

  componentDidMount() {
    this.componentDidRender()
  }

  componentDidUpdate() {
    this.componentDidRender()
  }

  onRef = node => {
    this.wrapperNode = node
  }

  onScroll = ev => {
    const { target: wrapperNode } = ev

    const stateUpdate = {}

    const scrollOffset = (wrapperNode.scrollHeight - wrapperNode.clientHeight) - wrapperNode.scrollTop
    stateUpdate.scrollOffset = scrollOffset

    if (wrapperNode.scrollTop <= 1000) {
      const messageFirst = _.first(this.props.messages)
      this.props.loadMessages(messageFirst ? messageFirst.timestamp : null)
    }

    const autoScroll = wrapperNode.scrollTop === wrapperNode.scrollHeight - wrapperNode.clientHeight
    stateUpdate.autoScroll = autoScroll

    this.setState(stateUpdate)
  }

  render() {
    if (this.props.isChannelLoading) {
      return null
    }

    const { selectedChannel } = this.props

    return (
      <div id='channel'>
        <div className='header'>
          <h2 className='name bold'>{selectedChannel.name}</h2>
          <p className='topic'>{selectedChannel.topic}</p>
        </div>

        <div className='messages-wrapper' ref={this.onRef} onScroll={this.onScroll}>
          <Messages messagesByDay={this.props.messagesByDay} />
        </div>
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    isChannelLoading: isChannelLoading(state),
    selectedChannel: selectedChannel(state),
    messages: channelMessages(state),
    messagesByDay: channelMessagesByDay(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    loadMessages: timestamp => dispatch(loadMessages(timestamp)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
