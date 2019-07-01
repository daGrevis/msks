import _ from 'lodash'
import format from 'date-fns/format'
import React from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import {
  getLinkToSearchUser,
  getLinkToChannel,
  getLinkToMessage,
} from '../routing/links'
import { replace } from '../store/actions/router'
import { hasSessionSelector } from '../store/selectors/session'
import Text from './Text'
import Nick from './Nick'

import '../styles/Message.css'

const MessageNick = ({ message, connection, channel }) => (
  <Nick
    nick={message.nick}
    isOp={message.isOp}
    isVoiced={message.isVoiced}
    link={getLinkToSearchUser(
      connection.serverId,
      connection.nick,
      channel.name,
      message.nick,
    )}
  />
)

const MessageText = ({ message, connection, channel, hasSession }) => {
  const { nick } = connection
  const { text, meta } = message

  let highlights = message.highlights

  if (!highlights && hasSession && text) {
    const index = text.indexOf(nick)
    const lastIndex = index === -1 ? null : index + nick.length
    if (
      message.nick !== nick &&
      index !== -1 &&
      (index === 0 || text[index - 1] === ' ') &&
      (lastIndex === text.length ||
        text[lastIndex] === ' ' ||
        text[lastIndex] === ',' ||
        text[lastIndex] === ':')
    ) {
      highlights =
        text.slice(0, index) +
        '<highlight>' +
        text.slice(index, lastIndex) +
        '</highlight>' +
        text.slice(lastIndex)
    }
  }

  let children
  switch (message.type) {
    case 'text':
    case 'status':
    case 'client':
      children = <Text highlights={highlights}>{text}</Text>
      break
    case 'notice':
      children = (
        <span>
          <span className="exclamation">!</span>
          <Text highlights={highlights}>{text}</Text>
        </span>
      )
      break
    case 'action':
      children = (
        <span>
          <MessageNick
            message={message}
            connection={connection}
            channel={channel}
          />{' '}
          <Text highlights={highlights}>{text}</Text>
        </span>
      )
      break
    case 'join':
      children = (
        <span>
          <MessageNick
            message={message}
            connection={connection}
            channel={channel}
          />
          {' joined'}
        </span>
      )
      break
    case 'quit':
      children = (
        <span title={text}>
          <MessageNick
            message={message}
            connection={connection}
            channel={channel}
          />
          {' quit'}
        </span>
      )
      break
    case 'part':
      children = (
        <span title={text}>
          <MessageNick
            message={message}
            connection={connection}
            channel={channel}
          />
          {' left'}
        </span>
      )
      break
    case 'kick':
      children = (
        <span>
          <Nick
            nick={meta.kicked}
            isOp={meta.isOp}
            isVoiced={meta.isVoiced}
            link={getLinkToSearchUser(
              connection.serverId,
              connection.nick,
              channel.name,
              meta.kicked,
            )}
          />
          {' kicked by '}
          <MessageNick
            message={message}
            connection={connection}
            channel={channel}
          />
          {text && (
            <span className="kick-reason">
              (<Text highlights={highlights}>{text}</Text>)
            </span>
          )}
        </span>
      )
      break
    case 'nick':
      children = (
        <span>
          <MessageNick
            message={message}
            connection={connection}
            channel={channel}
          />
          {' is known as '}
          <Nick
            nick={meta.newNick}
            isOp={message.isOp}
            isVoiced={message.isVoiced}
            link={getLinkToSearchUser(
              connection.serverId,
              connection.nick,
              channel.name,
              meta.newNick,
            )}
          />
        </span>
      )
      break
    case 'topic':
      children = (
        <span>
          <MessageNick
            message={message}
            connection={connection}
            channel={channel}
          />
          {' set topic to '}
          <span className="topic">
            <Text highlights={highlights}>{text}</Text>
          </span>
        </span>
      )
      break
    case 'mode':
      children = (
        <span>
          <MessageNick
            message={message}
            connection={connection}
            channel={channel}
          />
          {' set '}
          <strong>{meta.mode}</strong>
          {' on '}
          {meta.mode[1] === 'b' ? (
            <strong>{meta.param}</strong>
          ) : (
            <Nick
              nick={meta.param}
              isOp={meta.isOp}
              isVoiced={meta.isVoiced}
              link={getLinkToSearchUser(
                connection.serverId,
                connection.nick,
                channel.name,
                meta.param,
              )}
            />
          )}
        </span>
      )
      break
    case 'banlist':
      const { bans } = meta

      children = (
        <div>
          <h3>{`${meta.channelName} bans`}</h3>

          {bans.length === 0 && <div>No bans</div>}

          <ol>
            {_.map(bans, ({ target, author, timestamp }) => {
              const [nick, afterNick] = author.split('!')

              return (
                <li
                  key={target}
                  title={format(
                    new Date(timestamp * 1000),
                    'YYYY-MM-DDTHH:mm:ssZ',
                  )}
                >
                  <strong>{target}</strong>
                  {' banned by '}
                  <Nick
                    nick={nick}
                    link={getLinkToSearchUser(
                      connection.serverId,
                      connection.nick,
                      channel.name,
                      nick,
                    )}
                  />
                  {afterNick && ` !${afterNick}`}
                </li>
              )
            })}
          </ol>
        </div>
      )
      break
    case 'whois':
      children = meta.error ? (
        <div>{`/whois ${message.nick} not found`}</div>
      ) : (
        <div>
          {meta.account && (
            <div>
              {'Account: '}
              <strong>{meta.account}</strong>
            </div>
          )}

          <div>
            {'Host mask: '}
            <strong>
              {meta.ident}
              {'@'}
              {meta.hostname}
            </strong>
          </div>

          <div>
            {'Real name: '}
            <strong>{meta.realName}</strong>
          </div>

          <div>
            {'Server: '}
            <strong>{`${meta.server} (${meta.serverInfo})`}</strong>
          </div>

          {meta.secure && (
            <div>
              {'Secure: '}
              <strong>true</strong>
            </div>
          )}

          {meta.away && (
            <div>
              {'Away: '}
              <strong>{meta.away}</strong>
            </div>
          )}
        </div>
      )
      break
    default:
      throw Error(`MessageText case for type not handled: ${message.type}`)
  }

  return <div className="text">{children}</div>
}

