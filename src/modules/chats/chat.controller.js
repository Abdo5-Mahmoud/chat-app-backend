import { Router } from "express";
import { authentication } from "../../middleware/auth.middleware.js";
import * as roomServices from "./services/chat.service.js";
const chatRouter = Router();

// chatRouter.get("/all", authentication(), roomServices.getAllUsers);
chatRouter.get("/allChats", authentication(), roomServices.allChats);
chatRouter.get("/:friendId", authentication(), roomServices.startChat);
chatRouter.delete("/:friendId", authentication(), roomServices.deleteChat);
export default chatRouter;
