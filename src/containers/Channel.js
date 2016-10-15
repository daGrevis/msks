import React from 'react'
import { connect } from 'react-redux'

import Channel from '../components/Channel'
import { messages, sortedMessages } from '../selectors'

function mapStateToProps(state) {
  return {
    messages: sortedMessages(state),
  }
}

export default connect(mapStateToProps)(Channel)
