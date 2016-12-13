import fp from 'lodash/fp'
import React from 'react'
import { connect } from 'react-redux'
import { NotificationStack } from 'react-notification'
import classNames from 'classnames'

import { isAppLoadingSelector, channelNameSelector } from '../selectors'
import { removeNotification } from '../actions'
import Maybe from '../components/Maybe'
import Loader from '../components/Loader'
import Front from './Front'
import Channel from './Channel'

import './App.css'

function App({ isAppLoading, channelName, notifications, removeNotification }) {
  const notifsWithClickEv = fp.map(notif => (
    fp.set('onClick', () => removeNotification(notif.key))(notif)
  ))(notifications)

  const classes = classNames({
    'is-loading': isAppLoading,
  })
  return (
    <div id='app' className={classes}>
      <Maybe when={isAppLoading}>
        <Loader />
      </Maybe>
      <Maybe when={!isAppLoading}>
        {channelName ? <Channel /> : <Front />}
      </Maybe>

      <NotificationStack
        notifications={notifsWithClickEv}
        onDismiss={notification => removeNotification(notification.key)}
        dismissAfter={2500}
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
