import React from 'react'

import config from '../config'
import { getColor } from '../colors'
import Link from './Link'

import '../styles/Nick.css'

const Nick = ({ from, to, isOp, isVoiced }) =>
  <Link
    href={`/${config.embedChannel ? '' : to}?search&nick=${from}`}
    className='nick strong'
    style={{ color: getColor(from) }}
    title={from}
  >
    <span className='prefix'>{(isVoiced ? '+' : '') + (isOp ? '@' : '')}</span>
    {from}
  </Link>

export default Nick
