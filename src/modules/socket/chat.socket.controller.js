import { socketConnections } from "../../DB/models/User.model.js";
import {
  joinRoom,
  leaveRoom,
  logoutSocket,
  registerSocket,
  sendMessage,
  sendMessageToFriend,
} from "./services/socket.service.js";
import { Server } from "socket.io";
export const runIo = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: "*",
  });

  return io.on("connection", async (socket) => {
    const data = await registerSocket(socket);
    // console.log(data);

    socket.on("logOut", async () => {
      await logoutSocket(socket);
    });

    // socket.on("joinRoom", async (info) => {
    //   // console.log(info);

    //   // let roomSockets = io.sockets.adapter.rooms.get(info.roomId);
    //   // // console.log("Users in room before:", roomSockets ? roomSockets.size : 0);
    //   socket.join(info.roomId);

    //   const data = await joinRoom({ info, socket });

    //   data.roomId = info.roomId;
    //   io.to(info.roomId).emit("userJoined", { data });
    // });

    socket.on("sendMessage", async (info) => {
      if (info.mainUser) {
        const data = await sendMessageToFriend({ socket, info });
      } else {
        const data = await sendMessage({ info, socket });
        io.emit("reciveMessage", data);
      }
    });
    socket.on("leaveRoom", async (info) => {
      await leaveRoom({ info, socket });
    });
  });
};
