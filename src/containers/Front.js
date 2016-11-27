import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import Link from '../components/Link'

import { sortedChannels } from '../selectors'

import './Front.css'

function ChannelHeader({ channel }) {
  return (
    <header>
      <Link href={`/${channel.name}`}>
        <h2 className='bold'>{channel.name}</h2>
      </Link>
    </header>
  )
}

function Front({ sortedChannels: channels }) {
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

function mapStateToProps(state) {
  return {
    sortedChannels: sortedChannels(state),
  }
}

export default connect(mapStateToProps)(Front)
