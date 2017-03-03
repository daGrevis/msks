import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { groupedUsersSelector, userCountSelector } from '../selectors'
import { getColor } from '../colors'

import './Users.css'

const UserList = ({ users, isOp, isVoiced }) =>
  <ol>
    {_.map(users, ({ nick }) => (
      <li
        key={nick}
        className='nick bold'
        style={{ color: getColor(nick) }}
        title={nick}
      >
        <span className='prefix'>{(isOp ? '@' : '') + (isVoiced ? '+' : '')}</span>
        {nick}
      </li>
    ))}
  </ol>

const Users = ({ groupedUsers, userCount }) =>
  <div id='users'>
    <h3 className='bold'>Users ({userCount})</h3>

    <UserList users={groupedUsers['op']} isOp />
    <UserList users={groupedUsers['voiced']} isVoiced />
    <UserList users={groupedUsers['normal']} />
  </div>

export default connect(
  state => ({
    groupedUsers: groupedUsersSelector(state),
    userCount: userCountSelector(state),
  })
)(Users)
