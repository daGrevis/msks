import React from 'react'
import _ from 'lodash'
import fp from 'lodash/fp'

export default props => {
  const { children: text } = props

  if (!text) return null

  // Anything starting with one or more word characters followed by :// is considered a link.
  const linkPattern = /(\w+:\/\/\S+)/g

  const parts = fp.filter(s => s !== '')(text.split(linkPattern))

  const textNodes = _.map(parts, (part, i) => {
    if (linkPattern.test(part)) {
      return <a key={i} href={part} target='_blank'>{part}</a>
    } else {
      return <span key={i}>{part}</span>
    }
  })

  return (
    textNodes.length === 1
    ? textNodes[0]
    : <span>{textNodes}</span>
  )
}
