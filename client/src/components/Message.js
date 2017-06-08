import _ from 'lodash'
import React from 'react'
import classNames from 'classnames'
import { onlyUpdateForKeys } from 'recompose'

import { navigate } from '../history'
import Text from './Text'
import Nick from './Nick'

import '../styles/Message.css'

const MessageText = ({ message }) => {
  let text
  switch (message.kind) {
    case 'message':
    case 'notice':
      text = <Text>{message.text}</Text>
      break
    case 'action':
      text = <span><Nick {...message} /> <Text>{message.text}</Text></span>
      break
    case 'join':
      text = <span><Nick {...message} /> joined</span>
      break
    case 'quit':
      text = <span title={message.text}><Nick {...message} /> quit</span>
      break
    case 'part':
      text = <span title={message.text}><Nick {...message} /> left</span>
      break
    case 'kick':
      text = <span>
        <Nick from={message.kicked} /> kicked by <Nick {...message} />
        {message.text ? <span className='kick-reason'>({message.text})</span> : ''}
      </span>
      break
    case 'nick':
      text = <span><Nick {...message} /> is known as <Nick {...message} from={message.newNick} /></span>
      break
    case 'topic':
      text = <span><Nick {...message} /> set topic to <span className='topic'><Text>{message.text}</Text></span></span>
      break
    case 'mode':
      text = <span><Nick {...message} /> sets <strong>{message.text}</strong> on <Nick from={message.param} /></span>
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

const Message = onlyUpdateForKeys(['id', 'isActive'])(props => {
  const { message, isFirst, isActive, isoTimestamp, timestampText } = props

  const messageClasses = classNames('message', `kind-${message.kind}`, {
    'is-first': isFirst,
    'is-not-first': !isFirst,
    'is-active': isActive,
  })

  const isNickVisible = message.kind === 'message' || message.kind === 'notice'

  return (
    <div id={isActive ? message.id : null} className={messageClasses}>
      <div className='meta'>
        <span
          className='timestamp'
          title={isoTimestamp}
          onClick={() => {
            if (props.isEmbed) {
              if (!isActive) {
                navigate(message.id)
              } else {
                navigate('')
              }
            } else {
              if (!isActive) {
                navigate(`${message.to}/${message.id}`)
              } else {
                navigate(message.to)
              }
            }
          }}
        >
          {timestampText}
        </span>
        {isNickVisible ? <Nick {...message} /> : null}
      </div>

      <MessageText message={message} />
    </div>
  )
})

export default Message
