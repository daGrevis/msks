import fp from 'lodash/fp'
import { createSelector } from 'reselect'

import { connectionSelector } from './connections'
import { channelSelector } from './channels'

const allUsersSelector = state => state.users

const usersSelector = createSelector(
  allUsersSelector,
  channelSelector,
  (allUsers, channel) => (channel ? allUsers[channel.id] : undefined),
)

const userCountSelector = createSelector(
  usersSelector,
  fp.size,
)

const groupedUsersSelector = createSelector(
  usersSelector,
  fp.pipe(
    fp.groupBy(({ isOp, isVoiced }) => {
      if (isOp) return 'op'
      if (isVoiced) return 'voiced'
      return 'normal'
    }),
    fp.mapValues(
      fp.sortBy(({ nick, isOp, isVoiced }) => [
        // Voiced OPs at the end.
        isOp && isVoiced ? 1 : 0,
        // Ignore case.
        fp.toUpper(nick),
      ]),
    ),
  ),
)

const channelUserSelector = createSelector(
  usersSelector,
  connectionSelector,
  (users, connection) =>
    connection && fp.find({ nick: connection.nick }, users),
)

export {
  allUsersSelector,
  usersSelector,
  userCountSelector,
  groupedUsersSelector,
  channelUserSelector,
}
