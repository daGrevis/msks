import React from 'react'
import { connect } from 'react-redux'

import titles from '../common/titles'
import { setTitle } from '../actions'
import {
  getMessages, getMessagesBefore, getMessagesAfter, getMessagesAround, leaveArchive
} from '../actions'
import {
  routeSelector, channelSelector, messagesSelector, activeMessageSelector, hasReachedBeginningSelector,
} from '../selectors'
import Scroller from './Scroller'
import MessagesGrid from './MessagesGrid'
import Loader from '../components/Loader'

import scrollDownSvg from '../vectors/scroll-down.svg'

class Messages extends React.Component {
  componentWillMount() {
    if (this.props.route.params.messageId) {
      this.props.getMessagesAround(this.props.route.params.messageId)
    } else if (!this.props.messages.length) {
      this.props.getMessages()
    }
  }

  componentDidMount() {
    this.updateTitle()
  }

  componentDidUpdate() {
    this.updateTitle()
  }

  updateTitle = () => {
    this.props.setTitle(
      this.props.activeMessage
      ? titles.getMessageTitle(this.props.activeMessage)
      : titles.getChannelTitle(this.props.channel)
    )
  }

  onScrollIconClick = () => {
    this.props.leaveArchive()
  }

  render() {
    return (
      <Scroller
        id={`messages.${this.props.channel.name}`}
        items={this.props.messages}
        itemId={this.props.activeMessage ? this.props.activeMessage.id : null}
        onScrolledTop={() => {
          if (this.props.hasReachedBeginning) {
            return false
          }

          this.props.getMessagesBefore()
          return true
        }}
        onScrolledBottom={() => {
          if (!this.props.isViewingArchive) {
            return false
          }

          this.props.getMessagesAfter()
          return true
        }}
        shouldRefireScrolledBottom={this.props.isSocketReconnected && this.props.isSocketConnected}
        stickToBottom={!this.props.isViewingArchive}
      >
        {this.props.messages.length ? (
          <MessagesGrid messages={this.props.messages} activeMessage={this.props.activeMessage}>
            {!this.props.isViewingArchive ? null : (
              <div className='scroll-icon' onClick={this.onScrollIconClick}>
                <img src={scrollDownSvg} alt='' />
              </div>
            )}
          </MessagesGrid>
        ) : (
          <Loader isTall />
        )}
      </Scroller>
    )
  }
}

const mapStateToProps = (state, props) => ({
  route: routeSelector(state),
  channel: channelSelector(state),
  messages: messagesSelector(state),
  activeMessage: activeMessageSelector(state),
  isViewingArchive: state.isViewingArchive[state.channelName],
  hasReachedBeginning: hasReachedBeginningSelector(state),
  isSocketConnected: state.isSocketConnected,
  isSocketReconnected: state.isSocketReconnected,
})

const mapDispatchToProps = {
  setTitle,
  getMessages,
  getMessagesBefore,
  getMessagesAfter,
  getMessagesAround,
  leaveArchive,
}

export default connect(mapStateToProps, mapDispatchToProps)(Messages)
