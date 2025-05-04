import { Router } from "express";
import * as userServices from "./services/user.service.js";
import { authentication } from "../../middleware/auth.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as userValidation from "./user.validation.js";
import {
  fileValidationTypes,
  uploadCloudfile,
} from "../../utils/multer/cloud.multer.js";

const userRouter = Router();

userRouter.get("/profile", authentication(), userServices.porfile);
userRouter.get(
  "/getAllUsers",
  authentication(),
  userServices.getAllUsersWithChats
);
userRouter.get("/:userId", authentication(), userServices.getUser);
userRouter.patch(
  "/addFriend/:friendId",
  validation(userValidation.addAndAcceptValidation),
  authentication(),
  userServices.addFriend
);

// apis for friends add /remove / block
userRouter.patch(
  "/acceptRequest/:friendId",
  validation(userValidation.addAndAcceptValidation),
  authentication(),
  userServices.acceptRequest
);
userRouter.patch(
  "/removeFriend/:friendId",
  validation(userValidation.addAndAcceptValidation),
  authentication(),
  userServices.removeFriend
);
userRouter.patch(
  "/blockUser/:friendId",
  validation(userValidation.addAndAcceptValidation),
  authentication(),
  userServices.blockUser
);

// for image and background img
userRouter.patch(
  "/updateImage",
  authentication(),
  uploadCloudfile(fileValidationTypes.image).single("image"),
  userServices.updateImageCloud
);
export default userRouter;
