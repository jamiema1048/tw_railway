// src/app/stations/[stationId]/page.tsx
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import StationClient from "./StationClient";
import { Metadata } from "next";

interface District {
  districtID: number;
  districtName: string;
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
  stationCode?: string;
  line: StationLineInfo[];
  prevStation?: number[] | number;
  nextStation?: number[] | number;
  hasDetail?: boolean;
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

    const stationLines: StationLineInfo[] = Array.isArray(station.line)
      ? station.line
      : [station.line];

    const railway = railways.find(
      (r) => Number(r.id) === Number(stationLines[0]?.lineID)
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
  const [stationRes, railwayRes] = await Promise.all([
    fetch(`http://localhost:9000/stations?id=${Number(params.stationId)}`, {
      cache: "no-store",
    }),
    fetch("http://localhost:9000/railways", {
      cache: "no-store",
    }),
  ]);

  if (!stationRes.ok)
    throw new Error(
      `Failed to fetch station data: ${stationRes.status} ${stationRes.statusText}`
    );
  if (!railwayRes.ok)
    throw new Error(
      `Failed to fetch station data: ${railwayRes.status} ${railwayRes.statusText}`
    );

  const stations: Station[] = await stationRes.json();
  if (stations.length === 0) {
    throw new Error("No station found with this ID");
  }

  const railways: Line[] = await railwayRes.json();
  if (railways.length === 0) {
    throw new Error("No railway found with this ID");
  }

  const station = stations[0];
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

  if (!station.hasDetail) {
    notFound(); // 如果沒有詳細資料，就顯示 404
  }

  return <StationClient station={station} railways={matchedRailways} />;
}
