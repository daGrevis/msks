const Joi = require('joi')

const Message = Joi.object().keys({
  from: Joi.string().required(),
  to: Joi.string().required(),
  text: Joi.string().required(),
  isPrivate: Joi.boolean().required(),
  timestamp: Joi.date().required(),
})

module.exports = {
  Message,
}
