import fp from 'lodash/fp'
import React from 'react'

import '../styles/SearchInput.css'

class SearchInput extends React.Component {
  inputNode = null

  componentDidMount() {
    if (fp.isEmpty(this.props.query)) {
      this.inputNode.focus()
    }
  }

  render() {
    return (
      <div className="SearchInput">
        <input
          className="nick-input"
          placeholder="Nick"
          value={this.props.query.nick || ''}
          onChange={ev => {
            this.props.inputSearch({ nick: ev.target.value })
          }}
          spellCheck={false}
          autoCapitalize="none"
        />
        <input
          ref={node => {
            this.inputNode = node
          }}
          className="text-input"
          placeholder="Search Text"
          value={this.props.query.text || ''}
          onChange={ev => {
            this.props.inputSearch({ text: ev.target.value })
          }}
          spellCheck={false}
          autoCapitalize="none"
        />
      </div>
    )
  }
}

export default SearchInput
