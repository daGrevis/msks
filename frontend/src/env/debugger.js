import _ from 'lodash'
import fp from 'lodash/fp'
import uuidv4 from 'uuid/v4'

import store from '../store'
import * as actions from '../store/actions'
import * as selectors from '../store/selectors'
import socket from '../networking/socket'
import http from '../networking/http'
import { colorize, bold, italic, underline } from '../irc/text'

window._ = _
window.fp = fp
window.uuidv4 = uuidv4
window.store = store
window.dispatch = store.dispatch
window.getState = store.getState
window.actions = actions
window.selectors = selectors
window.socket = socket
window.http = http
window.colorize = colorize
window.bold = bold
window.italic = italic
window.underline = underline

store.subscribe(() => {
  window.st = store.getState()
})
