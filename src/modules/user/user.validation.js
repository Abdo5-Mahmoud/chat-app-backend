import Joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

export const addAndAcceptValidation = Joi.object().keys({
  friendId: generalFields.id.required(),
});

