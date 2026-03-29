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
    const unwrappedParams = await params;
    const stationId = Number(unwrappedParams?.stationId);
    if (!stationId) return { title: "無效的車站 ID" };

    const { railwayConn, stationConn } = await getConnections();

    const RailwayModel =
      railwayConn.models.Railway || railwayConn.model("Railway", RailwaySchema);
    const StationModel =
      stationConn.models.Station || stationConn.model("Station", StationSchema);

    // 1. 抓取車站資料
    const stationData = await StationModel.findOne({ id: stationId }).lean();
    if (!stationData) return { title: "找不到車站" };

    // 2. 處理多路線與系統名稱轉換
    const lineIDs = stationData.line.map((l: any) => l.lineID);
    const railways = await RailwayModel.find({ id: { $in: lineIDs } }).lean();

    // 建立所有關聯路線的名稱字串，用於 Description
    const allLineNames = railways.map((r: any) => r.name).join("、");

    // 3. 處理陣列欄位顯示
    const displayOpenDate = stationData.openDate?.[0] || "資料暫缺";
    const displayCloseDate = stationData.closeDate?.[0] || "尚在使用中";
    const displayOriginalName =
      stationData.originalName?.length > 0
        ? stationData.originalName.join("、")
        : "";

    // 4. 根據狀態定義變數
    const isDisused = stationData.status === "disused";
    let title = "";

    // 5. 動態建構標題 (Title)
    if (isDisused) {
      // 產出格式：北港糖廠鐵道嘉義線、蒜頭糖廠鐵道嘉義線 [車站名] | 廢線遺構與歷史紀錄
      const systemTitles = railways
        .map((r: any) => {
          return `${r.name}`;
        })
        .join("、");

      title = `${systemTitles}${stationData.name} | 廢線遺構與歷史紀錄`;
    } else {
      // 現役車站：[車站名] | 車站基本資料 - [主要路線名]
      const primaryLine = railways[0]?.name || "未知路線";
      title = `${stationData.name} | 車站基本資料 - ${primaryLine}`;
    }

    // 6. 動態建構描述 (Description)
    // 增加舊名資訊，這對搜尋「舊地名」的 SEO 很有幫助
    const nameInfo = displayOriginalName
      ? `（舊名：${displayOriginalName}）`
      : "";

    const description = isDisused
      ? `收錄已廢止的${allLineNames}${stationData.name}${nameInfo}資料。包含啟用於 ${displayOpenDate}、廢止於 ${displayCloseDate}。提供實地探查之遺跡照片與歷史沿革。`
      : `${stationData.name}${nameInfo}位於${allLineNames}。提供車站站體構造、歷史背景與現況探查紀錄。`;

    // 7. 動態建構關鍵字 (Keywords)
    const baseKeywords = [
      stationData.name,
      "鐵道資料庫",
      "車站沿革",
      ...railways.map((r: any) => r.name),
    ];

    if (isDisused) {
      // 取得所有關聯路線的營運單位 (例如: TSC, TRA, AFB)
      // 並過濾重複項
      const uniqueCoIDs = [...new Set(railways.map((r: any) => r.co))].filter(
        (n) => n !== null && n !== undefined,
      );

      // 建立營運單位對照表 (可根據你資料庫的代碼擴充)
      const coMap: { [key: number]: string } = {
        1: "台鐵廢線",
        2: "林鐵",
        3: "糖鐵",
        4: "",
      };

      uniqueCoIDs.forEach((coID) => {
        // 強制轉為 number 以匹配 coMap 的 Key
        const id = Number(coID);
        const coName = coMap[id];

        // 如果對照表有值，則放入關鍵字；若無（或為空字串），則視情況處理
        if (coName) {
          baseKeywords.push(coName);
        } else if (coName === undefined) {
          // 如果 map 裡完全沒定義這個 ID，可以選擇放入原始 ID 或略過
          baseKeywords.push(`營運單位:${id}`);
        }
      });

      baseKeywords.push("廢線跡", "遺跡探查");
    }
    console.log({ title, description, keywords: baseKeywords });

    return {
      title,
      description,
      keywords: baseKeywords,
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
