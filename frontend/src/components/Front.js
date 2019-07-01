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
import loginSvg from '../vectors/login.svg'
import logoutSvg from '../vectors/logout.svg'

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
            onClick={() => {
              this.props.logout()
            }}
          >
            <img className="logout-icon" src={logoutSvg} alt="" />
          </Link>
        ) : (
          <Link href={isLogin ? getLinkToFront() : getLinkToLogin()}>
            <img className="login-icon" src={loginSvg} alt="" />
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
