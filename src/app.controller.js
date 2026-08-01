import cors from "cors";
import { connectDB } from "./DB/connection.js";
import authRouter from "./modules/auth/auth.controller.js";
import userRouter from "./modules/user/user.controller.js";
import { globalErrorHandling } from "./utils/res/error.res.js";
import roomRouter from "./modules/room/room.controller.js";
import chatRouter from "./modules/chats/chat.controller.js";
import messageRouter from "./modules/messages/messages.controller.js";
export const bootstrap = (app, express) => {
  app.use("*", cors());
  app.use(express.json());

  app.use("/auth", authRouter);
  app.use("/room", roomRouter);
  app.use("/chat", chatRouter);
  app.use("/messages", messageRouter);
  app.use("/user", userRouter);

  app.use(globalErrorHandling);

  connectDB();
};
