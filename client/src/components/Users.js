import _ from 'lodash'
import React from 'react'

import Nick from './Nick'

import '../styles/Users.css'

const UserList = ({ users, channel }) =>
  <ol>
    {_.map(users, ({ nick, isOp, isVoiced }) => (
      <li key={nick}>
        <Nick from={nick} to={channel.name} isOp={isOp} isVoiced={isVoiced} />
      </li>
    ))}
  </ol>

const Users = ({ groupedUsers, channel }) =>
  <div id='users'>
    <h3 className='strong'>Users</h3>

    <UserList users={groupedUsers['op']} channel={channel} />
    <UserList users={groupedUsers['voiced']} channel={channel} />
    <UserList users={groupedUsers['normal']} channel={channel} />
  </div>

export default Users
