import _ from 'lodash'
import React, { Component } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import { navigate } from '../history'
import { subscribeToUsers, toggleSearch, inputSearch } from '../actions'
import {
  isEmbedSelector,
  userCountSelector, groupedUsersSelector,
  isSearchOpenSelector, searchQuerySelector,
} from '../selectors'
import Maybe from '../components/Maybe'
import Text from '../components/Text'
import Messages from '../components/Messages'
import Users from './Users'
import SearchInput from './SearchInput'

import '../styles/Channel.css'
import searchIconSvg from '../styles/search-icon.svg'

class Channel extends Component {
  state = {
    isTopicClipped: true,
    isSidebarOpen: false,
  }

  onHamburgerIconClick = () => {
    this.setState({ isSidebarOpen: !this.state.isSidebarOpen })
  }

  onSearchIconClick = () => {
    this.props.toggleSearch()
  }

  onNameClick = () => {
    const { isEmbed, channel, messageId, isSearchOpen } = this.props

    if (isEmbed) {
      navigate('')
    } else {
      navigate(messageId || isSearchOpen ? channel.name : '')
    }
  }

  onTopicClick = () => {
    this.setState({ isTopicClipped: !this.state.isTopicClipped })
  }

  componentDidMount() {
    if (!this.props.isSubscribedToUsers) {
      this.props.subscribeToUsers({ channelName: this.props.channel.name })
    }
  }

  render() {
    const sidebarClasses = classNames('sidebar', {
      'is-open': this.state.isSidebarOpen,
    })
    const contentClasses = classNames('content', {
      'is-open': this.state.isSidebarOpen,
    })
    const hamburgerClasses = classNames('hamburger-icon hamburger hamburger--squeeze', {
      'is-active': this.state.isSidebarOpen,
    })
    const nameClasses = classNames('name strong', {
      'is-embed': this.props.isEmbed,
    })
    const topicClasses = classNames('topic', {
      'is-topic-clipped': this.state.isTopicClipped,
    })

    return (
      <div id='channel'>
        <div className={contentClasses}>
          <div className='header'>
            <div className={hamburgerClasses} onClick={this.onHamburgerIconClick}>
              <div className='hamburger-box'>
                <div className='hamburger-inner'></div>
              </div>
            </div>
            <div className='search-icon' onClick={this.onSearchIconClick}>
              <img src={searchIconSvg} alt='' />
            </div>

            <h2 className={nameClasses} onClick={this.onNameClick}>
              {this.props.channel.name}
            </h2>
            <span className='user-count'>[ {this.props.userCount || '—'} ]</span>

            <Maybe when={this.props.channel.topic}>
              <div className={topicClasses} onClick={this.onTopicClick}>
                <Text>{this.props.channel.topic}</Text>
              </div>
            </Maybe>
          </div>

          <Messages messageId={this.props.messageId} />

          {this.props.isSearchOpen ?
            <SearchInput
              query={this.props.searchQuery}
              inputSearch={this.props.inputSearch}
            />
            : null}
        </div>

        <div className={sidebarClasses}>
          <Users groupedUsers={this.props.groupedUsers} />
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, props) => {
  const { channelName } = state

  return {
    messageId: props.messageId,

    isEmbed: isEmbedSelector(state),
    isSubscribedToUsers: state.isSubscribedToUsers[channelName],
    channel: state.channels[channelName],
    groupedUsers: groupedUsersSelector(state),
    userCount: userCountSelector(state),
    isSearchOpen: isSearchOpenSelector(state),
    searchQuery: searchQuerySelector(state),
  }
}

const mapDispatchToProps = {
  subscribeToUsers,
  toggleSearch,
  inputSearch,
}

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
