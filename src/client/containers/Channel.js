import _ from 'lodash'
import React, { Component } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'
import Slideout from 'slideout'

import {
  isEmbedSelector, getChannelSelector, getMessagesSelector,
  hasReachedBeginningSelector, isSubscribedToMessagesSelector,
} from '../selectors'
import { loadMessages, closeChannel } from '../actions'
import Maybe from '../components/Maybe'
import Text from '../components/Text'
import Messages from '../components/Messages'

import './Channel.css'

class Channel extends Component {
  wrapperNode = null
  slideout = null

  autoScroll = true
  persistScroll = false
  scrollHeight = 0
  scrollTop = 0

  state = {
    isTopicClipped: true,
    isSlideoutOpen: false,
  }

  onSlideoutOpen = () => {
    this.setState({ isSlideoutOpen: true })
  }

  onSlideoutClose = () => {
    this.setState({ isSlideoutOpen: false })
  }

  onResize = _.throttle(() => {
    this.slideout.close()
  }, 200)

  componentDidMount() {
    this.props.loadMessages({ channelName: this.props.channel.name })

    this.autoScroll = true
    this.scroll()

    this.slideout = new Slideout({
      panel: document.getElementById('slideout-panel'),
      menu: document.getElementById('slideout-menu'),
      padding: 200,
      sensitivity: 60,
      side: 'right',
    })

    this.slideout.on('open', this.onSlideoutOpen)
    this.slideout.on('close', this.onSlideoutClose)

    window.addEventListener('resize', this.onResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)

    this.slideout.off('open', this.onSlideoutOpen)
    this.slideout.off('close', this.onSlideoutClose)

    this.slideout.destroy()
  }

  componentWillUpdate(nextProps) {
    const { wrapperNode } = this

    if (!wrapperNode) {
      return
    }

    this.autoScroll = (
      wrapperNode.scrollHeight - wrapperNode.scrollTop
      <= wrapperNode.clientHeight + 10
    )

    if (!this.autoScroll) {
      this.persistScroll = (
        !_.isEmpty(nextProps.messages)
        && _.first(nextProps.messages) !== _.first(this.props.messages)
      )

      if (this.persistScroll) {
        this.scrollHeight = wrapperNode.scrollHeight
        this.scrollTop = wrapperNode.scrollTop
      }
    }
  }

  componentDidUpdate() {
    this.props.loadMessages({ channelName: this.props.channel.name })

    this.scroll()
  }

  scroll() {
    const { wrapperNode } = this

    if (wrapperNode) {
      if (this.autoScroll) {
        setTimeout(() => {
          wrapperNode.scrollTop = wrapperNode.scrollHeight
        })
      } else if (this.persistScroll) {
        wrapperNode.scrollTop = this.scrollTop + (wrapperNode.scrollHeight - this.scrollHeight)
      }
    }
  }

  onRef = node => {
    this.wrapperNode = node
  }

  onScroll = ev => {
    const { target: wrapperNode } = ev

    const threshold = document.documentElement.clientHeight
    if (wrapperNode.scrollTop <= threshold) {
      const messageFirst = _.first(this.props.messages)
      this.props.loadMessages({
        channelName: this.props.channel.name,
        before: messageFirst ? messageFirst.timestamp : null
      })
    }
  }

  onHamburgerClick = () => {
    this.setState({ isSlideoutOpen: !this.state.isSlideoutOpen })
    this.slideout.toggle()
  }

  onNameClick = () => {
    if (this.props.isEmbed) {
      return
    }

    this.props.closeChannel()
  }

  onTopicClick = () => {
    this.setState({ isTopicClipped: !this.state.isTopicClipped })
  }

  render() {
    const { isEmbed, channel } = this.props

    const hamburgerClasses = classNames('hamburger hamburger--squeeze', {
      'is-active': this.state.isSlideoutOpen,
    })
    const nameClasses = classNames('name bold', {
      'is-embed': isEmbed,
    })
    const topicClasses = classNames('topic', {
      'is-topic-clipped': this.state.isTopicClipped,
    })

    return (
      <div id='channel'>
        <div className='header'>
          <div className={hamburgerClasses} onClick={this.onHamburgerClick}>
            <div className='hamburger-box'>
              <div className='hamburger-inner'></div>
            </div>
          </div>

          <h2 className={nameClasses} onClick={this.onNameClick}>{channel.name}</h2>

          <Maybe when={channel.topic}>
            <div className={topicClasses} onClick={this.onTopicClick}>
              <Text>{channel.topic}</Text>
            </div>
          </Maybe>
        </div>

        <div className='messages-wrapper' ref={this.onRef} onScroll={this.onScroll}>
          <Messages {...this.props} />
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, props) => ({
  isEmbed: isEmbedSelector(state),
  channel: getChannelSelector()(state),
  messages: getMessagesSelector()(state),
  hasReachedBeginning: hasReachedBeginningSelector(state),
  isSubscribedToMessages: isSubscribedToMessagesSelector(state),
})

const mapDispatchToProps = {
  loadMessages,
  closeChannel,
}

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
