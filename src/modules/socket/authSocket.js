// import userModel from "../../DB/models/User.model.js";
import * as dbServices from "../../DB/db.service.js";
import {
  socketConnections,
  socketToUser,
  userModel,
} from "../../DB/models/User.model.js";
import { verifyToken } from "../../utils/security/token.security.js";

export const authenticationSocket = async ({
  socket,
  tokenType = "access",
}) => {
  const { authorization } = socket.handshake?.auth;

  // only for postman test
  // const { authorization } = socket.handshake?.headers;
  // console.log("auth", authorization);

  if (!authorization)
    return {
      data: {
        statusCode: 400,
        message: "authorization is required",
      },
    };
  const [bearer, token] = authorization?.split(" ") || [];

  if (!bearer || !token || bearer.toLowerCase() !== "bearer") {
    return {
      data: {
        statusCode: 400,
        message: "Authorization is required or invalid formated",
      },
    };
  }
  let accessSignature = process.env.USER_ACCESS_TOKEN;
  let refreshSignature = process.env.USER_REFRESH_TOKEN;
  // switch (bearer) {
  //   case roleTypes.admin:
  //     accessSignature = process.env.ADMIN_ACCESS_TOKEN;
  //     refreshSignature = process.env.ADMIN_REFRESH_TOKEN;
  //     break;
  //   case roleTypes.user:
  //     accessSignature = process.env.USER_ACCESS_TOKEN;
  //     refreshSignature = process.env.USER_REFRESH_TOKEN;
  //     break;
  //   default:
  //     throw (new Error("Invalid token payload", ));
  // }
  const decoded = verifyToken({
    token,
    signature: tokenType == "access" ? accessSignature : refreshSignature,
  });

  if (!decoded.id)
    return {
      data: {
        statusCode: 400,
        message: "Invalid token payload",
      },
    };

  const user = await dbServices.findOne({
    model: userModel,
    filter: { _id: decoded.id },
    select: "_id name image",
  });

  if (!user)
    return {
      data: {
        statusCode: 400,
        message: "User not found",
      },
    };

  if (
    decoded.iat <= parseInt(user?.changeCradinal?.getTime() / 1000) ||
    0
  ) {
    return {
      data: {
        statusCode: 400,
        message: "Please login again",
      },
    };
  }
  socketConnections.set(user._id.toString(), socket.id);
  socketToUser.set(socket.id, user._id.toString());
  return { data: { user, valid: true } };
};
