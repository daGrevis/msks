import fp from 'lodash/fp'
import { handleActions } from 'redux-fp'

export default handleActions({
  GET_MESSAGES: ({ payload: { query } }) =>
    fp.set(['isLoadingMessages', query.channelId], true),

  SET_MESSAGES: ({ payload: { query, messages } }) =>
    fp.pipe(
      fp.update(['messages', query.channelId], currentMessages =>
        fp.uniqBy('id', fp.concat(currentMessages || [], messages)),
      ),
      fp.set(['isLoadingMessages', query.channelId], false),
      fp.set(['isViewingArchive', query.channelId], false),
      fp.set(['hasReachedBeginning', query.channelId], fp.isEmpty(messages)),
    ),

  SET_MESSAGES_BEFORE: ({ payload: { query, messages } }) =>
    fp.pipe(
      fp.update(['messages', query.channelId], currentMessages =>
        fp.concat(messages, currentMessages),
      ),
      fp.set(['hasReachedBeginning', query.channelId], fp.isEmpty(messages)),
    ),

  SET_MESSAGES_AFTER: ({ payload: { query, messages } }) =>
    fp.pipe(
      fp.update(['messages', query.channelId], currentMessages => {
        // For some reason, on rare occasions, SET_MESSAGES_AFTER action is dispatched twice when reconnecting.
        // It should not happen and I can't reproduce it. Nevertheless, it happens.
        // Quick-fix below should prevent duplicate messages.
        const firstMessage = messages.length ? messages[0] : null
        if (firstMessage && fp.find({ id: firstMessage.id }, currentMessages)) {
          return currentMessages
        }

        return fp.concat(currentMessages, messages)
      }),
      fp.set(['isViewingArchive', query.channelId], !fp.isEmpty(messages)),
    ),

  GET_MESSAGES_AROUND: ({ payload: { query } }) => state =>
    fp.pipe(
      fp.unset(['messages', query.channelId]),
      fp.unset(['scrollPositions', `messages.${query.channelId}`]),
    )(state),

  SET_MESSAGES_AROUND: ({ payload: { query, messages } }) =>
    fp.pipe(
      fp.set(['messages', query.channelId], messages),
      fp.set(['isViewingArchive', query.channelId], true),
    ),

  'client/MESSAGE_CHANGES': ({ payload: { changes } }) => state =>
    fp.reduce(
      (state, change) => {
        if (change.prev || !change.next) {
          // Update and delete is not handled.
          return state
        }

        const message = change.next
        const { channelId } = message

        if (state.isViewingArchive[channelId]) {
          return state
        }

        const prevMessages = state.messages[channelId]

        // Don't update unless channel has been opened already.
        if (prevMessages === undefined) {
          return state
        }

        // Message can already be there.
        if (fp.find({ id: message.id }, prevMessages)) {
          return state
        }

        // Message order is not guaranteed.
        const messageDatetime = Date.parse(message.createdAt)
        const newerMessages = fp.takeRightWhile(
          m => Date.parse(m.createdAt) > messageDatetime,
          prevMessages,
        )

        return fp.update(
          ['messages', channelId],
          messages => {
            const nextMessages = fp.isEmpty(newerMessages)
              ? // If there are no newer messages, append it.
                fp.concat(messages, message)
              : // If there are newer messages, insert the message in right place.
                fp.concat(
                  messages.slice(0, messages.length - newerMessages.length),
                  fp.concat(message, newerMessages),
                )

            const optimisticMessage = fp.findLast(
              {
                isOptimistic: true,
                nick: message.nick,
                text: message.text,
              },
              nextMessages,
            )

            if (optimisticMessage) {
              return fp.reject({ id: optimisticMessage.id }, nextMessages)
            }

            return nextMessages
          },
          state,
        )
      },
      state,
      changes,
    ),

  APPEND_MESSAGE: ({ payload: { channel, message } }) =>
    fp.update(['messages', channel.id], messages =>
      fp.concat(messages || [], message),
    ),

  LEAVE_ARCHIVE: ({ payload: { channel } }) =>
    fp.pipe(
      fp.unset(['messages', channel.id]),
      fp.set(['isViewingArchive', channel.id], false),
      fp.set(['hasReachedBeginning', channel.id], false),
    ),

  PUSH_MESSAGE_INPUT_HISTORY: ({ payload: { text } }) =>
    fp.update('messageInputHistory', fp.concat(text)),
})
