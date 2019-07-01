const getVersion = () => {
  const output = process.env.REACT_APP_GIT_VERSION

  if (!output) {
    return
  }

  const [rev, latestTag, commitCount, subject, date] = output.split('\\n')

  return { rev, latestTag, commitCount, subject, date }
}

const version = getVersion()

export { version }
