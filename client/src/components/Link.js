import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { push } from '../actions'

const Link = props =>
  <a
    {..._.omit(props, ['push'])}
    onClick={ev => {
      ev.preventDefault()

      if (props.onClick) {
        props.onClick()
      } else if (props.href) {
        props.push(props.href)
      }
    }}
  >
    {props.children}
  </a>

const mapDispatchToProps = {
  push,
}

export default connect(null, mapDispatchToProps)(Link)
