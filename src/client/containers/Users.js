import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { sortedUsersSelector, userCountSelector } from '../selectors'
import { getColor } from '../colors'

import './Users.css'

const Users = ({ sortedUsers, userCount }) => (
  <div id='users'>
    <h3 className='bold'>Users ({userCount})</h3>

    <ol>
      {_.map(sortedUsers, nick => (
        <li
          key={nick}
          className='nick bold'
          style={{ color: getColor(nick) }}
          title={nick}
        >{nick}</li>
      ))}
    </ol>
  </div>
)

export default connect(
  state => ({
    sortedUsers: sortedUsersSelector(state),
    userCount: userCountSelector(state),
  })
)(Users)
