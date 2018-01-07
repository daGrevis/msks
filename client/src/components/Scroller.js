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
  isScrollingToMessage = false

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
      && nextProps.items.length
      // May be 1px off due to native rounding.
      && this.node.scrollHeight - (this.scrollTop + this.node.clientHeight) <= 1
    )
    if (hasReachedBottom && this.props.stickToBottom) {
      this.scrollAction = SCROLL_ACTIONS.toBottom
      return
    }

    const shouldRestore = !prevProps && nextProps.scrollPosition
    if (shouldRestore) {
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

    if (this.isScrollingToMessage) {
      return
    }

    switch (this.scrollAction) {
      case SCROLL_ACTIONS.toItem:
        const duration = 250
        this.isScrollingToMessage = true
        scrollIntoViewIfNeeded(document.getElementById(this.props.itemId), true, { duration })
        setTimeout(() => {
          this.isScrollingToMessage = false
        }, duration)
        break

      case SCROLL_ACTIONS.adjustForTop:
        // Force stop momentum scrolling.
        this.node.style.overflow = 'hidden'
        this.node.scrollTop = (
          this.scrollTop + (this.node.scrollHeight - this.scrollHeight)
        )
        this.node.style.overflow = 'scroll'
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

    this.scrollAction = null
  }

  onRef = node => {
    this.node = node
  }

  onThrottledScroll = _.throttle(() => {
    if (!this.node) {
      return
    }

    if (!this.isScrollUpdated) {
      return
    }

    if (this.isScrollingToMessage) {
      return
    }

    if (this.props.onScrolledTop && isCloseToTop(this.node)) {
      this.props.onScrolledTop()
    }

    if (this.props.onScrolledBottom && isCloseToBottom(this.node)) {
      this.props.onScrolledBottom()
    }

    this.props.saveLastScrollPosition({
      id: this.props.id,
      position: Math.round(this.node.scrollTop),
    })
  }, 250)

  onScroll = () => {
    this.onThrottledScroll()
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
  saveLastScrollPosition,
}

export default connect(mapStateToProps, mapDispatchToProps)(Scroller)
