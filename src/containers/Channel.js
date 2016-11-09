import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { isChannelLoading, selectedChannel, channelMessages, messageRows } from '../selectors'
import { loadMessages } from '../actions'
import Message from '../components/Message'
import Text from '../components/Text'

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

const getMessageRowKey = ({ type, payload }) => {
  const keyerMapping = {
    day: ({ isoTimestamp }) => isoTimestamp,
    message: ({ message }) => message.id,
  }

  return keyerMapping[type](payload)
}

const MessageRow = ({ type, payload }) => {
  const componentMapping = {
    day: DayHeader,
    message: Message,
  }

  const component = componentMapping[type]
  const props = payload

  return React.createElement(component, props)
}

const Messages = ({ messageRows }) => {
  return (
    <div className='messages'>
      {_.map(messageRows, props => <MessageRow {...props} key={getMessageRowKey(props)} />)}
    </div>
  )
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

    if (wrapperNode.scrollTop <= document.documentElement.clientHeight) {
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

    const { selectedChannel, messageRows } = this.props

    return (
      <div id='channel'>
        <div className='header'>
          <h2 className='name bold'>{selectedChannel.name}</h2>
          <p className='topic'>
            <Text>{selectedChannel.topic}</Text>
          </p>
        </div>

        <div className='messages-wrapper' ref={this.onRef} onScroll={this.onScroll}>
          <Messages messageRows={messageRows} />
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
    messageRows: messageRows(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    loadMessages: timestamp => dispatch(loadMessages(timestamp)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
