import mongoose, { model, Schema, Types } from "mongoose";

const chatSchema = new Schema(
  {
    messages: [
      {
        senderId: {
          type: Types.ObjectId,
          ref: "User",
        },
        message: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["user", "system"],
          default: "user",
        },
      },
    ],
    mainUser: {
      type: Types.ObjectId,
      ref: "User",
      require: true,
    },
    subParticipant: {
      type: Types.ObjectId,
      ref: "User",
      require: true,
    },
  },
  { timestamps: true }
);

export const chatModel = mongoose.model.Chat || model("Chat", chatSchema);
