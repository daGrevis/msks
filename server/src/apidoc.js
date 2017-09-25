/**
 * @apiDefine Messages
 * @apiSuccess (200) {Object[]} messages
 * @apiSuccess (200) {String} messages.id Message ID
 * @apiSuccess (200) {String=message,notice,action,join,quit,part,kick,nick,topic,mode} messages.kind Message kind
 * @apiSuccess (200) {String} messages.timestamp Timestamp (ISO 8601)
 * @apiSuccess (200) {String} messages.from Nick of message author
 * @apiSuccess (200) {String} messages.to Nick or channel
 * @apiSuccess (200) {String} messages.text Message text
 * @apiSuccess (200) {Boolean} [messages.isOp] Is operator?
 * @apiSuccess (200) {Boolean} [messages.isVoiced] Is voiced?
 * @apiSuccess (200) {String} [messages.kicked] Kicked nick (only when message kind is `kick`)
 * @apiSuccess (200) {String} [messages.newNick] New nick (only when message kind is `nick`)
 * @apiSuccess (200) {String} [messages.param] Target nick (only when message kind is `mode`)
 */

/**
 * @apiDefine PayloadMessages
 * @apiParam {Object[]} payload.messages
 * @apiParam {String} payload.messages.id Message ID
 * @apiParam {String=message,notice,action,join,quit,part,kick,nick,topic,mode} payload.messages.kind Message kind
 * @apiParam {String} payload.messages.timestamp Timestamp (ISO 8601)
 * @apiParam {String} payload.messages.from Nick of message author
 * @apiParam {String} payload.messages.to Nick or channel
 * @apiParam {String} payload.messages.text Message text
 * @apiParam {Boolean} [payload.messages.isOp] Is operator?
 * @apiParam {Boolean} [payload.messages.isVoiced] Is voiced?
 * @apiParam {String} [payload.messages.kicked] Kicked nick (only when message kind is `kick`)
 * @apiParam {String} [payload.messages.newNick] New nick (only when message kind is `nick`)
 * @apiParam {String} [payload.messages.param] Target nick (only when message kind is `mode`)
 */

/**
 * @api {get} /api/commands/ping /commands/ping
 * @apiName commandPing
 * @apiGroup REST
 * @apiDescription
 * Example: [/api/commands/ping](https://dagrev.is/msks/api/commands/ping)
 *
 * @apiSuccess (200) {String="pong"} -
 */

/**
 * @api {get} /api/commands/echo /commands/echo/:param
 * @apiName commandEcho
 * @apiGroup REST
 * @apiDescription
 * Example: [/api/commands/echo/42](https://dagrev.is/msks/api/commands/echo/42)
 *
 * @apiParam {String} param Param to echo out
 *
 * @apiSuccess (200) {String} - Given param
 */

/**
 * @api {get} /api/commands/uptime /commands/uptime
 * @apiName commandUptime
 * @apiGroup REST
 * @apiDescription
 * Example: [/api/commands/uptime](https://dagrev.is/msks/api/commands/uptime)
 *
 * @apiSuccess (200) {String} - Uptime
 */

/**
 * @api {get} /api/commands/version /commands/version
 * @apiName commandVersion
 * @apiGroup REST
 * @apiDescription
 * Example: [/api/commands/version](https://dagrev.is/msks/api/commands/version)
 *
 * @apiSuccess (200) {String} - Version
 */

/**
 * @api {get} /api/channels /channels
 * @apiName getChannels
 * @apiGroup REST
 * @apiDescription Get channels
 *
 * Example: [/api/channels](https://dagrev.is/msks/api/channels)
 *
 * @apiSuccess (200) {Object[]} channels
 * @apiSuccess (200) {String} channels.name Channel name
 * @apiSuccess (200) {String} [channels.topic] Channel topic
 */

/**
 * @api {get} /api/users /users
 * @apiName getUsers
 * @apiGroup REST
 * @apiDescription Get users
 *
 * Example: [/api/users?channel=%23developerslv](https://dagrev.is/msks/api/users?channel=%23developerslv)
 *
 * @apiParam {String} channel Channel
 * @apiParam {String} [nick] Nick
 *
 * @apiSuccess (200) {String} channel Channel
 * @apiSuccess (200) {String} nick Nick
 * @apiSuccess (200) {Object[]} users
 * @apiSuccess (200) {String} users.id User ID
 * @apiSuccess (200) {String} users.channel Channel
 * @apiSuccess (200) {String} users.nick Nick
 * @apiSuccess (200) {Boolean} [users.isOp] Is operator?
 * @apiSuccess (200) {Boolean} [users.isVoiced] Is voiced?
 */

