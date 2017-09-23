import React from 'react'
import { connect } from 'react-redux'

import { searchMessages } from '../actions'
import {
  channelSelector, foundMessagesSelector,
  searchQuerySelector, isSearchIntroSelector, isSearchNotFoundSelector,
} from '../selectors'
import Scroller from './Scroller'
import MessagesGrid from './MessagesGrid'

const Notice = props => (
  <div className='notice'>
    {props.children}
  </div>
)

class SearchMessages extends React.Component {
  componentWillMount() {
    this.props.searchMessages({
      query: this.props.searchQuery,
    })
  }

  render() {
    return (
      <Scroller
        id={`search.${this.props.channel.name}`}
        items={this.props.messages}
        onScrolledTop={() => {
          this.props.searchMessages({
            query: this.props.searchQuery,
          })
        }}
        stickToBottom={true}
      >
        {this.props.isSearchIntro ? (
          <Notice>Start typing to search...</Notice>
        ) : null}

        {this.props.isSearchNotFound ? (
          <Notice>Nothing was found...</Notice>
        ) : null}

        <MessagesGrid messages={this.props.messages} />
      </Scroller>
    )
  }
}

const mapStateToProps = (state, props) => ({
  channel: channelSelector(state),
  messages: foundMessagesSelector(state),
  searchQuery: searchQuerySelector(state),
  isSearchIntro: isSearchIntroSelector(state),
  isSearchNotFound: isSearchNotFoundSelector(state),
})

const mapDispatchToProps = {
  searchMessages,
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchMessages)
