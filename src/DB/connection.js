import mongoose from "mongoose";
export const connectDB = async () => {
  return await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("error happened in connection", { err }));
};
