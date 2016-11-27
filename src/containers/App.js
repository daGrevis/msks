import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { isAppLoading, channelName } from '../selectors'
import Maybe from '../components/Maybe'
import Loader from '../components/Loader'

import Front from './Front'
import Channel from './Channel'

import './App.css'

function App({ isLoading, channelName }) {
  const classes = classNames({
    'is-loading': isLoading,
  })
  return (
    <div id='app' className={classes}>
      <Maybe when={isLoading}>
        <Loader />
      </Maybe>
      <Maybe when={!isLoading}>
        {channelName ? <Channel /> : <Front />}
      </Maybe>
    </div>
  )
}

function mapStateToProps(state) {
  return {
    isLoading: isAppLoading(state),
    channelName: channelName(state),
  }
}

export default connect(mapStateToProps)(App)
