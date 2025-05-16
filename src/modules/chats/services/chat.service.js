import { asyncHandler } from "../../../utils/res/error.res.js";
import * as dbService from "../../../DB/db.service.js";
import { success } from "../../../utils/res/success.res.js";
import { chatModel } from "../../../DB/models/chat.model.js";
import { userModel } from "../../../DB/models/User.model.js";

// export const getAllUsers = asyncHandler(async (req, res, next) => {
//   const users = await dbService.findAll({
//     model: userModel,
//     select: "_id name image",
//   });
//   return success({ res, statusCode: 200, data: users });
// });

export const startChat = asyncHandler(async (req, res, next) => {
  const { friendId } = req.params;

  let chat = await dbService.findOne({
    model: chatModel,
    filter: {
      $or: [
        {
          mainUser: req.user._id,
          subParticipant: friendId,
        },
        {
          mainUser: friendId,
          subParticipant: req.user._id,
        },
      ],
    },
    select: "messages subParticipant mainUser",
  });
  // console.log(chat);

  if (!chat) {
    chat = await dbService.create({
      model: chatModel,
      data: { mainUser: req.user._id, subParticipant: friendId },
    });
  }
  const { messages, subParticipant, mainUser, _id } = chat;
  return success({
    res,
    statusCode: 201,
    data: {
      chat: { messages, subParticipant, mainUser, _id },
    },
  });
});
export const allChats = asyncHandler(async (req, res, next) => {
  // console.log("form all chats");

  const chats = await dbService.findAll({
    model: chatModel,
    filter: {
      $or: [
        {
          mainUser: req.user._id,
        },
        {
          subParticipant: req.user._id,
        },
      ],
    },
    select: {
      messages: { $slice: -50 }, // Get last 50 messages
      mainUser: 1,
      subParticipant: 1,
    },
  });
  console.log(chats, "none");
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

  await dbService.deleteOne({
    model: roomModel,
    filter: {
      $or: [
        {
          mainUser: req.user._id,
          subParticipant: friendId,
        },
        {
          mainUser: friendId,
          subParticipant: req.user._id,
        },
      ],
    },
  });

  return success(res, 200, {
    message: "Chat deleted successfully",
  });
});
