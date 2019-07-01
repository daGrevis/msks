import React from 'react'

import { version } from '../env/version'

const Version = () => {
  let title
  let children

  if (version) {
    const { rev, latestTag, commitCount, subject, date } = version

    title = `${rev.slice(0, 7)}: "${subject}" of ${date}`
    children = (
      <span>
        <strong>{latestTag}</strong>
        {Number(commitCount) > 0 ? `+${commitCount}` : ''}
      </span>
    )
  } else {
    children = <strong>dev</strong>
  }

  return (
    <a
      href="https://github.com/daGrevis/msks"
      target="_blank"
      rel="noopener noreferrer"
      className="version"
      title={title}
    >
      {children}
    </a>
  )
}

export default Version
