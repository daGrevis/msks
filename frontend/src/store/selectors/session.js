import fp from 'lodash/fp'
import { createSelector } from 'reselect'

const sessionSelector = fp.get('session')

const hasSessionSelector = createSelector(
  sessionSelector,
  session => !!session,
)

export { sessionSelector, hasSessionSelector }
