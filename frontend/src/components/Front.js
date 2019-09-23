import React from 'react'
import { connect } from 'react-redux'

import * as titles from '../env/titles'
import { setTitle } from '../store/actions/app'
import { logout } from '../store/actions/session'
import { getLinkToFront, getLinkToLogin } from '../routing/links'
import { routeSelector } from '../store/selectors/router'
import { hasSessionSelector } from '../store/selectors/session'
import Link from './Link'
import Version from './Version'
import Login from './Login'
import GroupedChannels from './GroupedChannels'

import '../styles/Front.css'

class Front extends React.Component {
  componentWillMount() {
    this.props.setTitle(titles.getIndexTitle())
  }

  render() {
    const isLogin = this.props.route.query.login !== undefined

    return (
      <div id="front">
        <div className="logo">
          <Link href={getLinkToFront()}>
            <h1>msks</h1>
          </Link>
          <Version />
        </div>

        {this.props.hasSession ? (
          <Link
            className="logout-icon"
            onClick={() => {
              this.props.logout()
            }}
          >
            <svg>
              <use xlinkHref="#logout-svg" />
            </svg>
          </Link>
        ) : (
          <Link
            className="login-icon"
            href={isLogin ? getLinkToFront() : getLinkToLogin()}
          >
            <svg>
              <use xlinkHref="#login-svg" />
            </svg>
          </Link>
        )}

        {isLogin ? <Login /> : <GroupedChannels />}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  connections: state.connections,
  route: routeSelector(state),
  hasSession: hasSessionSelector(state),
})

const mapDispatchToProps = {
  setTitle,
  logout,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Front)
