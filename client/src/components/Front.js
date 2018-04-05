import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import titles from '../common/titles'

import { setTitle } from '../actions'
import { sortedChannelsSelector } from '../selectors'
import Link from './Link'

import '../styles/Front.css'
import octocatSvg from '../vectors/octocat.svg'

class Front extends React.Component {
  componentWillMount() {
    this.props.setTitle(titles.getIndexTitle())
  }

  render() {
    return (
      <div id='front'>
        <a href='https://github.com/daGrevis/msks' target='_blank' rel='noopener noreferrer'>
          <img className='octocat' src={octocatSvg} alt='' />
        </a>

        <a href='https://github.com/daGrevis/msks' target='_blank' rel='noopener noreferrer'>
          <h1>msks</h1>
        </a>

        {_.map(this.props.sortedChannels, channel => (
          <div
            key={channel.name}
            className='channel'
          >
            <Link href={channel.name} className='strong'>
              {channel.name}
            </Link>
          </div>
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
