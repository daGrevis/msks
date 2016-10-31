import _ from 'lodash'
import React, { Component } from 'react'
import classNames from 'classnames'

import { mo } from '../utils'
import Maybe from './Maybe'
import Text from './Text'

export default class Message extends Component {
  render() {
    const { message, isFirst } = this.props

    const classes = classNames('message', {
      'is-first': isFirst,
      'is-not-first': !isFirst,
    })
    return <div className={classes}>
      <Maybe when={isFirst}>
        <div>
          <span className='nick bold'>{message.from}</span>
          <span className='timestamp' title={mo(message.timestamp).format()}>
            {mo(message.timestamp).format('HH:mm')}
          </span>
        </div>
      </Maybe>

      <div className='text'>
        <Text>{message.text}</Text>
      </div>
    </div>
  }
}
