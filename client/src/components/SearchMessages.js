import React from 'react'
import { connect } from 'react-redux'

import { searchMessages } from '../actions'
import {
  channelSelector, foundMessagesSelector,
  searchQuerySelector, isSearchIntroSelector, isSearchNotFoundSelector, isSearchOutdatedSelector,
} from '../selectors'
import Scroller from './Scroller'
import MessagesGrid from './MessagesGrid'
import Loader from '../components/Loader'

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
        stickToBottom
      >
        {(() => {
          if (this.props.isSearchIntro) {
            return (
              <Notice>Start typing to search...</Notice>
            )
          } else if (this.props.isSearchNotFound) {
            return (
              <Notice>Nothing was found...</Notice>
            )
          } else if (this.props.isSearchOutdated) {
            return (
              <Loader isTall />
            )
          } else {
            return (
              <MessagesGrid messages={this.props.messages} />
            )
          }
        })()}
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
  isSearchOutdated: isSearchOutdatedSelector(state),
})

const mapDispatchToProps = {
  searchMessages,
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchMessages)
