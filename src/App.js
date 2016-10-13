import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import classNames from 'classnames'
import io from 'socket.io-client'

import './app.css'

console.log('creating socket...')
const socket = io('http://localhost:3000')
socket.on('ping', data => {
  console.log('pinged!', data)
})

class Maybe extends Component {
  render() {
    if (this.props.when) {
      return this.props.children
    }
    return false
  }
}

class Message extends Component {
  render() {
    const { message, isConsecutive } = this.props

    const classes = classNames('message', {
      'is-consecutive': isConsecutive,
      'is-first': !isConsecutive,
    })
    return <div className={classes}>
      <Maybe when={!isConsecutive}>
        <div>
          <span className='nick'>{message.from}</span>
          <span className='timestamp'>{moment(message.timestamp).format('h:mm A')}</span>
        </div>
      </Maybe>
      <div className='text'>
        {message.text}
      </div>
    </div>
  }
}

class Channel extends Component {
  render() {
    const { messages } = this.props
    return <div className='channel'>
      {_.map(messages, (m, i) =>
        <Message
          key={m.id}
          message={m}
          isConsecutive={i > 0 && messages[i - 1].from === m.from}
        />
      )}
    </div>
  }
}

class App extends Component {
  state = {
    messages: [],
  }

  componentDidMount() {
    const now = new Date()
    const messages = [
      {id: 1, timestamp: now, from: 'daGrevis', text: 'test'},
    ]
    this.setState({ messages })
  }

  render() {
    const { messages } = this.state
    return (
      <div id='app'>
        <Channel messages={messages} />
      </div>
    )
  }
}

export default App
