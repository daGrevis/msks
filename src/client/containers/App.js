import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { isAppLoadingSelector } from '../selectors'
import Loader from '../components/Loader'

import './App.css'

const App = ({ isAppLoading, children }) => {
  const classes = classNames({
    'is-loading': isAppLoading,
  })

  return (
    <div id='app' className={classes}>
      {isAppLoading ? <Loader /> : children}
    </div>
  )
}

const mapStateToProps = state => ({
  isAppLoading: isAppLoadingSelector(state),
})

export default connect(mapStateToProps)(App)
