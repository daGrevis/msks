import _ from 'lodash'
import fp from 'lodash/fp'
import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { getLinkToFront, getLinkToChannel } from '../routing/links'
import { push } from '../store/actions/router'
import { sendMessage, pushMessageInputHistory } from '../store/actions/messages'
import { COMMAND_MAP } from '../store/actions/commands'
import { connectionSelector } from '../store/selectors/connections'
import {
  channelSelector,
  createIsChannelDisabledSelector,
  unreadChannelsSelector,
  hasAnyUnreadSelector,
} from '../store/selectors/channels'
import { usersSelector, channelUserSelector } from '../store/selectors/users'
import Nick from './Nick'

import '../styles/MessageInput.css'

class MessageInput extends React.Component {
  node = null

  state = {
    text: '',
    historyIndex: -1,
  }

  onDocumentKeyDown = ev => {
    if (!this.node) {
      return
    }

    if (ev.key === 'Tab' && ev.target === document.body) {
      ev.preventDefault()

      this.node.focus()
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onDocumentKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onDocumentKeyDown)
  }

  autoExpand() {
    const computed = window.getComputedStyle(this.node)

    const borderHeight =
      parseInt(computed['border-top-width'], 10) +
      parseInt(computed['border-bottom-width'], 10)

    const height = borderHeight + this.node.scrollHeight

    if (!this.node.value) {
      this.node.style.height = 'inherit'
    } else {
      this.node.style.height = height + 'px'
    }
  }

  complete(node, { value, selection, historyIndex }) {
    if (value === undefined) {
      return
    }

    this.setState(
      {
        text: value,
        historyIndex: historyIndex === undefined ? -1 : historyIndex,
      },
      () => {
        const nextSelection = selection === undefined ? value.length : selection

        node.selectionStart = nextSelection
        node.selectionEnd = nextSelection

        this.autoExpand()
      },
    )
  }

  findCompletion = (value, selectionStart) => {
    const isAtEnd =
      value.length === selectionStart || value[selectionStart] === ' '
    if (value && isAtEnd) {
      const query = value.slice(0, selectionStart).match(/\S*$/)[0]

      let choices

      if (fp.startsWith('/', value) && fp.startsWith('/', query)) {
        choices = fp.map(s => `/${s}`, fp.keys(COMMAND_MAP))
      } else if (fp.startsWith('#', query) || fp.startsWith('&', query)) {
        choices = fp.pipe(
          fp.reject({ isHidden: true }),
          fp.filter(channel => channel.type === 'shared'),
          fp.map(channel => channel.name),
          fp.uniq,
        )(this.props.channels)
      } else {
        choices = fp.pipe(
          fp.reject({ isHidden: true }),
          fp.filter(channel => channel.type === 'user'),
          fp.map(channel => channel.name),
          fp.concat(fp.map(user => user.nick, this.props.users)),
          fp.uniq,
        )(this.props.channels)
      }

      const matches = fp.filter(
        x => query !== x && fp.startsWith(fp.toUpper(query), fp.toUpper(x)),
        choices,
      )

      let completed

      if (matches.length === 1) {
        completed = matches[0]
      } else if (matches.length) {
        let commonMatch = ''

        _.forEach(matches, choice => {
          if (!commonMatch) {
            commonMatch = choice
          } else {
            commonMatch = _.takeWhile(
              choice,
              (char, i) => char === commonMatch[i],
            ).join('')
          }
        })

        completed = commonMatch
      }

      if (completed) {
        const nextValue =
          value.slice(0, selectionStart - query.length) +
          completed +
          value.slice(selectionStart)

        const nextSelection = selectionStart + (nextValue.length - value.length)

        return {
          nextValue,
          nextSelection,
        }
      }
    }

    return {}
  }

