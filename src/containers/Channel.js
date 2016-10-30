import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { mo } from '../utils'
import { isChannelLoading, selectedChannel, channelMessages } from '../selectors'
import { loadChannel } from '../actions'
import Message from '../components/Message'

class Channel extends Component {
  wrapperNode = null

  state = {
    autoScroll: true,
  }

  scroll() {
    const { wrapperNode } = this

    if (!wrapperNode) {
      return
    }

    if (!this.state.autoScroll) {
      return
    }

    wrapperNode.scrollTop = wrapperNode.scrollHeight
  }

  componentDidRender() {
    this.props.loadChannel()
    this.scroll()
  }

  componentDidMount() {
    this.componentDidRender()
  }

  componentDidUpdate() {
    this.componentDidRender()
  }

  onRef = node => {
    this.wrapperNode = node
  }

  onScroll = ev => {
    const { target: wrapperNode } = ev

    const autoScroll = wrapperNode.scrollTop === wrapperNode.scrollHeight - wrapperNode.clientHeight
    this.setState({ autoScroll })
  }

  render() {
    if (this.props.isChannelLoading) {
      return null
    }

    const { selectedChannel, messages } = this.props

    return (
      <div id='channel'>
        <div className='header'>
          <h2 className='name bold'>{selectedChannel.name}</h2>
          <p className='topic'>{selectedChannel.topic}</p>
        </div>

        <div className='messages-wrapper' ref={this.onRef} onScroll={this.onScroll}>
          <div className='messages'>
            {_.map(messages, (message, i) => {
              const messageBefore = i > 0 ? messages[i - 1] : null
              const timestamp = new Date(message.timestamp)
              const timestampBefore = messageBefore ? new Date(messageBefore.timestamp) : null
              const isFirst = (
                !messageBefore
                || messageBefore.from !== message.from
                || mo(timestamp).diff(timestampBefore, 'minutes') > 1
              )

              return (
                <Message
                  key={message.id}
                  message={message}
                  isFirst={isFirst}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    isChannelLoading: isChannelLoading(state),
    selectedChannel: selectedChannel(state),
    messages: channelMessages(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    loadChannel: () => dispatch(loadChannel()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Channel)
