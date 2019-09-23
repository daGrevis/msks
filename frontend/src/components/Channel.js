import React, { Fragment } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import config from '../env/config'
import { getMessageTitle, getChannelTitle } from '../env/titles'
import {
  getLinkToFront,
  getLinkToChannel,
  getLinkToSearch,
} from '../routing/links'
import { setTitle } from '../store/actions/app'
import { push } from '../store/actions/router'
import { readChannel } from '../store/actions/channels'
import {
  subscribeToMessages,
  subscribeToUsers,
} from '../store/actions/subscriptions'
import { inputSearch } from '../store/actions/search'
import { channelNameSelector } from '../store/selectors/router'
import { leaveArchive } from '../store/actions/messages'
import { hasSessionSelector } from '../store/selectors/session'
import { connectionSelector } from '../store/selectors/connections'
import { channelSelector } from '../store/selectors/channels'
import {
  isViewingArchiveSelector,
  activeMessageSelector,
} from '../store/selectors/messages'
import {
  isSearchOpenSelector,
  searchQuerySelector,
} from '../store/selectors/search'
import { userCountSelector } from '../store/selectors/users'
import Text from './Text'
import Link from './Link'
import Messages from './Messages'
import MessageInput from './MessageInput'
import SearchMessages from './SearchMessages'
import SearchInput from './SearchInput'
import Users from './Users'
import ChannelName from './ChannelName'

import '../styles/Channel.css'

class Channel extends React.Component {
  state = {
    isTopicClipped: true,
    isSidebarOpen: false,
  }

  componentDidRender() {
    const { connection, channel, activeMessage } = this.props

    if (this.props.activeMessage) {
      this.props.setTitle(getMessageTitle(activeMessage))
    } else if (channel) {
      this.props.setTitle(getChannelTitle(connection, channel))
    }

    if (channel) {
      this.props.subscribeToMessages(channel.id)
      this.props.subscribeToUsers(channel.id)

      this.props.readChannel(channel)
    }
  }

  componentDidMount() {
    this.componentDidRender()
  }

  componentDidUpdate() {
    this.componentDidRender()
  }

  onNameClick = () => {
    const { channel, connection, isSearchOpen, hasSession, push } = this.props

    if (config.isPublicEmbed) {
      push(getLinkToFront())
    } else {
      if (isSearchOpen) {
        push(
          getLinkToChannel(
            connection.serverId,
            hasSession && connection.nick,
            channel.name,
          ),
        )
      } else {
        push('/')
      }
    }
  }

  onSearchIconClick = () => {
    const { isSearchOpen, connection, channel, hasSession, push } = this.props

    if (!isSearchOpen) {
      push(
        getLinkToSearch(
          connection.serverId,
          hasSession && connection.nick,
          channel.name,
        ),
      )
    } else {
      push(
        getLinkToChannel(
          connection.serverId,
          hasSession && connection.nick,
          channel.name,
        ),
      )
    }

    this.setState({ isSidebarOpen: false })
  }

  onHamburgerIconClick = () => {
    this.setState(prevState => ({
      isSidebarOpen: !prevState.isSidebarOpen,
    }))
  }

  onTopicClick = () => {
    this.setState(prevState => ({
      ...prevState,
      isTopicClipped: !prevState.isTopicClipped,
    }))
  }

  onSidebarClick = () => {
    this.setState({ isSidebarOpen: false })
  }

  render() {
    const {
      connection,
      channel,
      channelName,
      hasSession,
      isViewingArchive,
      userCount,
      isSearchOpen,
      searchQuery,
    } = this.props

    const hasMessageInput = hasSession && !isViewingArchive
    const hasSidebar = channel && channel.type === 'shared'

    return (
      <div
        id="channel"
        className={classNames({
          'is-sidebar-open': this.state.isSidebarOpen,
          'is-sidebar-closed': !this.state.isSidebarOpen,
        })}
      >
        <div className="content">
          <div className="header">
            <div className="main">
              <div className="info">
                <Link onClick={this.onNameClick}>
                  <ChannelName
                    connection={connection}
                    channel={
                      channel || {
                        name: channelName,
                        type: channelName[0] === '#' ? 'shared' : 'user',
                      }
                    }
                    noUnread
                  />
                </Link>

                {channel && channel.type === 'shared' && (
                  <span className="user-count">
                    {`[ ${userCount || '—'} ]`}
                  </span>
                )}
              </div>

              <div className="icons">
                {channel && (
                  <Link
                    className="search-icon"
                    onClick={this.onSearchIconClick}
                  >
                    <svg>
                      <use xlinkHref="#search-svg" />
                    </svg>
                  </Link>
                )}

                {channel && channel.type === 'shared' && (
                  <div
                    className={classNames(
                      'hamburger-icon hamburger hamburger--squeeze',
                      {
                        'is-active': this.state.isSidebarOpen,
                      },
                    )}
                    onClick={this.onHamburgerIconClick}
                  >
                    <span className="hamburger-box">
                      <span className="hamburger-inner" />
                    </span>
                  </div>
                )}
              </div>
            </div>

            {channel && channel.topic && (
              <div
                className={classNames('topic', {
                  'is-topic-clipped': this.state.isTopicClipped,
                })}
                onClick={this.onTopicClick}
              >
                <div>
                  <Text>{channel.topic}</Text>
                </div>
              </div>
            )}
          </div>

          {isSearchOpen ? (
            <Fragment>
              <SearchMessages />
              <SearchInput
                query={searchQuery}
                inputSearch={this.props.inputSearch}
              />
            </Fragment>
          ) : (
            <Fragment>
              <Messages />
              <MessageInput isEnabled={hasMessageInput} />

              {isViewingArchive && (
                <div
                  className={classNames('scroll-down-icon', {
                    'has-message-input': hasMessageInput,
                    'has-sidebar': hasSidebar,
                  })}
                  onClick={() => {
                    this.props.leaveArchive()
                  }}
                >
                  <svg>
                    <use xlinkHref="#scroll-down-svg" />
                  </svg>
                </div>
              )}
            </Fragment>
          )}
        </div>

        {hasSidebar && (
          <div className="sidebar" onClick={this.onSidebarClick}>
            <Users />
          </div>
        )}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  connection: connectionSelector(state),
  channel: channelSelector(state),
  channelName: channelNameSelector(state),
  hasSession: hasSessionSelector(state),
  isViewingArchive: isViewingArchiveSelector(state),
  activeMessage: activeMessageSelector(state),
  userCount: userCountSelector(state),
  isSearchOpen: isSearchOpenSelector(state),
  searchQuery: searchQuerySelector(state),
})

const mapDispatchToProps = {
  push,
  setTitle,
  subscribeToMessages,
  subscribeToUsers,
  inputSearch,
  leaveArchive,
  readChannel,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Channel)
