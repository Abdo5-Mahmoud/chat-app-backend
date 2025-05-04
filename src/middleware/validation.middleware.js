import Joi from "joi";

export const generalFields = {
  name: Joi.string().min(2).max(30).trim().messages({
    "string.base": "Name should be a type of text",
    "string.empty": "Name cannot be empty",
    "string.min": "Name should have a minimum length of {#limit}",
    "string.max": "Name should have a maximum length of {#limit}",
    "any.required": "Name is a required field",
  }),
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      maxDomainSegments: 3,
      tlds: { allow: ["com", "net", "org"] },
    })
    .messages({
      "string.base": "Email should be a type of text",
      "string.empty": "Email cannot be empty",
      "string.email":
        "Email must be a valid email address with domains like .com, .net, or .org",
      "any.required": "Email is a required field",
    }),
  password: Joi.string()
    .pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/))
    .messages({
      "string.base": "Password should be a type of text",
      "string.empty": "Password cannot be empty",
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one number or special character, and be at least 8 characters long",
      "any.required": "Password is a required field",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).messages({
    "string.base": "Confirm Password should be a type of text",
    "string.empty": "Confirm Password cannot be empty",
    "any.only": "Confirm Password must match the password",
    "any.required": "Confirm Password is a required field",
  }),
  otp: Joi.string().min(4).max(4).messages({
    "string.base": "OTP should be a type of text",
    "string.empty": "OTP cannot be empty",
    "string.min": "OTP must be exactly {#limit} characters long",
    "string.max": "OTP must be exactly {#limit} characters long",
    "any.required": "OTP is a required field",
  }),
  id: Joi.string().min(24).max(24).messages({
    "string.base": "ID should be a type of text",
    "string.empty": "ID cannot be empty",
    "string.min": "ID must be exactly {#limit} characters long",
    "string.max": "ID must be exactly {#limit} characters long",
    "any.required": "ID is a required field",
  }),
  gender: Joi.string().valid("male", "female").messages({
    "string.base": "Gender should be a type of text",
    "string.empty": "Gender cannot be empty",
    "any.only": 'Gender must be either "male" or "female"',
    "any.required": "Gender is a required field",
  }),
};
export const validation = (schema) => {
  return (req, res, next) => {
    const inputs = { ...req.body, ...req.params, ...req.query };

    if (req.file || req.files?.length) {
      inputs.file = { ...req.files, ...req.file };
    }

    const validationError = schema.validate(inputs, { abortEarly: false });
    // console.log(validationError.error);

    if (validationError.error) {
      const error = new Error("there is error in validation");
      error.cause = 400;
      error.details = [...validationError.error.details];
      error.stack = error.stack;
      return next(error);
    }
    next();
  };
};
