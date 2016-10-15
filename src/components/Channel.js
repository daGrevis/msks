import _ from 'lodash'
import React, { Component } from 'react'

import Message from './Message'

export default class Channel extends Component {
  render() {
    const { messages } = this.props

    return <div className='channel'>
      {_.map(messages, message =>
        <Message
          key={message.id}
          message={message}
          isConsecutive={false}
        />
      )}
    </div>
  }
}