/**
 * @api {get} /api/messages/:messageId /messages/:messageId
 * @apiName getMessage
 * @apiGroup REST
 * @apiDescription Get single message
 *
 * Example: [/api/messages/9fab58f4-da9c-4169-b89a-029ff72e7d72](https://dagrev.is/msks/api/messages/9fab58f4-da9c-4169-b89a-029ff72e7d72)
 *
 * @apiParam {String} messageId Message ID
 *
 * @apiSuccess (200) {String} id Message ID
 * @apiSuccess (200) {String=message,notice,action,join,quit,part,kick,nick,topic,mode} kind Message kind
 * @apiSuccess (200) {String} timestamp Timestamp (ISO 8601)
 * @apiSuccess (200) {String} from Nick of message author
 * @apiSuccess (200) {String} to Nick or channel
 * @apiSuccess (200) {String} text Message text
 * @apiSuccess (200) {Boolean} [isOp] Is operator?
 * @apiSuccess (200) {Boolean} [isVoiced] Is voiced?
 * @apiSuccess (200) {String} [kicked] Kicked nick (only when message kind is `kick`)
 * @apiSuccess (200) {String} [newNick] New nick (only when message kind is `nick`)
 * @apiSuccess (200) {String} [param] Target nick (only when message kind is `mode`)
 */

/**
 * @api {get} /api/messages /messages
 * @apiName getMessages
 * @apiGroup REST
 * @apiDescription Get most recent messages
 *
 * Example: [/api/messages?channel=%23developerslv](https://dagrev.is/msks/api/messages?channel=%23developerslv)
 *
 * @apiParam {String} channel Channel
 * @apiParam {Number{1-1000}} [limit=100] Message limit
 *
 * @apiUse Messages
 */

/**
 * @api {get} /api/messages/before/:messageId /messages/before/:messageId
 * @apiName getMessagesBefore
 * @apiGroup REST
 * @apiDescription Get messages before given message ID
 *
 * Example: [/api/messages/before/9fab58f4-da9c-4169-b89a-029ff72e7d72](https://dagrev.is/msks/api/messages/before/9fab58f4-da9c-4169-b89a-029ff72e7d72)
 *
 * @apiParam {String} messageId Message ID
 * @apiParam {Number{1-1000}} [limit=100] Message limit
 *
 * @apiUse Messages
 */

/**
 * @api {get} /api/messages/after/:messageId /messages/after/:messageId
 * @apiName getMessagesAfter
 * @apiGroup REST
 * @apiDescription Get messages after given message ID
 *
 * Example: [/api/messages/after/9fab58f4-da9c-4169-b89a-029ff72e7d72](https://dagrev.is/msks/api/messages/after/9fab58f4-da9c-4169-b89a-029ff72e7d72)
 *
 * @apiParam {String} messageId Message ID
 * @apiParam {Number{1-1000}} [limit=100] Message limit
 *
 * @apiUse Messages
 */

/**
 * @api {get} /api/messages/around/:messageId /messages/around/:messageId
 * @apiName getMessagesAround
 * @apiGroup REST
 * @apiDescription Get messages around given message ID
 *
 * Example: [/api/messages/around/9fab58f4-da9c-4169-b89a-029ff72e7d72](https://dagrev.is/msks/api/messages/around/9fab58f4-da9c-4169-b89a-029ff72e7d72)
 *
 * @apiParam {String} messageId Message ID
 * @apiParam {Number{1-1000}} [limit=150] Message limit
 *
 * @apiUse Messages
 */

/**
 * @api {get} /api/messages/search /messages/search
 * @apiName searchMessages
 * @apiGroup REST
 * @apiDescription Search messages
 *
 * Example: [/api/messages/search?channel=%23developerslv&text=foo](https://dagrev.is/msks/api/messages/search?channel=%23developerslv&text=foo)
 *
 * @apiParam {String} channel Channel
 * @apiParam {String} [text] Search text
 * @apiParam {String} [nick] Search nick
 * @apiParam {Number{1-500}} [limit=50] Message limit
 * @apiParam {String} [messageId] Message ID for pagination
 *
 * @apiSuccess (200) {String} channel Channel
 * @apiSuccess (200) {Object} query Query
 * @apiSuccess (200) {String} [query.text] Search text
 * @apiSuccess (200) {String} [query.nick] Search nick
 * @apiSuccess (200) {Number} limit Message limit
 * @apiUse Messages
 */

