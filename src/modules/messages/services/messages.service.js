import * as dbService from "../../../DB/db.service.js";
import { MessageModel } from "../../../DB/models/Message.model.js";
import { asyncHandler } from "../../../utils/res/error.res.js";
import { success } from "../../../utils/res/success.res.js";

// export const getAllUsers = asyncHandler(async (req, res, next) => {
//   const users = await dbService.findAll({
//     model: userModel,
//     select: "_id name image",
//   });
//   return success({ res, statusCode: 200, data: users });
// });

export const getMessagesByChatId = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;

  // select last 50 message
  const messages = await dbService.findAll({
    model: MessageModel,
    filter: {
      roomId,
    },
    sort: {
      createdAt: -1,
    },
    limit: 50,
  });

  return success({
    res,
    statusCode: 200,
    data: {
      messages: messages,
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
