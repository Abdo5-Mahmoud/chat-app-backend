import roomModel from "../../../DB/models/Room.model.js";
import { asyncHandler } from "../../../utils/res/error.res.js";
import * as dbService from "../../../DB/db.service.js";
import { success } from "../../../utils/res/success.res.js";

export const createRoom = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  if (!name) return next(new Error("Name is required", { cause: 400 }));
  if (await dbService.findOne({ model: roomModel, filter: { name } })) {
    return next(new Error("Room already exists", { cause: 400 }));
  }

  const room = await dbService.create({
    model: roomModel,
    data: {
      name,
      createdBy: req.user._id,
      users: [req.user._id],
      messages: [
        {
          message: `Room ${name} has been created`,
          type: "system",
        },
      ],
    },
  });

  return success({
    res,
    statusCode: 201,
    data: {
      room: {
        id: room._id.toString(),
        name,
      },
    },
  });
});

export const getAllRooms = asyncHandler(async (req, res, next) => {
  let rooms = await dbService.findAll({
    model: roomModel,
    slice: "messages",
  });
  rooms = rooms.map((room) => {
    room.messages = room.messages.slice(-20);
    return room;
  });
  return success({ res, statusCode: 200, data: rooms });
});

export const deleteRoom = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const room = await dbService.findOne({
    model: roomModel,
    filter: { _id: roomId },
  });
  if (!room) return next(new Error("Room not found", { cause: 404 }));
  if (room.createdBy.toString() !== req.user._id.toString())
    return next(
      new Error("Access denied. Only Owner can delete rooms", { cause: 403 })
    );
  await dbService.deleteOne({
    model: roomModel,
    filter: { _id: roomId, createdBy: req.user._id },
  });

  return success(res, 200, {
    message: "Room deleted successfully",
  });
});

export const getRoom = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const room = await dbService.findOne({
    model: roomModel,
    filter: { _id: roomId },
  });
  if (!room) return next(new Error("Room not found", { cause: 404 }));

  return success({
    res,
    statusCode: 200,
    data: room,
  });
});
