import { Metadata } from "next";
import { Types } from "mongoose"; // 用於定義 ObjectId
import RailwayContentClient from "@/app/(client)/(railways)/(railway)/RailwayContentClient";
import { getConnections } from "@/app/_lib/mongodb_connections";
import { RailwaySchema } from "@/models/Railway";
import { StationSchema } from "@/models/Station";

// --- 1. 基礎屬性介面 ---
interface BaseDistrict {
  districtID: number;
  districtName: string;
  prevArea?: number;
  nextArea?: number;
}

// --- 2. 資料庫原始型別 (來自 .lean()) ---
interface MongoDistrict extends BaseDistrict {
  _id?: Types.ObjectId;
}

interface MongoStation {
  _id: Types.ObjectId;
  id: number;
  name: string;
  status: "active" | "disused" | "planned";
  line: {
    lineID: number;
    lineDistrict: number | MongoDistrict | MongoDistrict[];
    _id?: Types.ObjectId;
  }[];
  prevStation?: number[] | number;
  nextStation?: number[] | number;
  images?: {
    _id?: Types.ObjectId;
    url: string;
    capturedAt?: Date | string;
  }[];
  // 補上其他可能缺少的欄位
  openDate?: string;
  closeDate?: string;
  originalName?: string;
  level?: string;
  miles?: string;
  height?: string;
  stationCode?: string;
  hasDetail?: boolean;
}

interface MongoRailway {
  _id: Types.ObjectId;
  id: number;
  name: string;
  co: number;
  systemName?: string;
  district: MongoDistrict[];
}

// --- 3. 轉化後傳給 Client 的型別 (純字串化) ---
// 這裡直接複用你原本 Client 端的 Interface，但確保 _id 都是 string

type PageParams = Promise<{ railwayId: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  try {
    // Await params (Next.js 15 必備)
    const { railwayId: rawId } = await params;
    const railwayId = Number(rawId);

    if (isNaN(railwayId)) {
      return { title: "無效的路線 ID" };
    }

    const { railwayConn } = await getConnections();
    const RailwayModel =
      railwayConn.models.Railway || railwayConn.model("Railway", RailwaySchema);

    // 關鍵修正：透過斷言或泛型告訴 TS 這是 MongoRailway 結構
    // 使用 lean<MongoRailway>() 或是 as MongoRailway | null
    const railwayData = (await RailwayModel.findOne({
      id: railwayId,
    }).lean()) as MongoRailway | null;

    if (!railwayData) {
      return { title: "找不到路線資料" };
    }

    // 3. 營運單位對照
    const coMap: Record<number, string> = {
      1: "台鐵",
      2: "林鐵",
      3: "糖鐵",
      4: "",
    };

    // 此時 railwayData 已經有型別提示，不會有 any 報錯
    const coName = coMap[railwayData.co] || "";
    const systemPrefix = railwayData.systemName || "";

    const title = systemPrefix
      ? `${systemPrefix}${coName}：${railwayData.name} | 路線沿革與車站列表`
      : `${coName}${railwayData.name} | 鐵道路線資料庫`;

    const description = `${systemPrefix}${coName}${railwayData.name}的完整資料紀錄。收錄路線沿革、歷史背景以及所屬車站清單。`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
      },
      // 建議也補上 keywords
      keywords: [railwayData.name, coName, "鐵道資料庫"].filter(Boolean),
    };
  } catch (error) {
    // 部署時建議打印更詳細的錯誤到 log
    console.error("Metadata Generation Error:", error);
    return { title: "路線資料載入錯誤" };
  }
}

export default async function RailwayContentServer({
  params,
}: {
  params: Promise<{ railwayId: string }>;
}) {
  try {
    const { railwayId: rawId } = await params;
    const railwayId = Number(rawId);
    if (!railwayId) return <div>Invalid Railway ID</div>;

    const { railwayConn, stationConn } = await getConnections();

    const RailwayModel =
      railwayConn.models.Railway || railwayConn.model("Railway", RailwaySchema);
    const StationModel =
      stationConn.models.Station || stationConn.model("Station", StationSchema);

    // 強型別化查詢結果
    const rawRailway = (await RailwayModel.findOne({
      id: railwayId,
    }).lean()) as MongoRailway | null;
    const rawStations = (await StationModel.find({
      "line.lineID": railwayId,
    }).lean()) as MongoStation[];

    if (!rawRailway) return <div>Railway Not Found</div>;

    // --- 序列化處理 (Serialization) ---

    const serializedRailway = {
      ...rawRailway,
      _id: rawRailway._id.toString(),
      district: (rawRailway.district || []).map((d) => ({
        ...d,
        _id: d._id?.toString(),
      })),
    };

    const serializedStations = rawStations.map((s) => ({
      ...s,
      _id: s._id.toString(),
      // 處理 line 陣列及其嵌套的 lineDistrict
      line: s.line.map((l) => ({
        ...l,
        _id: l._id?.toString(),
        lineDistrict: Array.isArray(l.lineDistrict)
          ? l.lineDistrict.map((d) => ({ ...d, _id: d._id?.toString() }))
          : typeof l.lineDistrict === "object" && l.lineDistrict !== null
            ? {
                ...l.lineDistrict,
                _id: (l.lineDistrict as MongoDistrict)._id?.toString(),
              }
            : l.lineDistrict, // 如果是 number 則直接回傳
      })),
      // 確保前後站為陣列
      prevStation: Array.isArray(s.prevStation)
        ? s.prevStation
        : s.prevStation
          ? [s.prevStation]
          : [],
      nextStation: Array.isArray(s.nextStation)
        ? s.nextStation
        : s.nextStation
          ? [s.nextStation]
          : [],
      // 處理圖片與日期
      images: (s.images || []).map((img) => ({
        ...img,
        _id: img._id?.toString(),
        capturedAt:
          img.capturedAt instanceof Date
            ? img.capturedAt.toISOString()
            : img.capturedAt,
      })),
    }));

    // 3. 直接回傳，不再需要 JSON.parse
    return (
      <RailwayContentClient
        data={serializedRailway}
        stations={serializedStations}
      />
    );
  } catch (error) {
    console.error("MongoDB Fetch Error:", error);
    return <div>Error loading railway data</div>;
  }
}
