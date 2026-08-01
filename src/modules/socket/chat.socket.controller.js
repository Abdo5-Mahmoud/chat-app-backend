import { Server } from "socket.io";
import {
  leaveRoom,
  logoutSocket,
  registerSocket,
  sendMessage,
  sendMessageToFriend,
  updateMessageStatus,
} from "./services/socket.service.js";
import { socketConnections, socketToUser } from "../../DB/models/User.model.js";
export const runIo = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: "*",
  });

  return io.on("connection", async (socket) => {
    const { user, valid } = await registerSocket(socket);
    socket.user = user;
    // console.log(socketConnections);

    const { grouped, noMessages } = await updateMessageStatus({
      socket,
    });

    if (!noMessages) {
      for (const [senderId, msgs] of Object.entries(grouped)) {
        const socketId = socketConnections.get(senderId);

        if (!socketId) continue;

        io.to(socketId).emit("messagesDelivered", {
          messages: [...msgs],
        });
      }
    }

    socket.on("disconnect", async (data) => {
      const logoutData = await logoutSocket(socket);
      // console.log(logoutData);
    });

    socket.on("sendMessage", async (info) => {
      const data = await sendMessageToFriend({ socket, info });
    });

    socket.on("leaveRoom", async (info) => {
      await leaveRoom({ info, socket });
    });
  });
};
