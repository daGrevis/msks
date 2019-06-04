import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

export default handleActions({
  'client/USER_CHANGES': ({ payload: { changes, isInitial } }) => state => {
    if (isInitial) {
      if (!changes.length) {
        return state
      }

      const { channelId } = changes[0].next
      return fp.pipe(
        fp.set(['users', channelId], fp.keyBy('id', fp.map('next', changes))),
        fp.set(['resetUsers', channelId], false),
      )(state)
    }

    return fp.reduce(
      (state, change) => {
        const user = change.next || change.prev
        const { channelId } = user

        return fp.pipe(
          fp.update(['users', channelId], prevUsers => {
            prevUsers =
              state.resetUsers[channelId] || isInitial ? {} : prevUsers

            const nextUsers = fp.reduce(
              (users, { next, prev }) =>
                next
                  ? fp.set([next.id], next, users)
                  : fp.unset([prev.id], users),
              prevUsers,
              changes,
            )

            return nextUsers
          }),
          fp.set(['resetUsers', channelId], false),
        )(state)
      },
      state,
      changes,
    )
  },
})