  render() {
    const {
      isEnabled,
      connection,
      connections,
      channelUser,
      isDisabled,
      unreadChannels,
      hasAnyUnread,
      messageInputHistory,
    } = this.props
    const { text, historyIndex } = this.state

    if (!isEnabled) {
      return null
    }

    const isCommand = fp.startsWith('/', text) && !fp.startsWith('//', text)

    return (
      <div className={classNames('MessageInput', { isDisabled, isCommand })}>
        <div
          className={classNames('exclamation', { isActive: hasAnyUnread })}
          onClick={() => {
            if (unreadChannels.length) {
              if (unreadChannels.length === 1) {
                const unreadChannel = unreadChannels[0]
                const unreadConnection = connections[unreadChannel.connectionId]

                this.props.push(
                  getLinkToChannel(
                    unreadConnection.serverId,
                    unreadConnection.nick,
                    unreadChannel.name,
                  ),
                )
              } else {
                this.props.push(getLinkToFront())
              }
            }
          }}
        >
          !
        </div>

        <Nick
          nick={connection.nick}
          isOp={channelUser && channelUser.isOp}
          isVoiced={channelUser && channelUser.isVoiced}
        />

        <form
          onSubmit={ev => {
            ev.preventDefault()
          }}
        >
          <textarea
            ref={node => {
              this.node = node
            }}
            value={text}
            rows={1}
            onChange={ev => {
              const nextText = ev.target.value

              this.setState(
                prevState => ({
                  text: nextText,
                  historyIndex: !nextText ? -1 : prevState.historyIndex,
                }),
                () => {
                  this.autoExpand()
                },
              )
            }}
            onKeyDown={ev => {
              if (!this.node) {
                return
              }

              const { value } = this.node

              const isHistoryBackCompletion = ev.key === 'ArrowUp'
              const isHistoryForwardCompletion = ev.key === 'ArrowDown'
              const isTabCompletion = ev.key === 'Tab'
              const isSpaceCompletion =
                ev.key === ' ' &&
                value[value.length - 1] === ' ' &&
                value[value.length - 2] !== ' '

              if (isHistoryBackCompletion) {
                ev.preventDefault()

                if (historyIndex === -1 && value !== '') {
                  return
                }

                const nextIndex = historyIndex + 1
                const nextValue = messageInputHistory[nextIndex]

                if (!nextValue) {
                  return
                }

                this.complete(this.node, {
                  value: nextValue,
                  historyIndex: nextIndex,
                })
              }

              if (isHistoryForwardCompletion) {
                ev.preventDefault()

                const nextIndex = historyIndex - 1
                const nextValue = messageInputHistory[nextIndex]

                if (!nextValue) {
                  if (nextIndex === -1) {
                    this.complete(this.node, {
                      value: '',
                    })
                  }

                  return
                }

                this.complete(this.node, {
                  value: nextValue,
                  historyIndex: nextIndex,
                })
              }

              if (isTabCompletion) {
                ev.preventDefault()

                const { nextValue, nextSelection } = this.findCompletion(
                  this.node.value,
                  this.node.selectionStart,
                )
                this.complete(this.node, {
                  value: nextValue,
                  selection: nextSelection,
                })
              }

              if (isSpaceCompletion) {
                const { nextValue, nextSelection } = this.findCompletion(
                  value.slice(0, -1),
                  value.length - 1,
                )

                if (nextValue) {
                  ev.preventDefault()

                  this.complete(this.node, {
                    value: nextValue,
                    selection: nextSelection,
                  })
                }
              }
            }}
            onKeyPress={ev => {
              if (!this.node) {
                return
              }

              if (ev.key === 'Enter') {
                ev.preventDefault()

                this.props.sendMessage({
                  text,
                })

                this.complete(this.node, {
                  value: '',
                })

                this.props.pushMessageInputHistory(text)
              }
            }}
            spellCheck={false}
            autoCapitalize="none"
          />
        </form>
      </div>
    )
  }
}

const mapStateToProps = state => {
  const connection = connectionSelector(state)
  const channel = channelSelector(state)

  return {
    connection,
    channel,
    connections: state.connections,
    channels: state.channels,
    users: usersSelector(state),
    channelUser: channelUserSelector(state),
    isDisabled: createIsChannelDisabledSelector(connection, channel)(state),
    unreadChannels: unreadChannelsSelector(state),
    hasAnyUnread: hasAnyUnreadSelector(state),
    messageInputHistory: state.messageInputHistory,
  }
}

const mapDispatchToProps = {
  push,
  sendMessage,
  pushMessageInputHistory,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MessageInput)
