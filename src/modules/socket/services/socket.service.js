import {
  socketConnections,
  socketToUser,
} from "../../../DB/models/User.model.js";
import * as dbService from "../../../DB/db.service.js";
import roomModel from "../../../DB/models/Room.model.js";
import { authenticationSocket } from "../authSocket.js";
import { MessageModel } from "../../../DB/models/Message.model.js";
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
    return {
      ...data,
      image: data.user.image.secure_url,
    };
  } catch (err) {
    console.error("Error in registerSocket:", err);
    return {
      data: {
        statusCode: 500,
        message: "Internal server error",
      },
    };
  }
};

export const logoutSocket = async (socket) => {
  const { data } = await authenticationSocket({
    socket,
  });
  if (!data.valid) {
    socketConnections.delete(data?.user?._id?.toString());
    return socket.emit("socketErrorResp", {
      statusCode: 400,
      message: "User not found",
    });
  }
  socketConnections.delete(data?.user?._id?.toString());
  return "Disconnected";
};

// export const joinRoom = async ({ socket, info }) => {
//   const { roomId, userId } = info;

//   const {
//     data: { user, valid },
//   } = await authenticationSocket({
//     socket,
//   });
//   // console.log(user);

//   if (!valid) {
//     return {
//       statusCode: 400,
//       message: "User not found",
//     };
//   }
//   // console.log(data);
//   const messageS = `${user?.name} has joined the chat`;
//   const room = await dbService.findOneAndUpdate({
//     model: roomModel,
//     filter: { _id: roomId },
//     data: {
//       $addToSet: { users: userId },
//       $push: {
//         messages: {
//           message: messageS,
//           type: "system",
//         },
//       },
//     },
//     options: { new: true },
//   });
//   // console.log(room.users);
//   // const filteredSocketId = (room.users || []).map((user) => {
//   //   if (socketConnections.has(user._id.toString())) return user._id.toString();
//   // });
//   return { message: messageS, type: "system" };
// };

export const sendMessageToFriend = async ({ socket, info }) => {
  const { message, roomId, receiverId } = info;

  const {
    data: { valid, user, ...errorData },
  } = await authenticationSocket({
    socket,
  });

  if (!valid) {
    console.log(errorData);
    socket.emit("dissconnected", errorData);
    socket.discconect();
    return errorData;
  }
  const senderId = user._id.toString();
  const conversationKey = [senderId, receiverId].sort().join("_");
  let chat;
  if (roomId) {
    chat = await dbService.findOne({
      model: chatModel,
      filter: {
        _id: roomId,
        participants: senderId,
      },
      select: "-createdAt -updatedAt -__v",
      options: { new: true },
    });
  } else {
    chat = await dbService.findOne({
      model: chatModel,
      filter: {
        conversationKey: conversationKey,
      },
      select: "-createdAt -updatedAt -__v",
      options: { new: true },
    });

    if (!chat) {
      chat = await dbService.create({
        model: chatModel,
        data: {
          participants: [senderId, receiverId],
          conversationKey,
        },
      });
    }
  }
  const isUserOnline = socketConnections.has(receiverId);

  const newMessage = await dbService.create({
    model: MessageModel,
    data: {
      roomId: chat._id,
      senderId: senderId,
      message: message,
      messageStatus: isUserOnline ? "delivered" : "sent",
      receiverId,
    },
  });

  chat.lastMessage = message;
  chat.lastMessageAt = new Date();
  await chat.save();

  socket
    .to(socketConnections.get(receiverId))
    .emit("receiveMessage", { message: newMessage });

  socket.emit("messageSent", { message: newMessage });
  return {
    message: "message sent",
  };
};

export const updateMessageStatus = async ({ socket }) => {
  const userId = socket.user._id.toString();
  if (!userId) {
    socket.emit("dissconnected", {
      statusCode: 400,
      message: "User not found",
    });
    socket.disconnect();
    return {
      statusCode: 400,
      message: "User not found",
    };
  }

  const messages = await dbService.findAll({
    model: MessageModel,
    filter: {
      receiverId: userId,
      messageStatus: "sent",
    },
    options: { new: true },
  });

  await dbService.updateMany({
    model: MessageModel,
    filter: { receiverId: userId, messageStatus: "sent" },
    data: { messageStatus: "delivered" },
    options: { new: true },
  });

  if (messages.length) {
    const grouped = Object.groupBy(messages, ({ senderId }) => senderId);
    return { grouped };
  } else {
    return { noMessages: true };
  }
};

export const leaveRoom = async ({ socket, info }) => {
  const { roomId, userId } = info;

  const {
    data: { user, valid },
  } = await authenticationSocket({
    socket,
  });
  if (!valid) {
    return {
      statusCode: 400,
      message: "User not found",
    };
  }
  // console.log(roomId);
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
  // console.log(room);
  socket.emit("successMessage", { message: "left" });
  socket.broadcast.emit("reciveMessage", { message: messageS });
  socketConnections.delete(user?._id?.toString());

  return { message: "Done" };
};

export const sendMessage = async ({ socket, info }) => {
  const { roomId, message } = info;

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
