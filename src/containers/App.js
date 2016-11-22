import React, { Component } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { isAppLoading } from '../selectors'
import Maybe from '../components/Maybe'
import Loader from '../components/Loader'

class App extends Component {
  render() {
    const { isLoading, children } = this.props

    const classes = classNames({
      'is-loading': isLoading,
    })
    return (
      <div id='app' className={classes}>
        <Maybe when={isLoading}>
          <Loader />
        </Maybe>
        <Maybe when={!isLoading}>
          {children}
        </Maybe>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    isLoading: isAppLoading(state),
  }
}

export default connect(mapStateToProps)(App)
