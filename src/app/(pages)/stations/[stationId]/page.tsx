export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import StationClient from "@/app/(client)/(stations)/StationClient";
import { Metadata } from "next";
import { getConnections } from "@/app/_lib/mongodb_connections";
import { RailwaySchema } from "@/models/Railway";
import { StationSchema } from "@/models/Station";

// 定義 Params 的型別，這在 Next.js 15 是 Promise
type PageParams = Promise<{ stationId: string }>;

// --- Metadata 生成 ---
export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  try {
    // ✨ 修正 1：必須 await params
    const { stationId } = await params;

    const { stationConn } = await getConnections();
    const StationModel =
      stationConn.models.Station || stationConn.model("Station", StationSchema);

    const station = await StationModel.findOne({
      id: Number(stationId),
    }).lean();

    if (!station) return { title: "找不到車站" };

    return { title: `${station.name} - 車站資訊` };
  } catch {
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

    // 1. 同時抓取目標車站與所有路線
    const [rawStation, allRailways] = await Promise.all([
      StationModel.findOne({ id: stationId }).lean(),
      RailwayModel.find({}).lean(),
    ]);

    if (!rawStation) notFound();

    // 2. 處理前後站 ID 邏輯
    const prevIDs = Array.isArray(rawStation.prevStation)
      ? rawStation.prevStation
      : rawStation.prevStation
        ? [rawStation.prevStation]
        : [];
    const nextIDs = Array.isArray(rawStation.nextStation)
      ? rawStation.nextStation
      : rawStation.nextStation
        ? [rawStation.nextStation]
        : [];
    const uniqueAdjacentIDs = [...new Set([...prevIDs, ...nextIDs])].filter(
      (id) => id != null,
    );

    // 3. 抓取鄰近車站資料
    const rawAdjacentStations =
      uniqueAdjacentIDs.length > 0
        ? await StationModel.find({ id: { $in: uniqueAdjacentIDs } }).lean()
        : [];

    // 4. 資料標準化 (脫水處理)
    const sanitizeStation = (s: any) => ({
      ...s,
      _id: s._id.toString(),
      line: (Array.isArray(s.line) ? s.line : [s.line]).map((l: any) => ({
        ...l,
        _id: l._id?.toString(),
        // 補強：處理 lineDistrict 如果是物件的情況
        lineDistrict: l.lineDistrict,
      })),
      images: (s.images || []).map((img: any) => ({
        ...img,
        _id: img._id?.toString(),
        capturedAt:
          img.capturedAt instanceof Date
            ? img.capturedAt.toISOString()
            : img.capturedAt,
      })),
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
    });

    const station = sanitizeStation(rawStation);
    const adjacentStations = rawAdjacentStations.map(sanitizeStation);

    // 5. 匹配該車站所屬的路線資料 (同時脫水)
    const matchedRailways = station.line
      .map((l: any) =>
        allRailways.find((r: any) => Number(r.id) === Number(l.lineID)),
      )
      .filter((r: any) => r !== undefined)
      .map((r: any) => ({
        ...r,
        _id: r._id.toString(),
        district: (r.district || []).map((d: any) => ({
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
