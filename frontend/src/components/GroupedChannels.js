import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import { getLinkToChannel } from '../routing/links'
import { hasSessionSelector } from '../store/selectors/session'
import { groupedChannelsByConnectionSelector } from '../store/selectors/channels'
import Link from './Link'
import ServerId from './ServerId'
import ChannelName from './ChannelName'
import Scroller from './Scroller'

const GroupedChannels = ({
  hasSession,
  connections,
  groupedChannelsByConnection,
}) => (
  <Scroller id="front">
    {_.map(groupedChannelsByConnection, ([connectionId, channels]) => {
      const connection = connections[connectionId]
      return (
        <div key={connectionId} className="connection">
          <div className="name">
            <Link
              href={
                !hasSession
                  ? null
                  : getLinkToChannel(connection.serverId, connection.nick, '*')
              }
            >
              <ServerId connection={connection} />
            </Link>
          </div>

          <div className="sharedChannels">
            {_.map(channels.shared, channel => (
              <div key={channel.id} className="channel isShared">
                <Link
                  href={getLinkToChannel(
                    connection.serverId,
                    hasSession && connection.nick,
                    channel.name,
                  )}
                >
                  <ChannelName connection={connection} channel={channel} />
                </Link>
              </div>
            ))}
          </div>

          <div className="userChannels">
            {_.map(channels.user, channel => (
              <div key={channel.id} className="channel isUser">
                <Link
                  href={getLinkToChannel(
                    connection.serverId,
                    hasSession && connection.nick,
                    channel.name,
                  )}
                >
                  <ChannelName connection={connection} channel={channel} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )
    })}
  </Scroller>
)

const mapStateToProps = state => ({
  connections: state.connections,
  hasSession: hasSessionSelector(state),
  groupedChannelsByConnection: groupedChannelsByConnectionSelector(state),
})

export default connect(mapStateToProps)(GroupedChannels)
