import React from 'react'
import { connect } from 'react-redux'

import { getColor } from '../colors'
import { inputSearch } from '../actions'

import '../styles/Nick.css'

const Nick = ({ from, to, isOp, isVoiced, inputSearch }) =>
  <span
    className='nick strong'
    style={{ color: getColor(from) }}
    title={from}
    onClick={() => {
      inputSearch({ nick: from })
    }}
  >
    <span className='prefix'>{(isOp ? '@' : (isVoiced ? '+' : ''))}</span>
    {from}
  </span>

const mapDispatchToProps = {
  inputSearch,
}

export default connect(null, mapDispatchToProps)(Nick)
