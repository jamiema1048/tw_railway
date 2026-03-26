import mongoose from "mongoose";

const MONGODB_STATION_URI = process.env.MONGODB_STATION_URI || "";

if (!MONGODB_STATION_URI) {
  throw new Error("請在 .env.local 中定義 MONGODB_STATION_URI");
}
console.log("目前的 URI 是:", process.env.MONGODB_STATION_URI);
export const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_STATION_URI);
};
