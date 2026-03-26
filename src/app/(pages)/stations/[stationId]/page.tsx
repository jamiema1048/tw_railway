// src/app/stations/[stationId]/page.tsx
export const dynamic = "force-dynamic";
import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import StationClient from "@/app/(client)/(stations)/StationClient";
import { Metadata } from "next";

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
  lineDistrict: any;
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
  line: StationLineInfo[];
  prevStation?: number[] | number;
  nextStation?: number[] | number;
  hasDetail?: boolean;
  images?: string[];
  descriptions?: string[];
}

export async function generateMetadata({
  params,
}: {
  params: { stationId: string };
}): Promise<Metadata> {
  try {
    const [stationRes, railwayRes] = await Promise.all([
      fetch(`http://localhost:9000/stations?id=${Number(params.stationId)}`, {
        cache: "no-store",
      }),
      fetch("http://localhost:9000/railways", {
        cache: "no-store",
      }),
    ]);

    if (!railwayRes.ok) {
      return {
        title: "找不到路線資料",
      };
    }
    if (!stationRes.ok) {
      return {
        title: "找不到車站資料",
      };
    }

    const stations: Station[] = await stationRes.json();
    if (stations.length === 0) {
      throw new Error("No station found with this ID");
    }

    const railways: Line[] = await railwayRes.json();
    if (railways.length === 0) {
      throw new Error("No railway found with this ID");
    }

    const station = stations[0];

    // 取得目前車站資料後，擴充去抓前後站
    const prevIDs = Array.isArray(station.prevStation)
      ? station.prevStation
      : station.prevStation != null
        ? [station.prevStation]
        : [];

    const nextIDs = Array.isArray(station.nextStation)
      ? station.nextStation
      : station.nextStation != null
        ? [station.nextStation]
        : [];

    const adjacentIDs = [...prevIDs, ...nextIDs];

    // 去重處理
    const uniqueAdjacentIDs = [...new Set(adjacentIDs)].filter(
      (id) => id != null,
    );

    // 只在有前後站時發 fetch
    const adjacentStations: Station[] = uniqueAdjacentIDs.length
      ? await fetch(
          `http://localhost:9000/stations?${uniqueAdjacentIDs
            .map((id) => `id=${id}`)
            .join("&")}`,
          { cache: "no-store" },
        ).then((res) => res.json())
      : [];

    const stationLines: StationLineInfo[] = Array.isArray(station.line)
      ? station.line
      : [station.line];

    const railway = railways.find(
      (r) => Number(r.id) === Number(stationLines[0]?.lineID),
    );

    return {
      title: `${station.name} - 車站資訊`,
    };
  } catch (error: any) {
    return {
      title: "載入錯誤",
    };
  }
}

export default async function StationPage({
  params,
}: {
  params: { stationId: string };
}) {
  try {
    const [stationRes, railwayRes] = await Promise.all([
      fetch(`http://localhost:9000/stations?id=${Number(params.stationId)}`, {
        cache: "no-store",
      }),
      fetch("http://localhost:9000/railways", {
        cache: "no-store",
      }),
    ]);

    if (!stationRes.ok) {
      if (stationRes.status === 404) {
        // API 說找不到 → 直接 404 頁面
        notFound();
      }
      throw new Error(
        `Failed to fetch station data: ${stationRes.status} ${stationRes.statusText}`,
      );
    }

    if (!railwayRes.ok) {
      if (railwayRes.status === 404) {
        // API 說找不到 → 直接 404 頁面
        notFound();
      }
      throw new Error(
        `Failed to fetch station data: ${railwayRes.status} ${railwayRes.statusText}`,
      );
    }

    const stations: Station[] = await stationRes.json();
    if (stations.length === 0) {
      throw new Error("No station found with this ID");
    }

    if (!Array.isArray(stations) || stations.length === 0) {
      // 沒資料時回傳空狀態 UI
      return (
        <div className="flex justify-center items-center h-screen text-gray-400">
          目前沒有可用的車站資料
        </div>
      );
    }

    const railways: Line[] = await railwayRes.json();

    if (!Array.isArray(railways) || railways.length === 0) {
      // 沒資料時回傳空狀態 UI
      return (
        <div className="flex justify-center items-center h-screen text-gray-400">
          目前沒有可用的路線資料
        </div>
      );
    }

    const station = stations[0];

    // 讀取 JSON 檔案路徑
    const imagesPath = path.join(
      process.cwd(),
      "public",
      "db_station_image.json",
    );
    const descPath = path.join(
      process.cwd(),
      "public",
      "db_station_description.json",
    );

    // 同時讀取兩個檔案
    const [imagesDataRaw, descriptionsDataRaw] = await Promise.all([
      fs.readFile(imagesPath, "utf-8"),
      fs.readFile(descPath, "utf-8"),
    ]);

    // 轉成物件 / 陣列
    const imagesData = JSON.parse(imagesDataRaw);
    const descriptionsData = JSON.parse(descriptionsDataRaw);

    // 依 stationId 指定資料
    station.images = imagesData[Number(params.stationId)] || [];
    station.descriptions = descriptionsData[Number(params.stationId)] || [];

    // 取得目前車站資料後，擴充去抓前後站
    const prevIDs = Array.isArray(station.prevStation)
      ? station.prevStation
      : station.prevStation != null
        ? [station.prevStation]
        : [];

    const nextIDs = Array.isArray(station.nextStation)
      ? station.nextStation
      : station.nextStation != null
        ? [station.nextStation]
        : [];

    const adjacentIDs = [...prevIDs, ...nextIDs];

    // 去重處理
    const uniqueAdjacentIDs = [...new Set(adjacentIDs)]
      .filter((id) => id != null)
      .map((id) => String(id)); // ✅ 加這行

    // 只在有前後站時發 fetch
    const adjacentStations: Station[] = uniqueAdjacentIDs.length
      ? await fetch(
          `http://localhost:9000/stations?${uniqueAdjacentIDs
            .map((id) => `id=${id}`)
            .join("&")}&_=${Date.now()}`,
          { cache: "no-store" },
        ).then((res) => res.json())
      : [];
    console.log(prevIDs);
    console.log(nextIDs);
    console.log(adjacentIDs);
    console.log(uniqueAdjacentIDs);
    console.log(adjacentStations);
    await fetch("http://localhost:9000/stations")
      .then((res) => res.json())
      .then((data) => console.log(typeof data[0].id)); // ← 看看是 "number" 還是 "string"

    // 確保 station.line 一定是陣列格式
    const stationLines: StationLineInfo[] = Array.isArray(station.line)
      ? station.line
      : [station.line];

    // 用標準化後的 stationLines 處理 matchedRailways
    const matchedRailways = stationLines
      .map((l) => railways.find((r) => Number(r.id) === Number(l.lineID)))
      .filter((r): r is Line => r !== undefined);

    console.log(stations);
    console.log(station);
    console.log(railways);
    console.log(matchedRailways);

    return (
      <StationClient
        station={station}
        railways={matchedRailways}
        adjacentStations={adjacentStations}
      />
    );
  } catch (e) {
    const errorMsg =
      e instanceof Error
        ? e.message
        : typeof e === "string"
          ? e
          : JSON.stringify(e);

    console.error("Error loading station page:", errorMsg);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-3xl font-bold mb-4">🚧 發生錯誤</h1>
        <p className="text-lg mb-6">
          無法載入這個車站的資料，可能是伺服器或網路有問題。
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 active:bg-green-700 transition-colors"
        >
          返回首頁
        </Link>
      </div>
    );
  }
}
