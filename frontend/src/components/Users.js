import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { getLinkToSearchUser } from '../routing/links'
import { connectionSelector } from '../store/selectors/connections'
import { channelSelector } from '../store/selectors/channels'
import { groupedUsersSelector } from '../store/selectors/users'
import Nick from './Nick'

import '../styles/Users.css'

const UserList = ({ users, connection, channel }) => (
  <ol>
    {_.map(users, ({ id, nick, isOp, isVoiced }) => (
      <li key={id}>
        <Nick
          nick={nick}
          isOp={isOp}
          isVoiced={isVoiced}
          link={getLinkToSearchUser(
            connection.serverId,
            connection.nick,
            channel.name,
            nick,
          )}
        />
      </li>
    ))}
  </ol>
)

const Users = ({ groupedUsers, connection, channel }) => (
  <div id="users">
    <h3 className="strong">Users</h3>

    <UserList
      users={groupedUsers.op}
      connection={connection}
      channel={channel}
    />
    <UserList
      users={groupedUsers.voiced}
      connection={connection}
      channel={channel}
    />
    <UserList
      users={groupedUsers.normal}
      connection={connection}
      channel={channel}
    />
  </div>
)

const mapStateToProps = state => ({
  connection: connectionSelector(state),
  channel: channelSelector(state),
  groupedUsers: groupedUsersSelector(state),
})

export default connect(mapStateToProps)(Users)
