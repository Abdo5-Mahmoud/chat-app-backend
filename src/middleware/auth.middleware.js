import { asyncHandler } from "../utils/res/error.res.js";
import { decodeToken } from "../utils/security/token.security.js";
export const authentication = () => {
  return asyncHandler(async (req, res, next) => {
    // console.log("here");
    // console.log(req.headers.authorization);

    req.user = await decodeToken({
      authorization: req.headers.authorization,
      next,
    });

    return next();
  });
};

export const authorization = (accessRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    if (!accessRoles.includes(req.user.role)) {
      return next(new Error("Unauthorized", { cause: 403 }));
    }

    return next();
  });
};
