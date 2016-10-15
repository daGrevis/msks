import fp from 'lodash/fp'
import { createSelector } from 'reselect'

const messages = state => state.messages

const sortedMessages = createSelector(
  [messages],
  messages => fp.sortBy('timestamp', messages)
)

export {
  messages,
  sortedMessages,
}
