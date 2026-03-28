// src/app/_lib/mongodb_connections.ts
import mongoose from "mongoose";

const options = {
  bufferCommands: false,
};

// 快取連線物件
let cached = (global as any).mongoose_multi;
if (!cached) {
  cached = (global as any).mongoose_multi = { railway: null, station: null };
}

export async function getConnections() {
  if (!cached.railway) {
    cached.railway = mongoose.createConnection(
      process.env.MONGODB_RAILWAY_URI!,
      options,
    );
  }
  if (!cached.station) {
    cached.station = mongoose.createConnection(
      process.env.MONGODB_STATION_URI!,
      options,
    );
  }

  // 等待連線完成
  await Promise.all([cached.railway.asPromise(), cached.station.asPromise()]);

  return {
    railwayConn: cached.railway,
    stationConn: cached.station,
  };
}