/**
 * @api {get} /socket.io CHANNEL_CHANGES
 * @apiName CHANNEL_CHANGES
 * @apiGroup SocketIO/client
 * @apiDescription
 * Dispatched when subscribed to channels
 *
 * @apiParam {String=client/CHANNEL_CHANGES} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {Object[]} payload.changes Changes
 * @apiParam {String} [payload.changes.new_val] New value (when insert or update)
 * @apiParam {String} payload.changes.new_val.name Channel name
 * @apiParam {String} [payload.changes.new_val.topic] Channel topic
 * @apiParam {Object} [payload.changes.old_val] Old value (when delete)
 * @apiParam {String} payload.changes.old_val.name Channel name
 * @apiParam {String} [payload.changes.old_val.topic] Channel topic
 */

/**
 * @api {get} /socket.io USER_CHANGES
 * @apiName USER_CHANGES
 * @apiGroup SocketIO/client
 * @apiDescription
 * Dispatched when subscribed to users
 *
 * @apiParam {String=client/USER_CHANGES} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channelName Channel
 * @apiParam {Object[]} payload.changes Changes
 * @apiParam {String} [payload.changes.new_val] New value (when insert or update)
 * @apiParam {String} payload.changes.new_val.id User ID
 * @apiParam {String} payload.changes.new_val.channel Channel
 * @apiParam {String} payload.changes.new_val.nick Nick
 * @apiParam {Boolean} [payload.changes.new_val.isOp] Is operator?
 * @apiParam {Boolean} [payload.changes.new_val.isVoiced] Is voiced?
 * @apiParam {Object} [payload.changes.old_val] Old value (when delete)
 * @apiParam {String} payload.changes.old_val.id User ID
 * @apiParam {String} payload.changes.old_val.channel Channel
 * @apiParam {String} payload.changes.old_val.nick Nick
 * @apiParam {Boolean} [payload.changes.old_val.isOp] Is operator?
 * @apiParam {Boolean} [payload.changes.old_val.isVoiced] Is voiced?
 */

/**
 * @api {get} /socket.io ADD_MESSAGE
 * @apiName ADD_MESSAGE
 * @apiGroup SocketIO/client
 * @apiDescription
 * Dispatched when subscribed to messages
 *
 * @apiParam {String=client/ADD_MESSAGE} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.id Message ID
 * @apiParam {String=message,notice,action,join,quit,part,kick,nick,topic,mode} payload.kind Message kind
 * @apiParam {String} payload.timestamp Timestamp (ISO 8601)
 * @apiParam {String} payload.from Nick of message author
 * @apiParam {String} payload.to Nick or channel
 * @apiParam {String} payload.text Message text
 * @apiParam {Boolean} [payload.isOp] Is operator?
 * @apiParam {Boolean} [payload.isVoiced] Is voiced?
 * @apiParam {String} [payload.kicked] Kicked nick (only when message kind is `kick`)
 * @apiParam {String} [payload.newNick] New nick (only when message kind is `nick`)
 * @apiParam {String} [payload.param] Target nick (only when message kind is `mode`)
 */

/**
 * @api {get} /socket.io SET_MESSAGES
 * @apiName SET_MESSAGES
 * @apiGroup SocketIO/client
 * @apiDescription
 * Sets mesages
 *
 * @apiParam {String=client/SET_MESSAGES} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channel Channel
 * @apiParam {Number} payload.limit Message limit
 * @apiUse PayloadMessages
 */

/**
 * @api {get} /socket.io SET_MESSAGES_BEFORE
 * @apiName SET_MESSAGES_BEFORE
 * @apiGroup SocketIO/client
 * @apiDescription
 * Sets mesages before given message ID
 *
 * @apiParam {String=client/SET_MESSAGES_BEFORE} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channel Channel
 * @apiParam {String} payload.messageId Message ID
 * @apiParam {Number} payload.limit Message limit
 * @apiUse PayloadMessages
 */

/**
 * @api {get} /socket.io SET_MESSAGES_AFTER
 * @apiName SET_MESSAGES_AFTER
 * @apiGroup SocketIO/client
 * @apiDescription
 * Sets mesages after given message ID
 *
 * @apiParam {String=client/SET_MESSAGES_AFTER} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channel Channel
 * @apiParam {String} payload.messageId Message ID
 * @apiParam {Number} payload.limit Message limit
 * @apiUse PayloadMessages
 */

/**
 * @api {get} /socket.io SET_MESSAGES_AROUND
 * @apiName SET_MESSAGES_AROUND
 * @apiGroup SocketIO/client
 * @apiDescription
 * Sets mesages around given message ID
 *
 * @apiParam {String=client/SET_MESSAGES_AFTER} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channel Channel
 * @apiParam {String} payload.messageId Message ID
 * @apiParam {Number} payload.limit Message limit
 * @apiUse PayloadMessages
 */

