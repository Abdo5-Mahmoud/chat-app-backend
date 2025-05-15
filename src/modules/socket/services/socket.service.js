import { socketConnections } from "../../../DB/models/User.model.js";
import * as dbService from "../../../DB/db.service.js";
import roomModel from "../../../DB/models/Room.model.js";
import { authenticationSocket } from "../authSocket.js";
import { chatModel } from "../../../DB/models/chat.model.js";
export const registerSocket = async (socket) => {
  try {
    const { data } = await authenticationSocket({
      socket,
    });
    // console.log(data);

    if (!data.valid) {
      return {
        data: {
          statusCode: 400,
          message: "User not found",
        },
      };
    }
    const userId = data?.user?._id?.toString();
    if (userId) socketConnections.set(userId, socket.id);

    // console.log(socketConnections);
    return {
      ...data,
      image: data.user.image.secure_url,
    };
  } catch (err) {
    console.error("Error in registerSocket:", error);
    return {
      data: {
        statusCode: 500,
        message: "Internal server error",
      },
    };
  }
};

export const logoutSocket = async (socket) => {
  try {
    return socket.on("disconnect", async () => {
      const { data } = await authenticationSocket({
        socket,
      });
      if (!data.valid) {
        return socket.emit("socketErrorResp", {
          statusCode: 400,
          message: "User not found",
        });
      }
      socketConnections.delete(data?.user?._id?.toString());
      // console.log(socketConnections);
      return "Done";
    });
  } catch (err) {
    console.error("Error in logoutSocket:", error);
    socket.emit("socketErrorResp", {
      statusCode: 500,
      message: "Internal server error",
    });
  }
};

export const joinRoom = async ({ socket, info }) => {
  const { roomId, userId } = info;

  const {
    data: { user, valid },
  } = await authenticationSocket({
    socket,
  });
  // console.log(user);

  if (!valid) {
    return {
      statusCode: 400,
      message: "User not found",
    };
  }
  // console.log(data);
  const messageS = `${user?.name} has joined the chat`;
  const room = await dbService.findOneAndUpdate({
    model: roomModel,
    filter: { _id: roomId },
    data: {
      $addToSet: { users: userId },
      $push: {
        messages: {
          message: messageS,
          type: "system",
        },
      },
    },
    options: { new: true },
  });
  // console.log(room.users);
  // const filteredSocketId = (room.users || []).map((user) => {
  //   if (socketConnections.has(user._id.toString())) return user._id.toString();
  // });
  return { message: messageS, type: "system" };
};

export const sendMessageToFriend = async ({ socket, info }) => {
  const { roomId, message, mainUser } = info;
  const {
    data: { user, valid },
  } = await authenticationSocket({
    socket,
  });
  // console.log(roomId, message, mainUser);
  if (!valid) {
    return {
      statusCode: 400,
      message: "User not found",
    };
  }
  const chat = await dbService.findOneAndUpdate({
    model: chatModel,
    filter: { _id: roomId },
    data: {
      $push: {
        messages: {
          message: message,
          senderId: user._id.toString(),
        },
      },
    },
    select: "-createdAt -updatedAt -__v",
    options: { new: true },
  });
  const toId =
    chat.mainUser.toString() == user._id.toString()
      ? chat.subParticipant.toString()
      : chat.mainUser.toString();
  // console.log(socketConnections[toId]);
  // console.log(socketConnections.get(toId));
  // console.log(chat);
  console.log(socketConnections);
  console.log(socketConnections.get(toId));

  socket.to(`${socketConnections.get(toId)}`).emit("reciveMessage", {
    roomId: chat._id.toString(),
    message,
    senderId: user._id.toString(),
    type: "user",
    mainUser: mainUser,
    subParticipant: chat.subParticipant,
  });
  // console.log("done");

  return {
    message: "done",
  };
};

export const leaveRoom = async ({ socket, info }) => {
  const { roomId, userId } = info;

  const {
    data: { user, valid },
  } = await authenticationSocket({
    socket,
  });
  // console.log(data);

  if (!valid) {
    return {
      statusCode: 400,
      message: "User not found",
    };
  }
  console.log(roomId);
  const messageS = `${user?.username} has left the chat`;
  const room = await dbService.findOneAndUpdate({
    model: roomModel,
    filter: { _id: roomId },
    data: {
      $pull: { users: userId },
      $push: {
        messages: {
          message: messageS,
          type: "system",
        },
      },
    },
    options: { new: true },
  });
  console.log(room);
  socket.emit("successMessage", { message: "left" });
  socket.broadcast.emit("reciveMessage", { message: messageS });
  socketConnections.delete(user?._id?.toString());

  return { message: "Done" };
};

export const sendMessage = async ({ socket, info }) => {
  const { roomId, message, mainUser } = info;

  const {
    data: { user, valid },
  } = await authenticationSocket({
    socket,
  });
  // console.log({ user, valid });

  if (!valid) {
    return {
      statusCode: 400,
      message: "User not found",
    };
  }

  const room = await dbService.findOneAndUpdate({
    model: roomModel,
    filter: { _id: roomId },
    data: {
      $push: {
        messages: {
          message: message,
          senderId: user._id.toString(),
        },
      },
    },
    options: { new: true },
  });
  // const filteredSocketId = room.users.map((user) => {
  //   if (socketConnections.has(user._id.toString())) return user._id.toString();
  // });
  // console.log(filteredSocketId);

  // console.log(room);
  // socket.emit("successMessage", { message: "Joined" });
  // socket.to(filteredSocketId).emit("reciveMessage", { message });
  return {
    roomId: room._id.toString(),
    message,
    senderId: user._id.toString(),
    type: "user",
  };
};
