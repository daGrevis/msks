import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { isAppLoadingSelector } from '../store/selectors/app'
import NotFound from './NotFound'
import Loader from './Loader'
import Front from './Front'
import Channel from './Channel'

import '../styles/App.css'

const App = props => {
  const { route, isBroken, isAppLoading } = props

  const { meta } = route

  let Screen = NotFound
  if (meta.isFront) {
    Screen = Front
  } else if (meta.isChannel) {
    Screen = Channel
  }

  const classes = classNames({
    'is-broken': isBroken,
    'is-loading': isAppLoading,
  })

  return (
    <div id="app" className={classes}>
      {isAppLoading ? <Loader /> : <Screen />}
    </div>
  )
}

const mapStateToProps = state => ({
  route: state.route,
  isBroken: state.isBroken,
  isAppLoading: isAppLoadingSelector(state),
})

export default connect(mapStateToProps)(App)
