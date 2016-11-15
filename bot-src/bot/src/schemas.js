const Joi = require('joi')

const Channel = Joi.object().keys({
  name: Joi.string().required(),
  topic: Joi.string(),
})

const ActiveUser = Joi.object().keys({
  nick: Joi.string().required(),
  channel: Joi.string().required(),
})

const Message = Joi.object().keys({
  from: Joi.string().required(),
  to: Joi.string().required(),
  text: Joi.string().required(),
  kind: Joi.any().valid(['message', 'action']),
  timestamp: Joi.date().required(),
})

module.exports = {
  Channel,
  ActiveUser,
  Message,
}
