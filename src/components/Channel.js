import _ from 'lodash'
import React, { Component } from 'react'

import Message from './Message'

export default class Channel extends Component {
  render() {
    const { messages } = this.props

    return <div className='channel'>
      {_.map(messages, (message, i) =>
        <Message
          key={message.id}
          message={message}
          isConsecutive={i > 0 && messages[i - 1].from === message.from}
        />
      )}
    </div>
  }
}
