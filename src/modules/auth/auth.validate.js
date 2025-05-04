import Joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

export const signupValidate = Joi.object().keys({
  name: generalFields.name.required(),
  email: generalFields.email.required(),
  password: generalFields.password.required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "string.base": "Confirm Password should be a type of text",
    "string.empty": "Confirm Password cannot be empty",
    "any.only": "Confirm Password must match the password",
    "any.required": "Confirm Password is a required field",
  }),
  gender: generalFields.gender.default("male"),
  twoStepVerification: Joi.boolean().messages({
    "boolean.base": "Two-step verification should be a type of boolean",
  }),
});

// Resend OTP validation schema with custom error messages
export const resendOtp = Joi.object().keys({
  email: generalFields.email.required(),
});

// OTP validation schema with custom error messages
export const otp = Joi.object().keys({
  email: generalFields.email.required(),
  otp: generalFields.otp.required(),
});

// Login validation schema with custom error messages
export const loginValidate = Joi.object().keys({
  email: generalFields.email.required(),
  password: generalFields.password.required(),
});
