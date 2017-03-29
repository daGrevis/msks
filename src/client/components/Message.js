import _ from 'lodash'
import fp from 'lodash/fp'
import React from 'react'
import classNames from 'classnames'
import { onlyUpdateForKeys } from 'recompose'

import Text from './Text'
import { getColor } from '../colors'

import './Message.css'

const Nick = ({ children: nick }) =>
  <span className='nick strong' style={{ color: getColor(nick) }} title={nick}>
    {nick}
  </span>

const MessageText = ({ message }) => {
  let text
  switch (message.kind) {
    case 'message':
    case 'notice':
      text = <Text>{message.text}</Text>
      break
    case 'action':
      text = <span><Nick>{message.from}</Nick> <Text>{message.text}</Text></span>
      break
    case 'join':
      text = <span><Nick>{message.from}</Nick> joined</span>
      break
    case 'quit':
      text = <span title={message.text}><Nick>{message.from}</Nick> quit</span>
      break
    case 'part':
      text = <span title={message.text}><Nick>{message.from}</Nick> left</span>
      break
    case 'kick':
      text = <span>
        <Nick>{message.kicked}</Nick> kicked by <Nick>{message.from}</Nick>
        {message.text ? <span className='kick-reason'>({message.text})</span> : ''}
      </span>
      break
    case 'nick':
      text = <span><Nick>{message.from}</Nick> is now known as <Nick>{message.newNick}</Nick></span>
      break
    case 'topic':
      text = <span><Nick>{message.from}</Nick> set topic to <span className='topic'><Text>{message.text}</Text></span></span>
      break
    case 'mode':
      text = <span><Nick>{message.from}</Nick> sets <strong>{message.text}</strong> on <Nick>{message.param}</Nick></span>
      break
    default:
      console.log('MessageText case for kind not handled:', message.kind)
      text = ''
      break
  }

  return (
    <div className='text'>
      {text}
    </div>
  )
}

const Message = onlyUpdateForKeys(['id'])(props => {
  const { message, isFirst, isoTimestamp, timestampText } = props

  const messageClasses = classNames('message', `kind-${message.kind}`, {
    'is-first': isFirst,
    'is-not-first': !isFirst,
  })

  const isNickVisible = fp.includes(message.kind, ['message', 'notice'])

  return (
    <div className={messageClasses}>
      <div className='meta'>
        <span className='timestamp' title={isoTimestamp}>{timestampText}</span>
        {isNickVisible ? <Nick>{message.from}</Nick> : null}
      </div>

      <MessageText message={message} />
    </div>
  )
})

export default Message
