import React from 'react'
import { connect } from 'react-redux'

import { selectedChannel, sortedMessages } from '../selectors'
import Channel from '../components/Channel'

function mapStateToProps(state) {
  return {
    selectedChannel: selectedChannel(state),
    messages: sortedMessages(state),
  }
}

export default connect(mapStateToProps)(Channel)
