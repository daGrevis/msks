import _ from 'lodash'
import React from 'react'
import classNames from 'classnames'

import { parse } from '../text'

import '../styles/Text.css'

export default props => {
  const { children: text, highlights } = props

  const fragments = parse({ highlights })(text)
  const textNodes = _.map(fragments, ({ text, isLink, isHighlight, styles, foreground, background }, i) => {
    const classes = classNames(styles, {
      [`foreground-${foreground}`]: foreground,
      [`background-${background}`]: background,
      'highlight': isHighlight,
    })
    if (isLink) {
      return <a key={i} href={text} target='_blank' className={classes}>{text}</a>
    } else {
      return <span key={i} className={classes}>{text}</span>
    }
  })

  return (
    textNodes.length === 1
    ? textNodes[0]
    : <span>{textNodes}</span>
  )
}
