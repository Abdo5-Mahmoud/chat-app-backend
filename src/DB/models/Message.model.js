import mongoose, { model, Schema, Types } from "mongoose";

const messageSchema = new Schema(
  {
    roomId: {
      type: Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true, trim: true },
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
