import React, { Component } from 'react'

export default class Maybe extends Component {
  render() {
    if (this.props.when) {
      return this.props.children
    }
    return false
  }
}
