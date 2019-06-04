import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { push } from '../store/actions/router'

const Link = props => (
  <a
    href={props.href || '#'}
    {..._.omit(props, ['push', 'onClick'])}
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
)

const mapDispatchToProps = {
  push,
}

export default connect(
  null,
  mapDispatchToProps,
)(Link)
