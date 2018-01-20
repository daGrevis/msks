import React from 'react'

import { push } from '../history'
import { getColor } from '../colors'
import Link from './Link'

import '../styles/Nick.css'

const Nick = ({ from, to, isOp, isVoiced }) =>
  <Link
    onClick={() => {
      push(`${to}?search&`, { nick: from })
    }}
    className='nick strong'
    style={{ color: getColor(from) }}
    title={from}
  >
    <span className='prefix'>{(isOp ? '@' : (isVoiced ? '+' : ''))}</span>
    {from}
  </Link>

export default Nick
