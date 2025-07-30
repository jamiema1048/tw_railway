"use client";

import { useContext, useEffect } from "react";
import { TitleContext } from "../../context/TitleContext";

interface StationLineInfo {
  lineID: number;
  lineDistrict: any;
}

interface Station {
  id: number;
  name: string;
  status: "active" | "disused" | "planned";
  line: StationLineInfo[];
  prevStation?: number[] | number;
  nextStation?: number[] | number;
  hasDetail?: boolean;
}

export default function StationClient({ station }: { station: Station }) {
  const { setTitle } = useContext(TitleContext);

  useEffect(() => {
    setTitle(station.name);
  }, [station.name, setTitle]);
  console.log(station);

  return (
    <main className="p-4 text-white">
      <h1 className="text-3xl font-bold mb-4">{station.name}</h1>
      <p>
        狀態：
        {station.status === "active"
          ? "營運中"
          : station.status === "disused"
          ? "已廢止"
          : "規劃中"}
      </p>

      <h2 className="text-xl mt-6 mb-2 font-semibold">所屬路線：</h2>
      <ul className="list-disc pl-5">
        {station.line.map((line) => (
          <li key={line.lineID}>路線 ID: {line.lineID}</li>
        ))}
      </ul>

      {station.prevStation && (
        <p className="mt-4">
          上一站 ID：
          {Array.isArray(station.prevStation)
            ? station.prevStation.join("、")
            : station.prevStation}
        </p>
      )}

      {station.nextStation && (
        <p>
          下一站 ID：
          {Array.isArray(station.nextStation)
            ? station.nextStation.join("、")
            : station.nextStation}
        </p>
      )}
    </main>
  );
}
