import React from 'react'

import { getColor } from '../colors'

import '../styles/Nick.css'

const Nick = ({ from, isOp, isVoiced }) =>
  <span className='nick strong' style={{ color: getColor(from) }} title={from}>
    <span className='prefix'>{(isOp ? '@' : '') + (isVoiced ? '+' : '')}</span>
    {from}
  </span>

export default Nick
