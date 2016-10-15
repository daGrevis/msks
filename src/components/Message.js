import moment from 'moment'
import React, { Component } from 'react'
import classNames from 'classnames'

import Maybe from './Maybe'

export default class Message extends Component {
  render() {
    const { message, isConsecutive } = this.props

    const classes = classNames('message', {
      'is-consecutive': isConsecutive,
      'is-first': !isConsecutive,
    })
    return <div className={classes}>
      <Maybe when={!isConsecutive}>
        <div>
          <span className='nick'>{message.from}</span>
          <span className='timestamp'>{moment(message.timestamp).format('h:mm A')}</span>
        </div>
      </Maybe>
      <div className='text'>
        {message.text}
      </div>
    </div>
  }
}
