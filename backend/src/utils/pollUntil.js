const pollUntil = (success, interval = 1000) =>
  new Promise(resolve => {
    let attempt = 0

    const check = (skipTimeout = false) => {
      setTimeout(
        () => {
          attempt += 1
          success(attempt)
            .then(resolve)
            .catch(() => {
              check()
            })
        },
        skipTimeout ? 0 : interval,
      )
    }

    check(true)
  })

module.exports = pollUntil
