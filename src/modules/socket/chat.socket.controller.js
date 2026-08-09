import { Server } from "socket.io";
import {
  leaveRoom,
  logoutSocket,
  registerSocket,
  sendMessageToFriend,
  updateMessageStatus,
  updateReadMessageStatus,
} from "./services/socket.service.js";
import { socketConnections } from "../../DB/models/User.model.js";

export const runIo = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: "*",
  });

  return io.on("connection", async (socket) => {
    const { user, valid } = await registerSocket(socket);
    socket.user = user;

    if (user?._id) {
      const userIdStr = user._id.toString();
      // Send active online users list to connected user
      socket.emit("getOnlineUsers", Array.from(socketConnections.keys()));
      // Broadcast to other clients that this user is online
      socket.broadcast.emit("userOnline", { userId: userIdStr });
    }

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

    socket.on("disconnect", async () => {
      const disconnectedUserId = socket.user?._id?.toString();
      await logoutSocket(socket);
      if (disconnectedUserId) {
        io.emit("userOffline", { userId: disconnectedUserId });
      }
    });

    socket.on("sendMessage", async (info, callback) => {
      try {
        const { receiverId, ...data } = await sendMessageToFriend({
          socket,
          info,
        });

        const receiverSocketId = socketConnections.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", data);
        }
        socket.emit("messageSent", data);
        callback?.({ ok: true, data });
      } catch (error) {
        const payload = {
          message: error.message || "Unable to send message",
          statusCode: error.cause || 500,
        };
        socket.emit("messageError", payload);
        callback?.({ ok: false, error: payload });
      }
    });

    socket.on("viewedMessages", async (info) => {
      const data = await updateReadMessageStatus({ socket, info });

      if (data.statusCode == 200) {
        const socketId = socketConnections.get(data.senderId);
        if (socketId) {
          socket.to(socketId).emit("messagesSeen", {
            message: "Seen",
            roomId: info.roomId,
          });
        }
      }
    });

    socket.on("leaveRoom", async (info) => {
      await leaveRoom({ info, socket });
    });
  });
};
