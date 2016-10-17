import React from 'react'
import { connect } from 'react-redux'

import { selectedChannel, channelMessages } from '../selectors'
import Channel from '../components/Channel'

function mapStateToProps(state) {
  return {
    selectedChannel: selectedChannel(state),
    messages: channelMessages(state),
  }
}

export default connect(mapStateToProps)(Channel)
