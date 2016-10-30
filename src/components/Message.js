import _ from 'lodash'
import fp from 'lodash/fp'
import React, { Component } from 'react'
import classNames from 'classnames'

import { mo } from '../utils'
import Maybe from './Maybe'

export default class Message extends Component {
  get text() {
    const { message } = this.props
    const { text } = message

    const linkPattern = /([a-z]+:\/\/[^,\s]+)/g

    const parts = fp.filter(s => s !== '')(text.split(linkPattern))

    return _.map(parts, (part, i) => {
      if (linkPattern.test(part)) {
        return <a key={i} href={part} target='_blank'>{part}</a>
      } else {
        return <span key={i}>{part}</span>
      }
    })
  }

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
          <span className='timestamp'>{mo(message.timestamp).format('HH:mm')}</span>
        </div>
      </Maybe>

      <div className='text'>
        {this.text}
      </div>
    </div>
  }
}
