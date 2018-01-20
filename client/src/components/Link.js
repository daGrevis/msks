import React from 'react'

import { push } from '../history'

export default props =>
  <a
    {...props}
    onClick={ev => {
      ev.preventDefault()

      if (props.onClick) {
        props.onClick()
      } else if (props.href) {
        push(props.href)
      }
    }}
  >
    {props.children}
  </a>
