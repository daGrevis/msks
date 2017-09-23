import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { isAppLoadingSelector } from '../selectors'
import NotFound from './NotFound'
import Loader from './Loader'
import Front from './Front'
import Channel from './Channel'

import '../styles/App.css'

const App = props => {
  let Screen = NotFound

  if (props.route.meta.isFront) {
    Screen = Front
  }
  if (props.route.meta.isChannel) {
    Screen = Channel
  }

  const classes = classNames({
    'is-broken': props.isBroken,
    'is-loading': props.isAppLoading,
  })

  return (
    <div id='app' className={classes}>
      {props.isAppLoading ? <Loader /> : <Screen />}
    </div>
  )
}

const mapStateToProps = state => ({
  route: state.route,
  isBroken: state.isBroken,
  isAppLoading: isAppLoadingSelector(state),
})

export default connect(mapStateToProps)(App)
