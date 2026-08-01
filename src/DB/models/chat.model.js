import mongoose, { model, Schema, Types } from "mongoose";

const chatSchema = new Schema(
  {
    participants: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    conversationKey: {
      type: String,
      require: true,
      unique: true,
    },
    lastMessageAt: Date,
    lastMessage: String,
  },
  { timestamps: true },
);

export const chatModel = mongoose.models.Chat || model("Chat", chatSchema);
