import { Metadata } from "next";
import { Types } from "mongoose";
import { notFound } from "next/navigation";
import Link from "next/link";
import StationClient from "@/app/(client)/(stations)/StationClient";
import { getConnections } from "@/app/_lib/mongodb_connections";
import { RailwaySchema } from "@/models/Railway";
import { StationSchema } from "@/models/Station";

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
// 定義 Params 的型別，這在 Next.js 15 是 Promise
type PageParams = Promise<{ stationId: string }>;

// --- Metadata 生成 ---
export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  try {
    const { stationId: rawId } = await params;
    const stationId = Number(rawId);
    if (!stationId) return { title: "無效的車站 ID" };

    const { railwayConn, stationConn } = await getConnections();
    const RailwayModel =
      railwayConn.models.Railway || railwayConn.model("Railway", RailwaySchema);
    const StationModel =
      stationConn.models.Station || stationConn.model("Station", StationSchema);

    const stationData = (await StationModel.findOne({
      id: stationId,
    }).lean()) as MongoStation | null;
    if (!stationData) return { title: "找不到車站" };

    // 處理多路線
    const lineIDs = stationData.line.map((l) => l.lineID);
    const railways = (await RailwayModel.find({
      id: { $in: lineIDs },
    }).lean()) as MongoRailway[];
    const allLineNames = railways.map((r) => r.name).join("、");

    const displayOpenDate = stationData.openDate?.[0] || "資料暫缺";
    const displayCloseDate = stationData.closeDate?.[0] || "尚在使用中";
    const displayOriginalName = stationData.originalName?.join("、") || "";

    const isDisused = stationData.status === "disused";
    const primaryLine = railways[0]?.name || "未知路線";

    const title = isDisused
      ? `${railways.map((r) => r.name).join("、")}${stationData.name} | 廢線遺構與歷史紀錄`
      : `${stationData.name} | 車站基本資料 - ${primaryLine}`;

    const nameInfo = displayOriginalName
      ? `（舊名：${displayOriginalName}）`
      : "";
    const description = isDisused
      ? `收錄已廢止的${allLineNames}${stationData.name}${nameInfo}。啟用於 ${displayOpenDate}、廢止於 ${displayCloseDate}。`
      : `${stationData.name}${nameInfo}位於${allLineNames}。提供車站構造與歷史紀錄。`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: stationData.images?.[0]?.url
          ? [{ url: stationData.images[0].url }]
          : [],
      },
    };
  } catch (error) {
    console.error("Metadata error:", error);
    return { title: "載入錯誤" };
  }
}

// --- 主頁面 ---
export default async function StationPage({ params }: { params: PageParams }) {
  try {
    // ✨ 修正 2：解構名稱必須與資料夾名稱 [stationId] 一致
    // 你原本寫 stationParams.stationId 會抓不到值
    const { stationId: rawStationId } = await params;
    const stationId = Number(rawStationId);
    if (isNaN(stationId)) notFound();

    const { railwayConn, stationConn } = await getConnections();
    const RailwayModel =
      railwayConn.models.Railway || railwayConn.model("Railway", RailwaySchema);
    const StationModel =
      stationConn.models.Station || stationConn.model("Station", StationSchema);

    const [rawStation, allRailways] = await Promise.all([
      StationModel.findOne({
        id: stationId,
      }).lean() as Promise<MongoStation | null>,
      RailwayModel.find({}).lean() as Promise<MongoRailway[]>,
    ]);

    if (!rawStation) notFound();

    // 處理鄰近車站 ID
    const toArr = (val: number | number[] | undefined) =>
      Array.isArray(val) ? val : val ? [val] : [];

    const uniqueAdjacentIDs = [
      ...new Set([
        ...toArr(rawStation.prevStation),
        ...toArr(rawStation.nextStation),
      ]),
    ].filter((id): id is number => id != null);

    const rawAdjacentStations =
      uniqueAdjacentIDs.length > 0
        ? ((await StationModel.find({
            id: { $in: uniqueAdjacentIDs },
          }).lean()) as MongoStation[])
        : [];

    // --- 強型別化脫水函式 ---
    const sanitizeStation = (s: MongoStation) => ({
      ...s,
      _id: s._id.toString(),
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
            : l.lineDistrict,
      })),
      images: (s.images || []).map((img) => ({
        ...img,
        _id: img._id?.toString(),
        capturedAt:
          img.capturedAt instanceof Date
            ? img.capturedAt.toISOString()
            : img.capturedAt,
      })),
      prevStation: toArr(s.prevStation),
      nextStation: toArr(s.nextStation),
    });

    const station = sanitizeStation(rawStation);
    const adjacentStations = rawAdjacentStations.map(sanitizeStation);

    // 匹配路線資料
    const matchedRailways = station.line
      .map((l) => allRailways.find((r) => r.id === l.lineID))
      .filter((r): r is MongoRailway => r !== undefined)
      .map((r) => ({
        ...r,
        _id: r._id.toString(),
        district: (r.district || []).map((d) => ({
          ...d,
          _id: d._id?.toString(),
        })),
      }));

    return (
      <StationClient
        station={station}
        railways={matchedRailways}
        adjacentStations={adjacentStations}
      />
    );
  } catch (e) {
    console.error("Station Page Error:", e);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-3xl font-bold mb-4">🚧 發生錯誤</h1>
        <p className="text-lg mb-6">無法載入車站資料，請檢查資料庫連線。</p>
        <Link
          href="/"
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition-colors"
        >
          返回首頁
        </Link>
      </div>
    );
  }
}
