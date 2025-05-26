const Joi = require('joi');

const registerValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().required(),
    countryCode: Joi.string().allow(''),
    userType: Joi.string().valid('Guest', 'Host', 'Admin').default('Guest'),
    documentType: Joi.string().allow(''),
    documentNumber: Joi.string().allow(''),
    alternativeContact: Joi.object({
      email: Joi.string().email().allow(''),
      phone: Joi.string().allow('')
    }),
    emergencyContact: Joi.object({
      name: Joi.string().allow(''),
      phone: Joi.string().allow(''),
      relationship: Joi.string().allow('')
    }),
    paymentInfo: Joi.object({
      cardNumber: Joi.string().allow(''),
      expiryDate: Joi.string().allow(''),
      cvv: Joi.string().allow('')
    })
  });
  
  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });
  
  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation
};