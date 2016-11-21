import _ from 'lodash'
import React from 'react'
import classNames from 'classnames'
import { onlyUpdateForKeys } from 'recompose'

import Maybe from './Maybe'
import Text from './Text'

const Message = onlyUpdateForKeys(['id'])(({ message, isFirst, isoTimestamp, timestampText }) => {
  const messageClasses = classNames('message', {
    'is-first': isFirst,
    'is-not-first': !isFirst,
  })
  const textClasses = classNames('message', {
    'text': true,
    'action': message.kind === 'action',
  })
  return (
    <div className={messageClasses}>
      <Maybe when={isFirst}>
        <div>
          <span className='nick bold'>{message.from}</span>
          <span className='timestamp' title={isoTimestamp}>
            {timestampText}
          </span>
        </div>
      </Maybe>

      <div className={textClasses}>
        <Text>{message.text}</Text>
      </div>
    </div>
  )
})

export default Message