/**
 * @api {get} /socket.io FOUND_MESSAGES
 * @apiName FOUND_MESSAGES
 * @apiGroup SocketIO/client
 * @apiDescription
 * Sets mesages from search
 *
 * @apiParam {String=client/FOUND_MESSAGES} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channel Channel
 * @apiParam {Object} payload.query Search query
 * @apiParam {String} [query.text] Text
 * @apiParam {String} [query.nick] Nick
 * @apiParam {String} payload.messageId Message ID
 * @apiParam {Number} payload.limit Message limit
 * @apiUse PayloadMessages
 */

/**
 * @api {get} /socket.io SUBSCRIBE_TO_CHANNELS
 * @apiName SUBSCRIBE_TO_CHANNELS
 * @apiGroup SocketIO/server
 * @apiDescription
 * Subscribe to channels by dispatching `client/CHANNEL_CHANGES` action on channel changes (batched)
 *
 * @apiParam {String=server/SUBSCRIBE_TO_CHANNELS} type Action type
 */

/**
 * @api {get} /socket.io SUBSCRIBE_TO_USERS
 * @apiName SUBSCRIBE_TO_USERS
 * @apiGroup SocketIO/server
 * @apiDescription
 * Subscribe to users by dispatching `client/USER_CHANGES` action on user changes (batched)
 *
 * @apiParam {String=server/SUBSCRIBE_TO_USERS} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channelName Channel
 */

/**
 * @api {get} /socket.io SUBSCRIBE_TO_MESSAGES
 * @apiName SUBSCRIBE_TO_MESSAGES
 * @apiGroup SocketIO/server
 * @apiDescription
 * Subscribe to messages by dispatching `client/ADD_MESSAGE` action on new message, doesn't include initial messages
 *
 * @apiParam {String=server/SUBSCRIBE_TO_MESSAGES} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channelName Channel
 */

/**
 * @api {get} /socket.io GET_MESSAGES
 * @apiName GET_MESSAGES
 * @apiGroup SocketIO/server
 * @apiDescription
 * Get most recent messages by dispatching `client/SET_MESSAGES` action
 *
 * @apiParam {String=server/GET_MESSAGES} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channelName Channel
 * @apiParam {Number{1-1000}} [payload.limit=100] Message limit
 */

/**
 * @api {get} /socket.io GET_MESSAGES_BEFORE
 * @apiName GET_MESSAGES_BEFORE
 * @apiGroup SocketIO/server
 * @apiDescription
 * Get messages before given message ID by dispatching `client/SET_MESSAGES_BEFORE` action
 *
 * @apiParam {String=server/GET_MESSAGES_BEFORE} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.messageId Message ID
 * @apiParam {Number{1-1000}} [payload.limit=100] Message limit
 */

/**
 * @api {get} /socket.io GET_MESSAGES_AFTER
 * @apiName GET_MESSAGES_AFTER
 * @apiGroup SocketIO/server
 * @apiDescription
 * Get messages after given message ID by dispatching `client/SET_MESSAGES_AFTER` action
 *
 * @apiParam {String=server/GET_MESSAGES_AFTER} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.messageId Message ID
 * @apiParam {Number{1-1000}} [payload.limit=100] Message limit
 */

/**
 * @api {get} /socket.io GET_MESSAGES_AROUND
 * @apiName GET_MESSAGES_AROUND
 * @apiGroup SocketIO/server
 * @apiDescription
 * Get messages around given message ID by dispatching `client/SET_MESSAGES_AROUND` action
 *
 * @apiParam {String=server/GET_MESSAGES_AROUND} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.messageId Message ID
 * @apiParam {Number{1-1000}} [payload.limit=150] Message limit
 */

/**
 * @api {get} /socket.io SEARCH_MESSAGES
 * @apiName SEARCH_MESSAGES
 * @apiGroup SocketIO/server
 * @apiDescription
 * Search messages by dispatching `client/FOUND_MESSAGES` action
 *
 * @apiParam {String=server/SEARCH_MESSAGES} type Action type
 * @apiParam {Object} payload Action payload
 * @apiParam {String} payload.channel Channel
 * @apiParam {Object} [payload.query] Search query
 * @apiParam {String} [payload.query.text] Text
 * @apiParam {String} [payload.query.nick] Nick
 * @apiParam {Number{1-500}} [payload.limit=50] Message limit
 * @apiParam {String} [payload.messageId] Message ID for pagination
 */
