import React from 'react'

import { history } from '../history'

export default props =>
  <a
    {...props}
    onClick={ev => {
      ev.preventDefault()

      if (props.onClick) {
        props.onClick()
      } else if (props.href) {
        history.push(props.href)
      }
    }}
  >
    {props.children}
  </a>
