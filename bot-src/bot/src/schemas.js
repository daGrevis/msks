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
  from: Joi.string().required(),
  to: Joi.string().required(),
  text: Joi.string().required().allow(''),
  kind: Joi.any().valid(['message', 'action']),
  timestamp: Joi.date().required(),
})

module.exports = {
  validate,

  Channel,
  User,
  Message,
}
