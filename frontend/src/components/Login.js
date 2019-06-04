import fp from 'lodash/fp'
import React from 'react'
import { connect } from 'react-redux'

import { push } from '../store/actions/router'
import { login } from '../store/actions/session'

import '../styles/Login.css'

class Login extends React.Component {
  usernameNode = null

  state = {
    values: {
      username: '',
      password: '',
    },
    errors: {},
  }

  componentDidMount() {
    this.usernameNode.focus()
  }

  setValue = (field, value) => {
    this.setState(
      fp.pipe(
        fp.set(['values', field], value),
        fp.unset(['errors', field]),
      ),
    )
  }

  render() {
    const { username, password } = this.state.values
    const { errors } = this.state

    return (
      <div id="login">
        <form>
          <div className="field">
            <input
              ref={node => {
                this.usernameNode = node
              }}
              type="text"
              className="username"
              placeholder="Username"
              value={username}
              onChange={ev => {
                this.setValue('username', ev.target.value)
              }}
              autoComplete="username"
              autoCapitalize="off"
            />
            {errors.username && (
              <div className="error-message">{errors.username}</div>
            )}
          </div>

          <div className="field">
            <input
              type="password"
              className="password"
              placeholder="Password"
              value={password}
              onChange={ev => {
                this.setValue('password', ev.target.value)
              }}
              autoComplete="password"
            />
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <button
            type="submit"
            onClick={async ev => {
              ev.preventDefault()

              const { session, errors } = await this.props.login({
                username,
                password,
              })

              if (session) {
                this.props.push('/')
              } else {
                this.setState(
                  fp.pipe(
                    fp.set(['values', 'password'], ''),
                    fp.set('errors', errors),
                  ),
                )
              }
            }}
          >
            Login
          </button>
        </form>
      </div>
    )
  }
}

const mapDispatchToProps = {
  login,
  push,
}

export default connect(
  null,
  mapDispatchToProps,
)(Login)
