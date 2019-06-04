import fp from 'lodash/fp'
import axios from 'axios'
import axiosRetry from 'axios-retry'

import config from '../env/config'
import store from '../store'

const RETRY_DELAYS = [
  1000,
  2000,
  3000,
  4000,
  5000,
  5000,
  5000,
  10000,
  10000,
  10000,
  30000,
]

const http = axios.create({
  baseURL: config.basePath,
  timeout: 30000,
})

http.interceptors.request.use(config => {
  const state = store.getState()
  const { session } = state

  if (!session) {
    return config
  }

  return fp.update(
    'headers.common',
    fp.pipe(
      fp.set('X-Session-ID', session.id),
      fp.set('X-Token', session.token),
    ),
    config,
  )
})

axiosRetry(http, {
  retries: Infinity,
  shouldResetTimeout: true,
  retryDelay: retryCount => {
    const delay =
      RETRY_DELAYS[retryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
    return delay
  },
})

export default http
