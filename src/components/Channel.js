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
    const { channelName, messages } = this.props

    return <div className='channel'>
      <header>
        <h2 className='name'>{channelName}</h2>
        <p className='topic'>Register with NickServ to talk. | About software and hacking in Latvian. Language and paradigm agnostic. Flamewars allowed while it doesn't get too personal. Not really for novice programmers. | daGrevis: neraudi, susuriņ | Tik tikko pievienojies? /msg Xn !history 25</p>
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
