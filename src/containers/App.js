import React from 'react'
import { connect } from 'react-redux'

import { loadMessages } from '../actions'
import App from '../components/App'

function mapStateToProps(state) {
  return {
  }
}

const actionCreators = {
  loadMessages,
}

export default connect(mapStateToProps, actionCreators)(App)
