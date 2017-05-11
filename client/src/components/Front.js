import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import titles from '../../../common/src/titles'

import { navigate } from '../history'
import { setTitle } from '../actions'
import { sortedChannelsSelector } from '../selectors'

import '../styles/Front.css'

class Front extends React.Component {
  componentWillMount() {
    this.props.setTitle(titles.getIndexTitle())
  }

  render() {
    return (
      <div id='front'>
        <a href='https://github.com/daGrevis/msks-web' target='_blank'>
          <h1>msks</h1>
        </a>

        {_.map(this.props.sortedChannels, channel => (
          <header key={channel.name}>
            <h2 className='strong' onClick={() => navigate(channel.name)}>{channel.name}</h2>
          </header>
        ))}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  sortedChannels: sortedChannelsSelector(state),
})

const mapDispatchToProps = {
  setTitle,
}

export default connect(mapStateToProps, mapDispatchToProps)(Front)
