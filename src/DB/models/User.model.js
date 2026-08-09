import mongoose, { model, Schema, Types } from "mongoose";
export const genderTypes = { male: "male", female: "female" };
export const proviedersType = { system: "system", google: "google" };
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    password: {
      type: String,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    friends: [
      {
        user: { type: Types.ObjectId, ref: "User", required: true },
        state: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
      },
    ],
    image: { secure_url: String, public_id: String },
    coverImage: [String],
    twoStepVerification: {
      type: Boolean,
      default: false,
    },
    isOwner: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: [proviedersType.google, proviedersType.system],
      default: "system",
    },
    // otp variables
    confirmEmailOtp: String,
    forgetPasswordOtp: String,
    twoStepVerificationOtp: String,

    otpTimer: Date,
    otpExp: Date,
    otpCounter: Number,
    otpAttempts: { type: Number, default: 0 },

    isDeleted: Date,
    changeCradinal: Date,
    blockedUsers: [Types.ObjectId],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// userSchema.virtual("chatsAsMain", {
//   ref: "Chat",
//   localField: "_id",
//   foreignField: "mainUser",
//   justOne: false,
// });

// userSchema.virtual("chatsAsSub", {
//   ref: "Chat",
//   localField: "_id",
//   foreignField: "subParticipant",
//   justOne: false,
// });

export const userModel =
  mongoose.models.User || mongoose.model("User", userSchema);

export const socketConnections = new Map();
export const socketToUser = new Map();
