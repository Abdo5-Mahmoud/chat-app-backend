import { asyncHandler } from "../../../utils/res/error.res.js";
import * as dbService from "../../../DB/db.service.js";
import { success } from "../../../utils/res/success.res.js";
import { chatModel } from "../../../DB/models/chat.model.js";
import { userModel } from "../../../DB/models/User.model.js";
import { MessageModel } from "../../../DB/models/Message.model.js";

// export const getAllUsers = asyncHandler(async (req, res, next) => {
//   const users = await dbService.findAll({
//     model: userModel,
//     select: "_id name image",
//   });
//   return success({ res, statusCode: 200, data: users });
// });

export const startChat = asyncHandler(async (req, res, next) => {
  const { id: friendId } = req.params;
  const chat = await dbService.findOne({
    model: chatModel,
    filter: {
      participants: { $all: [req.user._id, friendId] },
    },
    populate: [{ path: "participants", select: "_id name image" }],
  });
  if (!chat) return next(new Error("Chat not found", { cause: 404 }));
  return success({
    res,
    data: { chat },
  });
});
export const allChats = asyncHandler(async (req, res, next) => {
  // populate with the friend data that in the chat
  const chats = await dbService.findAll({
    model: chatModel,

    filter: {
      participants: req.user._id,
    },
    populate: [
      {
        path: "participants",
        select: "_id name email image",
      },
    ],
    sort: { lastMessageAt: -1 },
  });

  return success({
    res,
    statusCode: 200,
    data: {
      chats,
    },
  });
});

export const deleteChat = asyncHandler(async (req, res, next) => {
  const { friendId } = req.params;

  const chat = await dbService.findOne({
    model: chatModel,
    filter: {
      participants: { $all: [req.user._id, friendId] },
    },
  });
  if (!chat) return next(new Error("Chat not found", { cause: 404 }));
  await dbService.deleteOne({ model: chatModel, filter: { _id: chat._id } });
  await dbService.deleteMany({ model: MessageModel, filter: { roomId: chat._id } });

  return success({ res, data: { message: "Chat deleted successfully" } });
});
