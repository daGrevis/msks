import _ from 'lodash'
import React from 'react'

import Nick from './Nick'

import '../styles/Users.css'

const UserList = ({ users, isOp, isVoiced }) =>
  <ol>
    {_.map(users, ({ nick }) => (
      <li key={nick}>
        <Nick from={nick} isOp={isOp} isVoiced={isVoiced} />
      </li>
    ))}
  </ol>

const Users = ({ groupedUsers }) =>
  <div id='users'>
    <h3 className='strong'>Users</h3>

    <UserList users={groupedUsers['op']} isOp />
    <UserList users={groupedUsers['voiced']} isVoiced />
    <UserList users={groupedUsers['normal']} />
  </div>

export default Users
