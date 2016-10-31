import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'redux-little-router'

import { stripURI } from "../utils"
import { sortedChannels } from '../selectors'

class ChannelHeader extends React.Component {
  getChannelHref(channel) {
    const channelNameInLink = stripURI(channel.name)
    return `/${channelNameInLink}`
  }

  render() {
    const { onClick, channel } = this.props

    return (
      <header onClick={onClick}>
        <h2 className='bold'>
          <Link href={this.getChannelHref(channel)}>
            {channel.name}
          </Link>
        </h2>
      </header>
    )
  }
}

class Front extends React.Component {
  render() {
    const { sortedChannels: channels } = this.props

    return (
      <div id='front'>
        <a href='https://github.com/daGrevis/msks-web' target='_blank'>
          <h1>msks</h1>
        </a>

        {_.map(channels, channel => (
          <ChannelHeader key={channel.name} channel={channel} />
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

export default connect(mapStateToProps)(Front)
