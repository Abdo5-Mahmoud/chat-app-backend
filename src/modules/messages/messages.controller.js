import { Router } from "express";
import { authentication } from "../../middleware/auth.middleware.js";
import * as roomServices from "./services/messages.service.js";
const messageRouter = Router();

// chatRouter.get("/all", authentication(), roomServices.getAllUsers);
messageRouter.get(
  "/:roomId",
  authentication(),
  roomServices.getMessagesByChatId,
);
// messageRouter.delete("/:friendId", authentication(), roomServices.deleteChat);
export default messageRouter;
