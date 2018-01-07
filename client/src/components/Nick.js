import React from 'react'
import { connect } from 'react-redux'

import { getColor } from '../colors'
import { inputSearch } from '../actions'
import Link from './Link'

import '../styles/Nick.css'

const Nick = ({ from, to, isOp, isVoiced, inputSearch }) =>
  <Link
    onClick={() => {
      inputSearch({ nick: from })
    }}
    className='nick strong'
    style={{ color: getColor(from) }}
    title={from}
  >
    <span className='prefix'>{(isOp ? '@' : (isVoiced ? '+' : ''))}</span>
    {from}
  </Link>

const mapDispatchToProps = {
  inputSearch,
}

export default connect(null, mapDispatchToProps)(Nick)
