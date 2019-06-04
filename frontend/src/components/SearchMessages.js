import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'

import {
  searchMessages,
  searchMessagesBefore,
  searchMessagesAfter,
  outdateSearch,
} from '../store/actions/search'
import { channelSelector } from '../store/selectors/channels'
import {
  foundMessagesSelector,
  searchQuerySelector,
  isSearchIntroSelector,
  isSearchNotFoundSelector,
  isSearchRelevantSelector,
  isSearchOutdatedSelector,
} from '../store/selectors/search'
import { hasReachedBeginningSelector } from '../store/selectors/messages'
import Scroller from './Scroller'
import MessagesGrid from './MessagesGrid'
import Loader from './Loader'

const Notice = props => <div className="notice">{props.children}</div>

class SearchMessages extends React.Component {
  searchMessages = _.throttle(query => {
    this.props.searchMessages({ query })
  }, 1000)

  componentDidMount() {
    if (!this.props.messages) {
      this.props.searchMessages({ query: this.props.searchQuery })
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.searchQuery, nextProps.searchQuery)) {
      this.searchMessages(nextProps.searchQuery)
    }
  }

  componentWillUnmount() {
    this.props.outdateSearch(this.props.channel.id)
  }

  render() {
    return (
      <Scroller
        id={`search.${this.props.channel.name}`}
        items={this.props.messages}
        onScrolledTop={() => {
          if (this.props.hasReachedBeginning) {
            return false
          }

          this.props.searchMessagesBefore({
            query: this.props.searchQuery,
          })
          return true
        }}
        onScrolledBottom={() => {
          if (!this.props.isSearchOutdated) {
            return false
          }

          this.props.searchMessagesAfter({
            query: this.props.searchQuery,
          })
          return true
        }}
        shouldResetScrolledBottom={this.props.isSocketReconnected}
        stickToBottom={this.props.isSearchOutdated}
        autoStickToBottom
      >
        {(() => {
          if (this.props.isSearchIntro) {
            return <Notice>Start typing to search...</Notice>
          }
          if (this.props.isSearchNotFound) {
            return <Notice>Nothing was found...</Notice>
          }
          if (this.props.isSearchRelevant) {
            return <Loader isTall />
          }

          return <MessagesGrid messages={this.props.messages} />
        })()}
      </Scroller>
    )
  }
}

const mapStateToProps = state => ({
  channel: channelSelector(state),
  messages: foundMessagesSelector(state),
  searchQuery: searchQuerySelector(state),
  isSearchIntro: isSearchIntroSelector(state),
  isSearchNotFound: isSearchNotFoundSelector(state),
  isSearchRelevant: isSearchRelevantSelector(state),
  isSearchOutdated: isSearchOutdatedSelector(state),
  hasReachedBeginning: hasReachedBeginningSelector(state),
  isSocketReconnected: state.isSocketReconnected,
})

const mapDispatchToProps = {
  searchMessages,
  searchMessagesBefore,
  searchMessagesAfter,
  outdateSearch,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchMessages)
