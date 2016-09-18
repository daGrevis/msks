import _ from 'lodash'
import React, { Component } from 'react'
import Horizon from '@horizon/client'

import logo from './logo.svg'
import './App.css'

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
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <div className="App-intro">
          {_.map(messages, m => {
            return <div key={m.id}>{m.from} -> {m.to}: {m.text}</div>
          })}
        </div>
      </div>
    )
  }
}

export default App
