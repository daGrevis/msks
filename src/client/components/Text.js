import _ from 'lodash'
import React from 'react'
import classNames from 'classnames'

import { parse } from '../text'

import './Text.css'

export default props => {
  const { children: text } = props

  const fragments = parse(text)
  const textNodes = _.map(fragments, ({ text, isLink, styles, foreground, background }, i) => {
    const classes = classNames(styles, {
      [`foreground-${foreground}`]: foreground,
      [`background-${background}`]: background,
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
