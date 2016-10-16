import React from 'react'
import { connect } from 'react-redux'

import { loadChannel } from '../actions'
import { messages, sortedMessages } from '../selectors'
import Channel from '../components/Channel'

function mapStateToProps(state) {
  return {
    channelName: state.channelName,
    messages: sortedMessages(state),
  }
}

const actionCreators = {
  loadChannel,
}

export default connect(mapStateToProps, actionCreators)(Channel)
