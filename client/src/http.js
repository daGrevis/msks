import axios from 'axios'

import config from './config'

const RETRY_DELAYS = [1000, 2000, 3000, 4000, 5000]

const http = axios.create({
  baseURL: config.basePath,
  timeout: 30000,
})

http.interceptors.response.use(null, e => {
  e.config._retryAttempt = e.config._retryAttempt || 0
  e.config._retryAttempt += 1

  const backoff = new Promise(resolve => {
    const delay = (
      e.config._retryAttempt > RETRY_DELAYS.length
      ? RETRY_DELAYS[RETRY_DELAYS.length - 1]
      : RETRY_DELAYS[e.config._retryAttempt - 1]
    )

    setTimeout(() => {
      resolve()
    }, delay)
  })

  return backoff.then(() => http(e.config))
})


export default http
