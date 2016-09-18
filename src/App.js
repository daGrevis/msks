import _ from 'lodash'
import React, { Component } from 'react'
import Horizon from '@horizon/client'

import './app.css'

const horizon = Horizon({ host: 'localhost:8181' })

horizon.status().subscribe(
  status => console.log('Horizon status', status)
)

horizon.connect()

class App extends Component {
  state = {
    messages: [],
  }

  componentDidMount() {
    horizon('messages').order('timestamp', 'descending').watch({ rawChanges: true })
      .filter(({ type }) => _.includes(['initial', 'add'], type))
      .subscribe(message => {
        console.log('.')

        let { messages } = this.state
        messages = _.concat(messages, message.new_val)
        this.setState({ messages })
      })
  }

  render() {
    const { messages } = this.state
    return (
      <div id='app'>
        {_.map(messages, m => {
          return <div key={m.id}>{m.from} -> {m.to}: {m.text}</div>
        })}
      </div>
    )
  }
}

export default App
