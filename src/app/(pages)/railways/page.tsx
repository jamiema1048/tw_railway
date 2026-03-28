// src/app/railways/LinePageServer.tsx
import LinePageClient from "@/app/(client)/(railways)/LinePageClient";
import { getConnections } from "@/app/_lib/mongodb_connections";
import { RailwaySchema } from "@/models/Railway";

export default async function LinePageServer() {
  try {
    // 1. 取得 railway 專屬連線
    const { railwayConn } = await getConnections();

    // 2. 建立/取得 Model (多連線模式一定要傳入 Schema)
    const RailwayModel =
      railwayConn.models.Railway || railwayConn.model("Railway", RailwaySchema);

    // 3. 抓取所有路線資料，並使用 .lean() 轉成純 JS 物件
    const allRailways = await RailwayModel.find({}).lean();

    if (!allRailways || allRailways.length === 0) {
      return <div>暫無路線資料</div>;
    }

    // 4. 資料標準化 (將所有的 ObjectId 轉成字串，否則 Client Component 會報錯)
    const serializedLines = allRailways.map((line: any) => ({
      ...line,
      _id: line._id.toString(),
      district: (line.district || []).map((d: any) => ({
        ...d,
        _id: d._id?.toString(),
      })),
    }));

    // 5. 將處理好的陣列傳給 Client 端
    return <LinePageClient lines={serializedLines} />;
  } catch (err) {
    console.error("MongoDB Fetch Error:", err);
    return <div>資料載入失敗</div>;
  }
}
