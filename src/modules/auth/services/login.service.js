import { asyncHandler } from "../../../utils/res/error.res.js";
import * as dbService from "../../../DB/db.service.js";
import { compareHash } from "../../../utils/security/hash.security.js";
import { generateToken } from "../../../utils/security/token.security.js";
import { success } from "../../../utils/res/success.res.js";
import { proviedersType, userModel } from "../../../DB/models/User.model.js";
import { OAuth2Client } from "google-auth-library";
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await dbService.findOne({
    model: userModel,
    filter: { email, isDeleted: { $exists: false } },
    isConfirmed: true,
  });
  const isMatch = compareHash({
    plaintText: password,
    hashValue: user.password,
  });
  // console.log(isMatch);

  if (!user || !isMatch) {
    return next(new Error("invalid email or password"));
  }
  if (user.twoStepVerification) {
    return res.json({ message: "twoStepVerification" });
  }
  if (user.provider === proviedersType.google) {
    return next(new Error("please login with google", { cause: 409 }));
  }
  if (!user.isConfirmed)
    return next(new Error("please confirm your email", { cause: 400 }));

  const token = generateToken({
    payload: { id: user._id },
    expiresIn: "1d",
    signature: user.isOwner
      ? process.env.ADMIN_ACCESS_TOKEN
      : process.env.USER_ACCESS_TOKEN,
  });

  return success({
    res,
    statusCode: 200,
    message: "login successfully",
    data: { token },
  });
});
export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { credential: idToken } = req.body;
  // console.log(req.body);

  let payload = undefined;
  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID,
    });
    payload = ticket.getPayload();
    // console.log(payload);
  }
  await verify();
  const { name, email, picture, email_verified } = payload;
  // console.log({ name, email, picture, email_verified });

  if (!email_verified)
    return next(new Error("invalid account", { cause: 400 }));

  let user = await dbService.findOne({
    model: userModel,
    filter: { email: payload.email },
  });
  if (user?.provider == proviedersType.system) {
    return next(new Error("in-valid login provider", { cause: 409 }));
  }
  if (!user) {
    await dbService.create({
      model: userModel,
      data: {
        email: email,
        name: name,
        provider: proviedersType.google,
        image: { secure_url: picture },
        isConfirmed: email_verified,
      },
    });
  }
  user = await dbService.findOne({
    model: userModel,
    filter: { email: payload.email },
  });
  const token = generateToken({
    payload: { id: user._id },
    expiresIn: "1d",
    signature: user.isOwner
      ? process.env.ADMIN_ACCESS_TOKEN
      : process.env.USER_ACCESS_TOKEN,
  });
  return success({
    res,
    statusCode: 200,
    data: { message: "login successfully", token },
  });
});
