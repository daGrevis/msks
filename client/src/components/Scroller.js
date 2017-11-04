import _ from 'lodash'
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'
import React from 'react'
import { connect } from 'react-redux'

import { setScrollPosition } from '../actions'

import '../styles/Scroller.css'

const SCROLL_ACTIONS = {
  toItem: 1,
  adjustForTop: 2,
  toBottom: 3,
  restore: 4,
}

const isCloseToTop = node => node.scrollTop < 200

const isCloseToBottom = node => (
  node.scrollHeight - (node.scrollTop + node.clientHeight)
  < 200
)

class Scroller extends React.Component {
  node = null

  scrollHeight = null
  scrollTop = null

  scrollAction = null

  componentWillMount() {
    this.calculateScroll(null, this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.calculateScroll(this.props, nextProps)
  }

  componentDidMount() {
    this.updateScroll()
  }

  componentDidUpdate() {
    this.updateScroll()
  }

  calculateScroll(prevProps, nextProps) {
    if (this.node) {
      this.scrollHeight = this.node.scrollHeight
      this.scrollTop = this.node.scrollTop
    }

    const shouldScrollToItem = (
      prevProps
      && !prevProps.itemId
      && nextProps.itemId
    )
    if (shouldScrollToItem) {
      this.scrollAction = SCROLL_ACTIONS.toItem
      return
    }

    const isItemAddedToTop = (
      nextProps.items.length
      && prevProps
      && prevProps.items.length
      && prevProps.items[0].id !== nextProps.items[0].id
    )
    if (isItemAddedToTop) {
      this.scrollAction = SCROLL_ACTIONS.adjustForTop
      return
    }

    const hasReachedBottom = (
      this.node
      && (
        this.node.scrollHeight
        === (this.node.scrollTop + this.node.clientHeight)
      )
    )
    if (hasReachedBottom && this.props.stickToBottom) {
      this.scrollAction = SCROLL_ACTIONS.toBottom
      return
    }

    if (nextProps.scrollPosition) {
      this.scrollAction = SCROLL_ACTIONS.restore
      return
    }
  }

  updateScroll = () => {
    const isScrollable = this.node.clientHeight !== this.node.scrollHeight
    const shouldRescroll = (
      this.props.items.length
      && (
        !isScrollable
        || isCloseToTop(this.node)
        || isCloseToBottom(this.node)
      )
    )
    if (shouldRescroll) {
      this.onScroll()
    }

    switch (this.scrollAction) {
      case SCROLL_ACTIONS.toItem:
        scrollIntoViewIfNeeded(document.getElementById(this.props.itemId), true, {
          duration: 250,
        })
        break

      case SCROLL_ACTIONS.adjustForTop:
        this.node.scrollTop = (
          this.scrollTop + (this.node.scrollHeight - this.scrollHeight)
        )
        break

      case SCROLL_ACTIONS.toBottom:
        this.node.scrollTop = (
          this.node.scrollHeight - this.node.clientHeight
        )
        break

      case SCROLL_ACTIONS.restore:
        this.node.scrollTop = this.props.scrollPosition
        break

      default:
        break
    }

    this.scrollAction = null
  }

  onRef = node => {
    this.node = node
  }

  onDebouncedScroll = _.debounce(() => {
    if (!this.node) {
      return
    }

    if (this.props.onScrolledTop && isCloseToTop(this.node)) {
      this.props.onScrolledTop()
    }

    if (this.props.onScrolledBottom && isCloseToBottom(this.node)) {
      this.props.onScrolledBottom()
    }

    this.props.setScrollPosition({
      id: this.props.id,
      position: this.node.scrollTop,
    })
  }, 100)

  onScroll = () => {
    this.onDebouncedScroll()
  }

  render() {
    return (
      <div className='scroller' ref={this.onRef} onScroll={this.onScroll}>
        {this.props.children}
      </div>
    )
  }
}

const mapStateToProps = (state, props) => ({
  scrollPosition: state.scrollPositions[props.id],
})

const mapDispatchToProps = {
  setScrollPosition,
}

export default connect(mapStateToProps, mapDispatchToProps)(Scroller)
