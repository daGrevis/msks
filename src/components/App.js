import React, { Component } from 'react'

import Channel from '../containers/Channel'

export default class App extends Component {
  componentWillMount() {
    this.props.loadMessages()
  }

  render() {
    return (
      <div id='app'>
        <Channel />
      </div>
    )
  }
}
