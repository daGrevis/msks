import _ from 'lodash'
import React, { Component } from 'react'

import Message from './Message'

export default class Channel extends Component {
  messagesNode = null

  scroll() {
    const { messagesNode } = this
    messagesNode.scrollTop = messagesNode.scrollHeight
  }

  componentDidMount() {
    this.scroll()
  }

  componentDidUpdate() {
    this.scroll()
  }

  render() {
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
