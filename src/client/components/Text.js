import React from 'react'
import _ from 'lodash'
import fp from 'lodash/fp'

export default props => {
  const { children: text } = props

  const linkPattern = /([a-z]+:\/\/[^,\s]+)/g

  const parts = fp.filter(s => s !== '')(text.split(linkPattern))

  const textNodes = _.map(parts, (part, i) => {
    if (linkPattern.test(part)) {
      return <a key={i} href={part} target='_blank'>{part}</a>
    } else {
      return <span key={i}>{part}</span>
    }
  })

  return <span>{textNodes}</span>
}
