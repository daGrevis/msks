const Joi = require('joi')

const Channel = Joi.object().keys({
  name: Joi.string().required(),
})

const ActiveUser = Joi.object().keys({
  nick: Joi.string().required(),
  channel: Joi.string().required(),
})

const Message = Joi.object().keys({
  from: Joi.string().required(),
  to: Joi.string().required(),
  text: Joi.string().required(),
  isPrivate: Joi.boolean().required(),
  timestamp: Joi.date().required(),
})

module.exports = {
  Channel,
  ActiveUser,
  Message,
}
