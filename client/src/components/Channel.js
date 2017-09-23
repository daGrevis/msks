import _ from 'lodash'
import React from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import config from '../config'
import { navigate } from '../history'
import { subscribeToUsers, toggleSearch, inputSearch } from '../actions'
import {
  routeSelector, channelSelector, userCountSelector, groupedUsersSelector,
  isSearchOpenSelector, searchQuerySelector, activeMessageSelector,
} from '../selectors'
import Maybe from '../components/Maybe'
import Text from '../components/Text'
import Messages from '../components/Messages'
import SearchMessages from '../components/SearchMessages'
import SearchInput from './SearchInput'
import Users from './Users'

import '../styles/Channel.css'
import searchIconSvg from '../styles/search-icon.svg'

class Channel extends React.Component {
  state = {
    isTopicClipped: true,
    isSidebarOpen: false,
  }

  componentDidMount() {
    this.props.subscribeToUsers(this.props.channel.name)
  }

  onHamburgerIconClick = () => {
    this.setState({ isSidebarOpen: !this.state.isSidebarOpen })
  }

  onSearchIconClick = () => {
    this.props.toggleSearch()
  }

  onNameClick = () => {
    const { channel, activeMessage, isSearchOpen } = this.props

    if (config.embedChannel) {
      navigate('')
    } else {
      if (activeMessage || isSearchOpen) {
        navigate(channel.name)
      } else {
        navigate('')
      }
    }
  }

  onTopicClick = () => {
    this.setState({ isTopicClipped: !this.state.isTopicClipped })
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
      'is-embed': config.embedChannel,
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

          {this.props.isSearchOpen
            ? <SearchMessages />
            : <Messages />}

          {this.props.isSearchOpen
            ? <SearchInput query={this.props.searchQuery} inputSearch={this.props.inputSearch} />
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
  return {
    isSubscribedToUsers: state.isSubscribedToUsers[state.channelName],
    channel: channelSelector(state),
    route: routeSelector(state),
    groupedUsers: groupedUsersSelector(state),
    userCount: userCountSelector(state),
    isSearchOpen: isSearchOpenSelector(state),
    searchQuery: searchQuerySelector(state),
    activeMessage: activeMessageSelector(state),
  }
}

const mapDispatchToProps = {
  subscribeToUsers,
  toggleSearch,
  inputSearch,
}

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
