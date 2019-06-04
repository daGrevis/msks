import fp from 'lodash/fp'
import React from 'react'
import { connect } from 'react-redux'

import {
  getMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
} from '../store/actions/messages'
import { messageIdSelector } from '../store/selectors/router'
import { channelSelector } from '../store/selectors/channels'
import {
  messagesSelector,
  activeMessageSelector,
  isViewingArchiveSelector,
  hasReachedBeginningSelector,
} from '../store/selectors/messages'
import Scroller from './Scroller'
import MessagesGrid from './MessagesGrid'

class Messages extends React.Component {
  componentDidRender(prevProps) {
    const { channel, messageId, messages, isLoadingMessages } = this.props

    if (!channel) {
      return null
    }

    if (messageId) {
      if (!prevProps || prevProps.messageId !== messageId) {
        const hasMessage = fp.find({ id: messageId }, this.props.messages)
        if (!hasMessage) {
          this.props.getMessagesAround({
            channelId: channel.id,
            around: messageId,
          })
        }
      }
    } else {
      if (!messages && !isLoadingMessages) {
        this.props.getMessages({
          channelId: channel.id,
        })
      }
    }
  }

  componentDidMount() {
    this.componentDidRender()
  }

  componentDidUpdate(prevProps) {
    this.componentDidRender(prevProps)
  }

  render() {
    return (
      <Scroller
        id={this.props.channel && `messages.${this.props.channel.id}`}
        items={this.props.messages}
        itemId={this.props.activeMessage ? this.props.activeMessage.id : null}
        onScrolledTop={() => {
          if (this.props.hasReachedBeginning) {
            return false
          }

          const firstMessage = fp.find(
            { channelId: this.props.channel.id },
            this.props.messages,
          )

          if (!firstMessage) {
            return false
          }

          this.props.getMessagesBefore({
            channelId: this.props.channel.id,
            before: firstMessage.id,
          })
          return true
        }}
        onScrolledBottom={() => {
          if (!this.props.isSocketConnected) {
            return false
          }

          if (!this.props.isViewingArchive) {
            return false
          }

          const lastMessage = fp.findLast(
            { channelId: this.props.channel.id },
            this.props.messages,
          )

          if (!lastMessage) {
            return false
          }

          this.props.getMessagesAfter({
            channelId: this.props.channel.id,
            after: lastMessage.id,
          })
          return true
        }}
        shouldResetScrolledBottom={this.props.isSocketReconnected}
        autoStickToBottom={!this.props.isViewingArchive}
      >
        <MessagesGrid
          messages={this.props.messages}
          activeMessage={this.props.activeMessage}
        />
      </Scroller>
    )
  }
}

const mapStateToProps = state => {
  const channel = channelSelector(state)

  return {
    channel,
    messages: messagesSelector(state),
    messageId: messageIdSelector(state),
    activeMessage: activeMessageSelector(state),
    isViewingArchive: isViewingArchiveSelector(state),
    hasReachedBeginning: hasReachedBeginningSelector(state),
    isSocketConnected: state.isSocketConnected,
    isSocketReconnected: state.isSocketReconnected,
    isLoadingMessages: channel ? state.isLoadingMessages[channel.id] : false,
  }
}

const mapDispatchToProps = {
  getMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Messages)
