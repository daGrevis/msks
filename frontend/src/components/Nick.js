import React from 'react'

import getNickColor from '../irc/getNickColor'
import Link from './Link'

import '../styles/Nick.css'

const Nick = ({ nick, isOp, isVoiced, link, noColor }) => {
  const Component = link ? Link : 'span'

  return (
    <Component
      className="nick strong"
      style={{ color: !noColor && nick ? getNickColor(nick) : undefined }}
      title={nick}
      href={link}
    >
      <span className="prefix">
        {(isVoiced ? '+' : '') + (isOp ? '@' : '')}
      </span>
      {nick}
    </Component>
  )
}

export default Nick
