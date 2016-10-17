import React from 'react'
import { connect } from 'react-redux'

import { isLoading } from '../selectors'
import App from '../components/App'

function mapStateToProps(state) {
  return {
    isLoading: isLoading(state),
  }
}

export default connect(mapStateToProps)(App)
