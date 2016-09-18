import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import classNames from 'classnames'
import Horizon from '@horizon/client'

import './app.css'

const horizon = Horizon({ host: 'localhost:8181' })

horizon.status().subscribe(
  status => console.log('Horizon status', status)
)

horizon.connect()

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

class App extends Component {
  state = {
    messages: [],
  }

  componentDidMount() {
    horizon('messages').order('timestamp', 'descending').watch()
      .subscribe(messages => {
        this.setState({ messages })
      })
  }

  render() {
    const { messages } = this.state
    return (
      <div id='app'>
        {_.map(messages, (m, i) => {
          const isConsecutive = i > 0 && messages[i - 1].from === m.from
          return <Message key={m.id} message={m} isConsecutive={isConsecutive} />
        })}
      </div>
    )
  }
}

export default App
