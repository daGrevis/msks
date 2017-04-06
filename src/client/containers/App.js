import fp from 'lodash/fp'
import React from 'react'
import { connect } from 'react-redux'
import { NotificationStack } from 'react-notification'
import classNames from 'classnames'

import { isAppLoadingSelector, channelNameSelector } from '../selectors'
import { removeNotification } from '../actions'
import Users from './Users'
import Front from './Front'
import Channel from './Channel'
import Loader from '../components/Loader'

import './App.css'

function App({ isAppLoading, channelName, notifications, removeNotification }) {
  const notifsWithClickEv = fp.map(notif => (
    fp.set('onClick', () => removeNotification(notif.key))(notif)
  ))(notifications)

  const isChannelOpen = !!channelName
  const Screen = isChannelOpen ? Channel : Front

  const classes = classNames({
    'is-loading': isAppLoading,
  })
  return (
    <div id='app' className={classes}>
      <div id='slideout-menu'>
        {!isAppLoading && isChannelOpen ? <Users /> : null}
      </div>

      <div id='slideout-panel'>
        {!isAppLoading ? <Screen /> : <Loader />}
      </div>

      <NotificationStack
        notifications={notifsWithClickEv}
        onDismiss={notification => removeNotification(notification.key)}
        dismissAfter={6000000}
        action='Dismiss'
      />
    </div>
  )
}

function mapStateToProps(state) {
  return {
    isAppLoading: isAppLoadingSelector(state),
    channelName: channelNameSelector(state),
    notifications: state.notifications,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    removeNotification: key => dispatch(removeNotification(key)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
