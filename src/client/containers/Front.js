import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { sortedChannelsSelector } from '../selectors'
import { openChannel } from '../actions'

import './Front.css'

const Front = ({ sortedChannels: channels, openChannel }) => (
  <div id='front'>
    <a href='https://github.com/daGrevis/msks-web' target='_blank'>
      <h1>msks</h1>
    </a>

    {_.map(channels, channel => (
      <header key={channel.name}>
        <h2 className='bold' onClick={() => openChannel(channel.name)}>{channel.name}</h2>
      </header>
    ))}
  </div>
)

export default connect(
  state => ({
    sortedChannels: sortedChannelsSelector(state),
  }),
  dispatch => ({
    openChannel: x => dispatch(openChannel(x)),
  })
)(Front)
