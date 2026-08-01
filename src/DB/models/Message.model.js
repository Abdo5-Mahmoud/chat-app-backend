import mongoose, { model, Schema, Types } from "mongoose";

const messageSchema = new Schema(
  {
    roomId: {
      type: Types.ObjectId,
      ref: "Chat",
    },
    senderId: {
      type: Types.ObjectId,
      ref: "User",
    },
    receiverId: {
      type: Types.ObjectId,
      ref: "User",
    },
    message: String,
    media: [],
    messageStatus: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
  },
  { timestamps: true },
);
export const MessageModel =
  mongoose.models.Message || model("Message", messageSchema);
