import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { isChannelLoading, selectedChannel, channelMessages } from '../selectors'
import { loadChannel } from '../actions'
import Message from '../components/Message'

class Channel extends Component {
  messagesNode = null

  scroll() {
    const { messagesNode } = this

    if (!messagesNode) {
      return
    }

    messagesNode.scrollTop = messagesNode.scrollHeight
  }

  componentDidMount() {
    this.props.loadChannel()
  }

  componentDidUpdate() {
    this.props.loadChannel()
    this.scroll()
  }

  render() {
    if (this.props.isChannelLoading) {
      return null
    }

    const { selectedChannel, messages } = this.props

    return <div className='channel'>
      <header>
        <h2 className='name'>{selectedChannel.name}</h2>
        <p className='topic'>{selectedChannel.topic}</p>
      </header>

      <div className='messages-wrapper'>
        <div className='messages' ref={node => this.messagesNode = node}>
          {_.map(messages, (message, i) =>
            <Message
              key={message.id}
              message={message}
              isConsecutive={i > 0 && messages[i - 1].from === message.from}
            />
          )}
        </div>
      </div>
    </div>
  }
}

function mapStateToProps(state, props) {
  return {
    isChannelLoading: isChannelLoading(state),
    selectedChannel: selectedChannel(state),
    messages: channelMessages(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    loadChannel: () => dispatch(loadChannel()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
