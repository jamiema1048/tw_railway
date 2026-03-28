import mongoose from "mongoose";

const MONGODB_RAILWAY_URI = process.env.MONGODB_RAILWAY_URI || "";

if (!MONGODB_RAILWAY_URI) {
  throw new Error("請在 .env.local 中定義 MONGODB_RAILWAY_URI");
}
console.log("目前的 URI 是:", process.env.MONGODB_RAILWAY_URI);
export const connectToRailwayDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_RAILWAY_URI);
};
