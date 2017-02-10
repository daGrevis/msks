import _ from 'lodash'
import React from 'react'
import classNames from 'classnames'
import { onlyUpdateForKeys } from 'recompose'

import Text from './Text'
import { getColor } from '../colors'

const Message = onlyUpdateForKeys(['id'])(props => {
  const { message, isFirst, isoTimestamp, timestampText } = props

  const messageClasses = classNames('message', {
    'is-first': isFirst,
    'is-not-first': !isFirst,
  })
  const textClasses = classNames({
    'text': true,
    'action': message.kind === 'action',
  })
  return (
    <div className={messageClasses}>
      <div className='meta'>
        <span className='timestamp' title={isoTimestamp}>{timestampText}</span>
        <span className='nick bold' style={{ color: getColor(message.from) }}>{message.from + ' '}</span>
      </div>

      <div className={textClasses}>
        <Text>{message.text}</Text>
      </div>
    </div>
  )
})

export default Message
