import _ from 'lodash'
import React from 'react'
import classNames from 'classnames'
import { onlyUpdateForKeys } from 'recompose'

import Maybe from './Maybe'
import Text from './Text'

const Message = onlyUpdateForKeys(['id'])(({ message, isFirst, isoTimestamp, timestampText }) => {
  const classes = classNames('message', {
    'is-first': isFirst,
    'is-not-first': !isFirst,
  })
  return (
    <div className={classes}>
      <Maybe when={isFirst}>
        <div>
          <span className='nick bold'>{message.from}</span>
          <span className='timestamp' title={isoTimestamp}>
            {timestampText}
          </span>
        </div>
      </Maybe>

      <Maybe when={message.kind === 'message'}>
        <div className='text'>
          <Text>{message.text}</Text>
        </div>
      </Maybe>

      <Maybe when={message.kind === 'action'}>
        <div className='text action'>
          <Text>{`${message.from} ${message.text}`}</Text>
        </div>
      </Maybe>
    </div>
  )
})

export default Message
