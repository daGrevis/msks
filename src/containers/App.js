import React, { Component } from 'react'
import { connect } from 'react-redux'

import { isAppLoading } from '../selectors'
import Maybe from '../components/Maybe'

class App extends Component {
  render() {
    const { isLoading, children } = this.props

    return (
      <div id='app'>
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
