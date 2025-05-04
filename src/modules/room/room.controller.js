import { Router } from "express";
import { authentication } from "../../middleware/auth.middleware.js";
import * as roomServices from "./services/room.service.js";
const roomRouter = Router();

roomRouter.post("/", authentication(), roomServices.createRoom);
roomRouter.get("/all", authentication(), roomServices.getAllRooms);
roomRouter.delete("/:roomId", authentication(), roomServices.deleteRoom);
roomRouter.get("/:roomId", authentication(), roomServices.getRoom);

export default roomRouter;
