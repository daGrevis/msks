import _ from 'lodash'
import React, { Component } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import { navigate } from '../history'
import { setTitle, setScrollPosition, loadMessages, subscribeToUsers } from '../actions'
import {
  isEmbedSelector, messagesSelector, hasReachedBeginningSelector,
  usersSelector, userCountSelector, groupedUsersSelector,
} from '../selectors'
import Maybe from '../components/Maybe'
import Text from '../components/Text'
import Messages from '../components/Messages'
import Users from './Users'

import '../styles/Channel.css'

class Channel extends Component {
  state = {
    isTopicClipped: true,
    isSidebarOpen: false,
  }

  onHamburgerClick = () => {
    this.setState({ isSidebarOpen: !this.state.isSidebarOpen })
  }

  onNameClick = () => {
    if (this.props.isEmbed) {
      return
    }

    navigate('')
  }

  onTopicClick = () => {
    this.setState({ isTopicClipped: !this.state.isTopicClipped })
  }

  componentDidMount() {
    this.props.setTitle(`${this.props.channel.name} · msks`)

    if (!this.props.isSubscribedToUsers) {
      this.props.subscribeToUsers({ channelName: this.props.channel.name })
    }
  }

  render() {
    const { isEmbed, channel, userCount, groupedUsers } = this.props

    const sidebarClasses = classNames('sidebar', {
      'is-open': this.state.isSidebarOpen,
    })
    const contentClasses = classNames('content', {
      'is-open': this.state.isSidebarOpen,
    })
    const hamburgerClasses = classNames('hamburger hamburger--squeeze', {
      'is-active': this.state.isSidebarOpen,
    })
    const nameClasses = classNames('name strong', {
      'is-embed': isEmbed,
    })
    const topicClasses = classNames('topic', {
      'is-topic-clipped': this.state.isTopicClipped,
    })

    return (
      <div id='channel'>
        <div className={contentClasses}>
          <div className='header'>
            <div className={hamburgerClasses} onClick={this.onHamburgerClick}>
              <div className='hamburger-box'>
                <div className='hamburger-inner'></div>
              </div>
            </div>

            <h2 className={nameClasses} onClick={this.onNameClick}>{channel.name}</h2>
            <span className='user-count'>[ {userCount || '—'} ]</span>

            <Maybe when={channel.topic}>
              <div className={topicClasses} onClick={this.onTopicClick}>
                <Text>{channel.topic}</Text>
              </div>
            </Maybe>
          </div>

          <Messages {...this.props} />
        </div>

        <div className={sidebarClasses}>
          <Users groupedUsers={groupedUsers} />
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, props) => {
  const { channelName } = state
  return {
    isEmbed: isEmbedSelector(state),
    channel: state.channels[channelName],
    messages: messagesSelector(state),
    scrollPosition: state.scrollPositions[channelName],
    hasReachedBeginning: hasReachedBeginningSelector(state),
    isSubscribedToMessages: state.isSubscribedToMessages[channelName],
    isSubscribedToUsers: state.isSubscribedToUsers[channelName],
    users: usersSelector(state),
    userCount: userCountSelector(state),
    groupedUsers: groupedUsersSelector(state),
    ...props,
  }
}

const mapDispatchToProps = {
  setTitle,
  setScrollPosition,
  loadMessages,
  subscribeToUsers,
}

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
