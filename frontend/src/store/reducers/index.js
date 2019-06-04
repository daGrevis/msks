import { concat } from 'redux-fp'

import app from './app'
import router from './router'
import socket from './socket'
import session from './session'
import subscriptions from './subscriptions'
import connections from './connections'
import channels from './channels'
import messages from './messages'
import search from './search'
import users from './users'
import favicon from './favicon'

const rootReducer = (state, action) =>
  concat(
    app,
    router,
    socket,
    session,
    subscriptions,
    connections,
    channels,
    messages,
    search,
    users,
    favicon,
  )(action)(state)

export { rootReducer }
