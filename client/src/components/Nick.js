import React from 'react'

import config from '../config'
import { push } from '../history'
import { getColor } from '../colors'
import Link from './Link'

import '../styles/Nick.css'

const Nick = ({ from, to, isOp, isVoiced }) =>
  <Link
    onClick={() => {
      push(`${config.embedChannel ? '' : to}?search&`, { nick: from })
    }}
    className='nick strong'
    style={{ color: getColor(from) }}
    title={from}
  >
    <span className='prefix'>{(isOp ? '@' : (isVoiced ? '+' : ''))}</span>
    {from}
  </Link>

export default Nick
