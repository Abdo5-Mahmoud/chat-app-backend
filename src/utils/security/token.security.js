import jwt from "jsonwebtoken";
import * as dbServices from "../../DB/db.service.js";
import { userModel } from "../../DB/models/User.model.js";

export const generateToken = ({
  payload = "",
  signature = process.env.USER_ACCESS_TOKEN,
  expiresIn = "30min",
} = {}) => {
  const token = jwt.sign(payload, signature, { expiresIn });
  return token;
};

export const verifyToken = ({
  token = "",
  signature = process.env.USER_ACCESS_TOKEN,
} = {}) => {
  try {
    const decoded = jwt.verify(token, signature);
    return decoded;
  } catch (err) {
    // console.log(err);

    return new Error("token expired", { cause: 401 });
  }
};

export const decodeToken = async ({
  authorization = "",
  tokenType = "access",
  next,
} = {}) => {
  // const { authorization } = req.headers;
  // console.log(authorization);

  if (!authorization)
    return next(new Error("authorization is required", { cause: 400 }));

  const [bearer, token] = authorization?.split(" ") || [];
  // console.log(authorization);

  if (!bearer || !token) {
    return next(
      new Error("Authorization is required or invalid formated", {
        cause: 400,
      }),
    );
  }
  let accessSignature = "";
  let refreshSignature = "";
  switch (bearer) {
    case "MINE":
      accessSignature = process.env.ADMIN_ACCESS_TOKEN;
      refreshSignature = process.env.ADMIN_REFRESH_TOKEN;
      break;
    case "BEARER":
      accessSignature = process.env.USER_ACCESS_TOKEN;
      refreshSignature = process.env.USER_REFRESH_TOKEN;
      break;
    default:
      return next(new Error("Invalid token payload", { cause: 400 }));
  }
  const decoded = verifyToken({
    token,
    signature: tokenType == "access" ? accessSignature : refreshSignature,
  });
  // console.log(decoded, "decoded");

  if (!decoded.id)
    return next(new Error("Invalid token payload", { cause: 400 }));

  const user = await dbServices.findOne({
    model: userModel,
    filter: { _id: decoded.id },
  });

  if (!user) return next(new Error("User not found", { cause: 404 }));

  if (
    decoded.iat < parseInt(user.changeCridentialTime?.getTime() / 1000) ||
    0
  ) {
    return next(new Error("Please login again", { cause: 400 }));
  }

  return user;
};
