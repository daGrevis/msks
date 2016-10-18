import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { stripURI } from "../utils"
import { navigate } from '../actions'
import { sortedChannels } from '../selectors'

function ChannelHeader(props) {
  const { onClick, channel } = props

  return (
    <header onClick={onClick}>
      <h2>
        {channel.name}
      </h2>
    </header>
  )
}

class Front extends React.Component {
  navigateToChannel(channel) {
    const channelNameInLink = stripURI(channel.name)
    this.props.navigate(`/${channelNameInLink}`)
  }

  render() {
    const { sortedChannels: channels } = this.props

    return (
      <div className='front'>
        {_.map(channels, channel => (
          <ChannelHeader
            key={channel.name}
            channel={channel}
            onClick={() => this.navigateToChannel(channel)}
          />
        ))}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    sortedChannels: sortedChannels(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    navigate: x => dispatch(navigate(x)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Front)
