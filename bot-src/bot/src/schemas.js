const Promise = require('bluebird')
const Joi = require('joi')

const validate = Promise.promisify(Joi.validate)

const Channel = Joi.object().keys({
  name: Joi.string().required(),
  topic: Joi.string(),
})

const User = Joi.object().keys({
  id: Joi.array().required().items(Joi.ref('channel'), Joi.ref('nick')),
  channel: Joi.string().required(),
  nick: Joi.string().required(),
  isOp: Joi.boolean(),
  isVoiced: Joi.boolean(),
})

const Message = Joi.object().keys({
  kind: Joi.any().valid([
    'message',
    'notice',
    'action',
    'join',
    'quit',
    'part',
    'kick',
    'nick',
    'topic',
    'mode',
  ]),
  timestamp: Joi.date().required(),
  from: Joi.string().required(),
  to: Joi.string().required(),
  text: Joi.string().required().allow(''),

  kicked: Joi.string().when('kind', { is: 'kick', then: Joi.required() }),
  newNick: Joi.string().when('kind', { is: 'nick', then: Joi.required() }),
  param: Joi.string().when('kind', { is: 'mode', then: Joi.required() }),
})

module.exports = {
  validate,

  Channel,
  User,
  Message,
}
