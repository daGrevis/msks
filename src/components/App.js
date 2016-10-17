import React, { Component } from 'react'

import Maybe from './Maybe'
import Channel from '../containers/Channel'

export default class App extends Component {
  render() {
    const { isLoading } = this.props

    return (
      <div id='app'>
        <Maybe when={!isLoading}>
          <Channel />
        </Maybe>
      </div>
    )
  }
}
