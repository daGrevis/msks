import _ from 'lodash'
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'
import React from 'react'
import { connect } from 'react-redux'

import { saveLastScrollPosition } from '../actions'

import '../styles/Scroller.css'

const SCROLL_ACTIONS = {
  toItem: 'toItem',
  adjustForTop: 'adjustForTop',
  toBottom: 'toBottom',
  restore: 'restore',
}

const isCloseToTop = node => node.scrollTop < window.innerHeight

const isCloseToBottom = node => (
  node.scrollHeight - (node.scrollTop + node.clientHeight)
  < window.innerHeight
)

class Scroller extends React.Component {
  node = null

  scrollHeight = null
  scrollTop = null

  scrollAction = null

  isScrollUpdated = false
  isScrollingToItem = false

  isItemAddedToTop = false
  isItemAddedToBottom = false
  isScrolledTopFired = false
  isScrolledBottomFired = false

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

    if (prevProps && !prevProps.shouldRefireScrolledTop && nextProps.shouldRefireScrolledTop) {
      this.isScrolledTopFired = false
    }
    if (prevProps && !prevProps.shouldRefireScrolledBottom && nextProps.shouldRefireScrolledBottom) {
      this.isScrolledBottomFired = false
    }

    const prevItems = prevProps ? prevProps.items : []
    const nextItems = nextProps.items

    if (!nextItems.length) {
      this.isScrollUpdated = false
    }

    this.isItemAddedToTop = !!(
      (
        nextItems.length
        && prevItems.length
        && prevItems[0].id !== nextItems[0].id
      )
      || (prevItems.length && !nextItems.length)
    )
    this.isItemAddedToBottom = !!(
      (
        nextItems.length
        && prevItems.length
        && prevItems[prevItems.length - 1].id !== nextItems[nextItems.length - 1].id
      )
      || (prevItems.length && !nextItems.length)
    )

    const shouldScrollToItem = (
      prevProps
      && !prevProps.itemId
      && nextProps.itemId
    )
    if (shouldScrollToItem) {
      this.scrollAction = SCROLL_ACTIONS.toItem
      return
    }

    if (this.isItemAddedToTop) {
      this.scrollAction = SCROLL_ACTIONS.adjustForTop
      return
    }

    const hasReachedBottom = !!(
      this.node
      && nextProps.items.length
      // May be 1px off due to native rounding.
      && this.node.scrollHeight - (this.scrollTop + this.node.clientHeight) <= 1
    )
    if (hasReachedBottom && this.props.stickToBottom) {
      this.scrollAction = SCROLL_ACTIONS.toBottom
      return
    }

    const shouldRestore = !!(
      !prevProps
      && nextProps.scrollPosition
    )
    if (shouldRestore) {
      this.scrollAction = SCROLL_ACTIONS.restore
      return
    }
  }

  updateScroll = () => {
    const isScrollable = this.node.clientHeight !== this.node.scrollHeight
    const shouldRescroll = !!(
      this.props.items.length
      && (
        !isScrollable
        || isCloseToTop(this.node)
        || isCloseToBottom(this.node)
      )
    )

    if (this.isScrollingToItem) {
      return
    }

    switch (this.scrollAction) {
      case SCROLL_ACTIONS.toItem:
        const duration = 250
        this.isScrollingToItem = true
        scrollIntoViewIfNeeded(document.getElementById(this.props.itemId), true, { duration })
        setTimeout(() => {
          this.isScrollingToItem = false
          this.onScroll()
        }, duration)
        break

      case SCROLL_ACTIONS.adjustForTop:
        // Force stop momentum scrolling.
        this.node.style.overflow = 'hidden'
        this.node.scrollTop = (
          this.scrollTop + (this.node.scrollHeight - this.scrollHeight)
        )
        this.node.style.overflowY = 'scroll'
        break

      case SCROLL_ACTIONS.toBottom:
        this.node.scrollTop = this.node.scrollHeight
        break

      case SCROLL_ACTIONS.restore:
        this.node.scrollTop = this.props.scrollPosition
        break

      default:
        break
    }

    if (this.scrollAction) {
      this.isScrollUpdated = true
    }

    if (this.isItemAddedToTop) {
      this.isItemAddedToTop = false
      this.isScrolledTopFired = false
    }
    if (this.isItemAddedToBottom) {
      this.isItemAddedToBottom = false
      this.isScrolledBottomFired = false
    }

    this.scrollAction = null

    if (shouldRescroll) {
      this.onScroll()
    }
  }

  onRef = node => {
    this.node = node
  }

  onScroll = () => {
    if (!this.node) {
      return
    }

    if (!this.isScrollUpdated) {
      return
    }

    if (this.isScrollingToItem) {
      return
    }

    const shouldFireScrolledTop = !!(
      this.props.items.length
      && this.props.onScrolledTop
      && !this.isScrolledTopFired
      && isCloseToTop(this.node)
    )
    if (shouldFireScrolledTop) {
      this.isScrolledTopFired = this.props.onScrolledTop()
    }

    const shouldFireScrolledBottom = !!(
      this.props.items.length
      && this.props.onScrolledBottom
      && !this.isScrolledBottomFired
      && isCloseToBottom(this.node)
    )
    if (shouldFireScrolledBottom) {
      this.isScrolledBottomFired = this.props.onScrolledBottom()
    }

    this.props.saveLastScrollPosition({
      id: this.props.id,
      position: Math.round(this.node.scrollTop),
    })
  }

  onThrottledScroll = _.throttle(() => {
    this.onScroll()
  }, 250)

  render() {
    return (
      <div className='scroller' ref={this.onRef} onScroll={this.onThrottledScroll}>
        {this.props.children}
      </div>
    )
  }
}

const mapStateToProps = (state, props) => ({
  scrollPosition: state.scrollPositions[props.id],
})

const mapDispatchToProps = {
  saveLastScrollPosition,
}

export default connect(mapStateToProps, mapDispatchToProps)(Scroller)
