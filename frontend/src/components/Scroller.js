import _ from 'lodash'
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'
import React from 'react'
import { connect } from 'react-redux'
import ResizeObserver from 'resize-observer-polyfill'

import { saveLastScrollPosition } from '../store/actions/app'

import '../styles/Scroller.css'

const SCROLL_ACTIONS = {
  toItem: 'toItem',
  adjustForTop: 'adjustForTop',
  toBottom: 'toBottom',
  restore: 'restore',
}

const isCloseToTop = node => node.scrollTop < node.clientHeight

const isCloseToBottom = node =>
  node.scrollHeight - (node.scrollTop + node.clientHeight) < node.clientHeight

class Scroller extends React.Component {
  node = null
  resizeObserver = null

  scrollHeight = null
  scrollTop = null

  scrollAction = null

  isScrollUpdated = false

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

    let prevHeight
    this.resizeObserver = new ResizeObserver(([entry]) => {
      const { height } = entry.contentRect

      if (prevHeight && prevHeight !== height) {
        const heightDelta = prevHeight - height
        const scrollBottom =
          this.node.scrollHeight -
          this.node.clientHeight -
          this.node.scrollTop -
          heightDelta
        if (-scrollBottom < heightDelta) {
          this.node.scrollTop = this.node.scrollTop + heightDelta
        }
      }

      prevHeight = height
    })
    this.resizeObserver.observe(this.node)
  }

  componentDidUpdate() {
    this.updateScroll()
  }

  componentWillUnmount() {
    this.resizeObserver.disconnect()
  }

  calculateScroll(prevProps, nextProps) {
    if (this.node) {
      this.scrollHeight = this.node.scrollHeight
      this.scrollTop = this.node.scrollTop
    }

    if (
      prevProps &&
      !prevProps.shouldResetScrolledBottom &&
      nextProps.shouldResetScrolledBottom
    ) {
      this.isScrolledBottomFired = false
    }

    const prevItems = (prevProps && prevProps.items) || []
    const nextItems = nextProps.items || []

    if (!nextItems.length) {
      this.isScrollUpdated = false
    }

    this.isItemAddedToTop = !!(
      (nextItems.length &&
        prevItems.length &&
        prevItems[0].id !== nextItems[0].id) ||
      (prevItems.length && !nextItems.length)
    )
    this.isItemAddedToBottom = !!(
      (nextItems.length &&
        prevItems.length &&
        prevItems[prevItems.length - 1].id !==
          nextItems[nextItems.length - 1].id) ||
      (prevItems.length && !nextItems.length)
    )

    const shouldScrollToItem =
      nextProps.itemId &&
      (!prevProps ? true : prevProps.itemId !== nextProps.itemId)
    if (shouldScrollToItem) {
      this.scrollAction = SCROLL_ACTIONS.toItem
      return
    }

    if (this.isItemAddedToTop) {
      this.scrollAction = SCROLL_ACTIONS.adjustForTop
      return
    }

    const hasReachedBottom = !!(
      this.node &&
      nextItems.length &&
      // May be 1px off due to native rounding.
      this.node.scrollHeight - (this.scrollTop + this.node.clientHeight) <= 1
    )
    if (
      this.props.stickToBottom ||
      (this.props.autoStickToBottom && hasReachedBottom)
    ) {
      this.scrollAction = SCROLL_ACTIONS.toBottom
      return
    }

    const shouldRestore = !!(!prevProps && nextProps.scrollPosition)
    if (shouldRestore) {
      this.scrollAction = SCROLL_ACTIONS.restore
      return
    }
  }

  updateScroll = () => {
    const isScrollable = this.node.clientHeight !== this.node.scrollHeight
    const shouldRescroll = !!(
      this.props.items &&
      this.props.items.length &&
      (!isScrollable || isCloseToTop(this.node) || isCloseToBottom(this.node))
    )

    switch (this.scrollAction) {
      case SCROLL_ACTIONS.toItem:
        scrollIntoViewIfNeeded(document.getElementById(this.props.itemId), {
          scrollMode: 'if-needed',
          block: 'center',
        })
        break

      case SCROLL_ACTIONS.adjustForTop:
        // Force stop momentum scrolling.
        this.node.style.overflow = 'hidden'
        this.node.scrollTop =
          this.scrollTop + (this.node.scrollHeight - this.scrollHeight)
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
      this.isScrollUpdated = true

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

    const shouldFireScrolledTop = !!(
      this.props.items &&
      this.props.items.length &&
      this.props.onScrolledTop &&
      !this.isScrolledTopFired &&
      isCloseToTop(this.node)
    )
    if (shouldFireScrolledTop) {
      this.isScrolledTopFired = this.props.onScrolledTop()
    }

    const shouldFireScrolledBottom = !!(
      this.props.items &&
      this.props.items.length &&
      this.props.onScrolledBottom &&
      !this.isScrolledBottomFired &&
      isCloseToBottom(this.node)
    )
    if (shouldFireScrolledBottom) {
      this.isScrolledBottomFired = this.props.onScrolledBottom()
    }

    this.saveLastScrollPosition()
  }

  onThrottledScroll = _.throttle(() => {
    this.onScroll()
  }, 250)

  saveLastScrollPosition = _.debounce(() => {
    if (!this.node) {
      return
    }

    if (this.props.id) {
      this.props.saveLastScrollPosition({
        id: this.props.id,
        position: Math.round(this.node.scrollTop),
      })
    }
  }, 500)

  render() {
    return (
      <div
        className="scroller"
        ref={this.onRef}
        onScroll={this.onThrottledScroll}
      >
        {this.props.children}
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  scrollPosition: ownProps.id ? state.scrollPositions[ownProps.id] : undefined,
})

const mapDispatchToProps = {
  saveLastScrollPosition,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Scroller)
