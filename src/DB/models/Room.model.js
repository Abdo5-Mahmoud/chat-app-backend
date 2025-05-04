import mongoose, { Schema, Types, model } from "mongoose";

const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    messages: [
      {
        message: { type: String, required: true },
        senderId: { type: Types.ObjectId },
        type: {
          type: String,
          required: true,
          enum: ["user", "system"],
          default: "user",
        },
      },
    ],
  },
  { timestamps: true }
);

const roomModel = mongoose.model.Room || model("Room", roomSchema);
export default roomModel;
