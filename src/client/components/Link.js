import React from 'react'

import { navigate } from '../history'

function Link(props) {
  return (
    <span className='link' onClick={() => navigate(props.href)}>{props.children}</span>
  )
}

export default Link