const Message = props => {
  const {
    isActive,
    message,
    connection,
    channel,
    date,
    isFirst,
    hasSession,
    replace,
  } = props

  const isLinkable =
    message.type !== 'client' && message.channelId === channel.id

  const messageClasses = classNames('message', `type-${message.type}`, {
    'is-first': isFirst,
    'is-not-first': !isFirst,
    'is-active': isActive,
    'is-optimistic': message.isOptimistic,
  })

  const timestampClasses = classNames('timestamp', {
    'is-linkable': isLinkable,
  })

  const onTimestampClick = () => {
    replace(
      isActive
        ? getLinkToChannel(
            connection.serverId,
            hasSession && connection.nick,
            channel.name,
          )
        : getLinkToMessage(
            connection.serverId,
            hasSession && connection.nick,
            channel.name,
            message.id,
          ),
    )
  }

  return (
    <div id={isActive ? message.id : null} className={messageClasses}>
      <div className="meta">
        <span
          className={timestampClasses}
          title={format(date, 'YYYY-MM-DDTHH:mm:ssZ')}
          onClick={isLinkable ? onTimestampClick : undefined}
        >
          {format(date, 'HH:mm')}
        </span>

        <span className="author">
          <MessageNick
            message={message}
            connection={connection}
            channel={channel}
          />
        </span>
      </div>

      <MessageText
        message={message}
        connection={connection}
        channel={channel}
        hasSession={hasSession}
      />
    </div>
  )
}

const mapStateToProps = (state, ownProps) => ({
  ...ownProps,

  hasSession: hasSessionSelector(state),
})

const mapDispatchToProps = {
  replace,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Message)
