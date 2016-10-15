import React from 'react'
import { connect } from 'react-redux'

import Channel from '../components/Channel'

function mapStateToProps(state) {
  return {
    messages: state.messages,
  }
}

export default connect(mapStateToProps)(Channel)
