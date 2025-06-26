// ==== utils/validatePerson.js ====
const Joi = require('joi');
const personSchema = Joi.object({
  userId: Joi.string(),
  firstName: Joi.string().required(),
  middleName: Joi.string().optional(),
  lastName: Joi.string().required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  dateOfBirth: Joi.date().required(),
  age: Joi.number().min(0).required(),
  address: Joi.object({
    flatNumber: Joi.string().required(),
    societyName: Joi.string().required(),
    streetName: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pinCode: Joi.string().required()
  }),
  phoneNumber: Joi.string(),
  mobileNumber: Joi.string().required(),
  physicalDisability: Joi.string(),
  maritalStatus: Joi.string(),
  educationStatus: Joi.string(),
  birthSign: Joi.string()
});
module.exports = personSchema;