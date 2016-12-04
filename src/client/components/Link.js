import React from 'react'

import { navigate } from '../history'

const basePath = process.env.REACT_APP_BASE_PATH || ''

function Link(props) {
  return (
    <span className='link' onClick={() => navigate(basePath + props.href)}>{props.children}</span>
  )
}

export default Link
