import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { isAppLoadingSelector } from '../selectors'
import Loader from '../components/Loader'

import '../styles/App.css'

const App = ({ isBroken, isAppLoading, children }) => {
  const classes = classNames({
    'is-broken': isBroken,
    'is-loading': isAppLoading,
  })

  return (
    <div id='app' className={classes}>
      {isAppLoading ? <Loader /> : children}
    </div>
  )
}

const mapStateToProps = state => ({
  isBroken: state.isBroken,
  isAppLoading: isAppLoadingSelector(state),
})

export default connect(mapStateToProps)(App)
