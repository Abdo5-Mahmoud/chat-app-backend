import {
  socketConnections,
  socketToUser,
  userModel,
} from "../../../DB/models/User.model.js";
import mongoose from "mongoose";
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
  const user = socket.user;
  socketConnections.delete(user?._id?.toString());
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
  const { message, roomId, receiverId } = info || {};

  const user = socket.user;
  const senderId = user._id.toString();

  if (typeof message !== "string" || !message.trim()) {
    const error = new Error("A non-empty message is required");
    error.cause = 400;
    throw error;
  }

  if (
    !receiverId ||
    receiverId === senderId ||
    !mongoose.isValidObjectId(receiverId)
  ) {
    const error = new Error("A valid recipient is required");
    error.cause = 400;
    throw error;
  }

  const receiver = await dbService.findById({
    model: userModel,
    id: receiverId,
    select: "_id blockedUsers",
  });
  if (!receiver) {
    const error = new Error("Recipient was not found");
    error.cause = 404;
    throw error;
  }
  const sender = await dbService.findById({
    model: userModel,
    id: senderId,
    select: "blockedUsers",
  });
  const isBlocked = (users = [], id) =>
    users.some((blockedId) => blockedId.toString() === id.toString());
  if (isBlocked(sender?.blockedUsers, receiverId) || isBlocked(receiver.blockedUsers, senderId)) {
    const error = new Error("Messaging is unavailable for this user");
    error.cause = 403;
    throw error;
  }
  const conversationKey = [senderId, receiverId].sort().join("_");
  let chat;
  if (roomId) {
    if (!mongoose.isValidObjectId(roomId)) {
      const error = new Error("Chat ID is invalid");
      error.cause = 400;
      throw error;
    }
    chat = await dbService.findOne({
      model: chatModel,
      filter: {
        _id: roomId,
        participants: { $all: [senderId, receiverId] },
      },
    });
    if (!chat) {
      const error = new Error("Chat was not found or you are not a participant");
      error.cause = 404;
      throw error;
    }
  } else {
    // Upsert makes two simultaneous first messages share one conversation.
    try {
      chat = await chatModel.findOneAndUpdate(
        { conversationKey },
        {
          $setOnInsert: {
            participants: [senderId, receiverId],
            conversationKey,
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      // A concurrent first message can briefly race on the unique key.
      if (error?.code !== 11000) throw error;
      chat = await dbService.findOne({
        model: chatModel,
        filter: { conversationKey },
      });
    }
  }

  const isUserOnline = socketConnections.has(receiverId);

  const newMessage = await dbService.create({
    model: MessageModel,
    data: {
      roomId: chat._id,
      senderId: senderId,
      message: message.trim(),
      messageStatus: isUserOnline ? "delivered" : "sent",
      receiverId,
    },
  });

  chat.lastMessage = message.trim();
  chat.lastMessageAt = new Date();
  await chat.save();
  await chat.populate("participants", "_id name image");

  return {
    message: newMessage.toObject(),
    chat: chat.toObject(),
    receiverId,
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

export const updateReadMessageStatus = async ({ socket, info }) => {
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
  const { roomId } = info;
  const data = await dbService.updateMany({
    model: MessageModel,
    filter: {
      receiverId: userId,
      messageStatus: "delivered",
      roomId,
    },
    data: { messageStatus: "seen" },
    options: { new: true },
  });
  const chat = await dbService.findById({
    id: roomId,
    model: chatModel,
  });

  const senderId = chat.participants
    .find((id) => id.toString() !== socket.user._id.toString())
    .toString();

  if (data?.modifiedCount) {
    return {
      statusCode: 200,
      senderId,
    };
  } else {
    return {
      statusCode: 400,
      message: "No messages found",
    };
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
