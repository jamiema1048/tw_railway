// src/app/stations/[stationId]/page.tsx
export const dynamic = "force-dynamic";

import StationClient from "./StationClient";
import { Metadata } from "next";

interface Station {
  id: number;
  name: string;
  status: "active" | "disused" | "planned";
  line: { lineID: number; lineDistrict: any }[];
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
    const res = await fetch(
      `http://localhost:9000/stations?id=${Number(params.stationId)}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return {
        title: "找不到車站資料",
      };
    }

    const stations: Station[] = await res.json();
    if (stations.length === 0) {
      throw new Error("No station found with this ID");
    }

    const station = stations[0];

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
  const res = await fetch(
    `http://localhost:9000/stations?id=${Number(params.stationId)}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok)
    throw new Error(
      `Failed to fetch station data: ${res.status} ${res.statusText}`
    );

  const stations: Station[] = await res.json();
  if (stations.length === 0) {
    throw new Error("No station found with this ID");
  }

  const station = stations[0];
  console.log(stations);

  return <StationClient station={station} />;
}
