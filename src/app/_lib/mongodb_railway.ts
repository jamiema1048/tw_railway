import mongoose, { Connection } from "mongoose";

const MONGODB_RAILWAY_URI = process.env.MONGODB_RAILWAY_URI || "";

if (!MONGODB_RAILWAY_URI) {
  throw new Error("請在 .env.local 中定義 MONGODB_RAILWAY_URI");
}
console.log("目前的 URI 是:", process.env.MONGODB_RAILWAY_URI);

interface RailwayCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

// 初始化全域快取，避免 Serverless 重複連線
let cached = (global as any).mongoose_railway as RailwayCache;

if (!cached) {
  cached = (global as any).mongoose_railway = { conn: null, promise: null };
}

export const connectToRailwayDatabase = async (): Promise<Connection> => {
  // 1. 如果已經有連線，直接回傳
  if (cached.conn) {
    return cached.conn;
  }

  // 2. 如果還沒有連線 Promise，建立一個
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // 限制連線數，對 Vercel 友善
    };

    // 使用 createConnection 而非 connect，確保多資料庫環境不衝突
    cached.promise = mongoose
      .createConnection(MONGODB_RAILWAY_URI, opts)
      .asPromise();
  }

  try {
    // 3. 等待連線完成並存入快取
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};
