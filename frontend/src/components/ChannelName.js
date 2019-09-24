import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { getNickColor } from '../irc/colors'
import { createIsChannelDisabledSelector } from '../store/selectors/channels'
import Nick from './Nick'

import '../styles/ChannelName.css'

const ChannelName = ({ connection, channel, isDisabled, noUnread }) => {
  const name = channel.type === 'server' ? connection.serverId : channel.name

  let prefix
  let root = name

  if (channel.type === 'shared') {
    const splits = name.split(/([#&]+)/, 3)

    prefix = splits[1]
    root = splits[2]

    if (!root) {
      prefix = ''
      root = splits[0]
    }
  }

  if (channel.type === 'user') {
    prefix = (
      <span
        className="userDot"
        style={{
          background: connection.isConnected && getNickColor(channel.name),
        }}
      />
    )
    root = <Nick nick={channel.name} noColor={!connection.isConnected} />
  }

  return (
    <div
      className={classNames('ChannelName strong', {
        isDisabled,
      })}
    >
      {prefix && <span className="prefix">{prefix}</span>}
      {root}

      {!noUnread && channel.unread > 0 && (
        <span className="unread">{`(${channel.unread})`}</span>
      )}
    </div>
  )
}

const mapStateToProps = (state, ownProps) => ({
  isDisabled: createIsChannelDisabledSelector(
    ownProps.connection,
    ownProps.channel,
  )(state),
})

export default connect(mapStateToProps)(ChannelName)
