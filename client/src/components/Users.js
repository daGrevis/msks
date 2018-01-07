import _ from 'lodash'
import React from 'react'

import Nick from './Nick'

import '../styles/Users.css'

const UserList = ({ users, isOp, isVoiced, channel }) =>
  <ol>
    {_.map(users, ({ nick }) => (
      <li key={nick}>
        <Nick from={nick} to={channel.name} isOp={isOp} isVoiced={isVoiced} />
      </li>
    ))}
  </ol>

const Users = ({ groupedUsers, channel }) =>
  <div id='users'>
    <h3 className='strong'>Users</h3>

    <UserList isOp users={groupedUsers['op']} channel={channel} />
    <UserList isVoiced users={groupedUsers['voiced']} channel={channel} />
    <UserList users={groupedUsers['normal']} channel={channel} />
  </div>

export default Users
