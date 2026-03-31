import RailwayContentClient from "@/app/(client)/(railways)/(railway)/RailwayContentClient";
import { getConnections } from "@/app/_lib/mongodb_connections";
import { RailwaySchema } from "@/models/Railway"; // 確保你匯出的是 Schema 而非 Model
import { StationSchema } from "@/models/Station";

interface District {
  districtID: number;
  districtName: string;
  prevArea?: number;
  nextArea?: number;
}

interface Line {
  id: number;
  name: string;
  co: number;
  district: District[];
}

interface StationLineInfo {
  lineID: number;
  lineDistrict: number;
}

interface Station {
  id: number;
  name: string;
  status: "active" | "disused" | "planned";
  openDate?: string;
  closeDate?: string;
  originalName?: string;
  level?: string;
  miles?: string;
  height?: string;
  stationCode?: string;
  line: StationLineInfo[] | StationLineInfo;
  prevStation?: number[] | number;
  nextStation?: number[] | number;
  hasDetail?: boolean;
}

interface RailwayData {
  id: number;
  name: string;
  district: District[];
}

interface RailwayParams {
  railwayId: string;
}

interface Props {
  params: RailwayParams | Promise<RailwayParams>;
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  try {
    const unwrappedParams = await params;
    const railwayId = Number(unwrappedParams?.railwayId);
    if (!railwayId) return { title: "無效的路線 ID" };

    const { railwayConn } = await getConnections();
    const RailwayModel =
      railwayConn.models.Railway || railwayConn.model("Railway", RailwaySchema);

    // 1. 抓取路線資料
    const railwayData = await RailwayModel.findOne({ id: railwayId }).lean();
    if (!railwayData) return { title: "找不到路線資料" };

    // 2. 營運單位對照表
    const coMap: { [key: number]: string } = {
      1: "台鐵",
      2: "林鐵",
      3: "糖鐵",
      4: "",
    };

    const coName = coMap[railwayData.co] || "";
    const systemPrefix = railwayData.systemName
      ? `${railwayData.systemName}`
      : "";

    // 3. 動態建構標題 (Title)
    // 範例：北港糖廠鐵道：嘉義線 | 路線沿革與車站列表
    // 範例：台鐵縱貫線 | 鐵道路線資料庫
    const title = systemPrefix
      ? `${systemPrefix}${coName}：${railwayData.name} | 路線沿革與車站列表`
      : `${coName}${railwayData.name} | 鐵道路線資料庫`;

    // 4. 動態建構描述 (Description)
    // 描述中加入起訖站或總長度（如果有資料的話）會更吸引點擊
    const description = `${systemPrefix}${coName}${railwayData.name}的完整資料紀錄。收錄路線沿革、歷史背景以及所屬車站清單。提供鐵道迷與研究者精確的${railwayData.name}地理與探查資訊。`;

    // 5. 動態建構關鍵字 (Keywords)
    const keywords = [
      railwayData.name,
      coName,
      systemPrefix,
      "鐵道路線圖",
      "路線沿革",
      "車站列表",
      "台灣鐵道紀錄",
    ].filter(Boolean); // 過濾掉空字串
    console.log({ title, description, keywords });

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        type: "website",
        // 如果路線有代表性地圖照片，可在此加入
        // images: [{ url: railwayData.mapImageUrl }]
      },
    };
  } catch (error) {
    console.error("Railway Metadata error:", error);
    return { title: "路線資料載入錯誤" };
  }
}

export default async function RailwayContentServer({ params }: Props) {
  try {
    const unwrappedParams = await params;
    const railwayId = Number(unwrappedParams?.railwayId);
    if (!railwayId) return <div>Invalid Railway ID</div>;

    const { railwayConn, stationConn } = await getConnections();

    const RailwayModel =
      railwayConn.models.Railway || railwayConn.model("Railway", RailwaySchema);
    const StationModel =
      stationConn.models.Station || stationConn.model("Station", StationSchema);

    const [railwayData, allStations] = await Promise.all([
      RailwayModel.findOne({ id: railwayId }).lean(),
      StationModel.find({ "line.lineID": railwayId }).lean(),
    ]);

    if (!railwayData) return <div>Railway Not Found</div>;

    // 1. 處理單一物件 (Railway)
    const serializedRailway = {
      ...railwayData,
      _id: railwayData._id.toString(),
      // 如果 district 裡面也有 _id，也要處理
      district: (railwayData.district || []).map((d: any) => ({
        ...d,
        _id: d._id?.toString(),
      })),
    };

    // 2. 處理陣列 (Stations) - 在這裡就把所有「非純物件」轉掉
    const serializedStations = allStations.map((s: any) => ({
      ...s,
      _id: s._id.toString(),
      // 處理 line 陣列
      line: (Array.isArray(s.line) ? s.line : s.line ? [s.line] : []).map(
        (l: any) => ({
          ...l,
          _id: l._id?.toString(),

          // ✨ 關鍵修正：處理 lineDistrict 陣列或物件中的 ObjectId
          lineDistrict: Array.isArray(l.lineDistrict)
            ? l.lineDistrict.map((d: any) => ({
                ...d,
                _id: d._id?.toString(), // 如果有 _id 就轉字串，沒有就 undefined
              }))
            : l.lineDistrict
              ? { ...l.lineDistrict, _id: l.lineDistrict._id?.toString() }
              : null,
        }),
      ),
      // 處理前後站
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
      // 處理圖片 (包含 Date 轉換)
      images: (s.images || []).map((img: any) => ({
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
