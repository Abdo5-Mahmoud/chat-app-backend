import * as dbServices from "../../../DB/db.service.js";
import { userModel } from "../../../DB/models/User.model.js";
import { emailEvent } from "../../../utils/events/email.events.js";
import { asyncHandler } from "../../../utils/res/error.res.js";
import { success } from "../../../utils/res/success.res.js";
import {
  compareHash,
  generateHash,
} from "../../../utils/security/hash.security.js";
export const signup = asyncHandler(async (req, res, next) => {
  // console.log("here");

  // console.log(req.body);
  const { name, email, password, gender, twoStepVerification = 0 } = req.body;
  const user = await dbServices.findOne({
    model: userModel,
    filter: { email },
  });
  if (user) return next(new Error("email already exist", { cause: 409 }));
  const hashedPassword = generateHash({ plaintText: password });

  await dbServices.create({
    model: userModel,
    data: {
      name,
      email,
      password: hashedPassword,
      gender,
      twoStepVerification,
    },
  });

  // console.log("done");
  emailEvent.emit("sendConfirmEmail", { email, next });
  return success({
    res,
    statusCode: 201,
    data: {
      message:
        "user created successfully, please check your email to verify your account",
      username: name,
      email,
    },
  });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await dbServices.findOne({
    model: userModel,
    filter: { email },
  });

  if (!user) return next(new Error("user not found", { cause: 404 }));

  if (user.isConfirmed)
    return next(new Error("email already confirmed", { cause: 409 }));
  // console.log(user.otpExp);
  // console.log(Date.now());

  if (user.otpExp < Date.now())
    return next(new Error("otp expired", { cause: 400 }));

  const comparedResult = compareHash({
    plaintText: otp,
    hashValue: user.confirmEmailOtp,
  });
  // console.log(comparedResult);

  if (!comparedResult) return next(new Error("invalid otp", { cause: 400 }));

  const dataUnset = {
    confirmEmailOtp: 1,
    otpExp: 1,
    otpCounter: 1,
    otpTimer: 1,
  };
  await dbServices.updateOne({
    model: userModel,
    filter: { email },
    data: { isConfirmed: true, $unset: { ...dataUnset } },
  });
  return success({
    res,
    statusCode: 200,
    data: {
      message: "email confirmed successfully",
    },
  });
});

export const resendOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await dbServices.findOne({
    model: userModel,
    filter: { email },
  });
  if (!user) return next(new Error("user not found", { cause: 404 }));
  if (user.isConfirmed)
    return next(new Error("email already confirmed", { cause: 409 }));

  if (user.otpTimer > Date.now())
    return next(new Error("please wait 5 minutes", { cause: 400 }));
  emailEvent.emit("sendConfirmEmail", { email, next });

  return success({
    res,
    statusCode: 200,
    data: {
      message:
        "otp sent successfully, please check your email to verify your account",
    },
  });
});
