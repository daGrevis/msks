import _ from 'lodash'
import React from 'react'

import { history } from '../history'

export default props =>
  <a
    {..._.omit(props, ['onClick'])}
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
