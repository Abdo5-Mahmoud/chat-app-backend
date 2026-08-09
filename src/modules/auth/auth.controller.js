import { Router } from "express";
import * as signupServices from "./services/regestration.service.js";
import * as loginServices from "./services/login.service.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validationFields from "./auth.validate.js";
import { authentication } from "../../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post(
  "/signup",
  validation(validationFields.signupValidate),
  signupServices.signup
);
authRouter.post("/logout", authentication(), loginServices.logout);

authRouter.patch(
  "/confirmEmail",
  validation(validationFields.otp),
  signupServices.confirmEmail
);

authRouter.post(
  "/resendOtp",
  validation(validationFields.resendOtp),
  signupServices.resendOtp
);

authRouter.post(
  "/login",
  validation(validationFields.loginValidate),
  loginServices.login
);
authRouter.post(
  "/loginWithGmail",
  // validation(validationFields.loginValidate),
  loginServices.loginWithGmail
);
export default authRouter;
