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
          _id: l._id?.toString(), // 子文件的 ObjectId 轉字串
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
