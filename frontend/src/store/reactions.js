import fp from 'lodash/fp'
import Push from 'push.js'

import { getLinkToChannel, getLinkToMessage } from '../routing/links'
import { hasSessionSelector } from './selectors/session'
import { connectionSelector } from './selectors/connections'
import { channelSelector } from './selectors/channels'
import { isViewingArchiveSelector } from './selectors/messages'
import { push, replace } from './actions/router'
import { autoSubscribe } from './actions/subscriptions'
import { setFaviconBadge } from './actions/favicon'

export default {
  'client/SOCKET_AUTHENTICATED': () => dispatch => {
    dispatch(autoSubscribe())
  },

  'client/CHANNEL_CHANGES': payload => (dispatch, getState) => {
    const state = getState()

    const connection = connectionSelector(state)
    const channel = channelSelector(state)

    for (const { prev, next } of payload.changes) {
      // Update link to current channel when name changes.
      if (
        channel &&
        channel.id === next.id &&
        prev &&
        prev.name !== next.name
      ) {
        dispatch(
          replace(
            getLinkToChannel(connection.serverId, connection.nick, next.name),
          ),
        )
      }
    }
  },

  'client/MESSAGE_CHANGES': payload => (dispatch, getState) => {
    const state = getState()

    const connection = connectionSelector(state)
    const channel = channelSelector(state)
    const hasSession = hasSessionSelector(state)

    for (const { next: message } of payload.changes) {
      const messageChannel = state.channels[message.channelId]

      if (!messageChannel) {
        continue
      }

      const messageConnection = state.connections[messageChannel.connectionId]

      if (!messageConnection) {
        continue
      }

      if (message.isNotification) {
        const shouldNotify =
          !channel ||
          (channel && (channel.id !== message.channelId || !state.isVisible))

        if (shouldNotify) {
          Push.create(message.nick, {
            body: message.text,
            onClick: function() {
              this.close()

              dispatch(
                push(
                  getLinkToMessage(
                    messageConnection.serverId,
                    hasSession && messageConnection.nick,
                    messageChannel.name,
                    message.id,
                  ),
                ),
              )
            },
          })
        }
      }

      if (!channel) {
        continue
      }

      if (messageConnection.id !== connection.id) {
        continue
      }

      // Mirror all status messages to current channel.
      if (
        (message.type === 'status' || message.type === 'banlist') &&
        channel.type !== 'server'
      ) {
        const isViewingArchive = isViewingArchiveSelector(state)

        if (!isViewingArchive) {
          dispatch({
            type: 'APPEND_MESSAGE',
            payload: {
              channel,
              message,
            },
          })
        }
      }

      // Increase unread favicon badge for certain messages.
      if (
        !state.isVisible &&
        messageChannel.id === channel.id &&
        fp.includes(message.type, [
          'text',
          'notice',
          'action',
          'kick',
          'topic',
          'mode',
          'status',
        ])
      ) {
        dispatch({
          type: 'INCREASE_UNREAD',
        })
        dispatch(setFaviconBadge())
      }
    }
  },
}
