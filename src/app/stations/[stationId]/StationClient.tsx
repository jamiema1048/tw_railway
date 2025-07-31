"use client";

import { useContext, useEffect } from "react";
import { TitleContext } from "../../context/TitleContext";
import Footer from "../../footer/footer";
import Head from "next/head";

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

export default function StationClient({
  station,
  railways,
}: {
  station: Station;
  railways: Line[];
}) {
  const { title, setTitle } = useContext(TitleContext);

  useEffect(() => {
    setTitle(station.name);
  }, [station.name, setTitle]);
  console.log(station);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
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

        <section className="route-info bg-black-100 p-6 rounded-lg mt-8">
          <h2 className="text-3xl font-semibold mb-4">車站資料</h2>
          {station.openDate && (
            <h3 className="text-xl mb-4">
              <strong>設站日期:</strong> {station.openDate}
            </h3>
          )}
          {station.closeDate && (
            <h3 className="text-xl mb-4">
              <strong>廢止日期:</strong> {station.closeDate}
            </h3>
          )}
          {station.originalName && (
            <h3 className="text-xl mb-4">
              <strong>舊名:</strong> {station.originalName}
            </h3>
          )}

          {station.level && (
            <h3 className="text-xl mb-4">
              <strong>站等:</strong> {station.level}
            </h3>
          )}
          {station.miles && (
            <h3 className="text-xl mb-4">
              <strong>里程:</strong> {station.miles}
            </h3>
          )}
          {station.stationCode && (
            <h3 className="text-xl mb-4">
              <strong>代碼:</strong> {station.stationCode}
            </h3>
          )}
        </section>

        <h2 className="text-xl mt-6 mb-2 font-semibold">所屬路線：</h2>
        <ul className="list-disc pl-5">
          {(Array.isArray(station.line) ? station.line : [station.line]).map(
            (line) => {
              const matchedRailway = railways.find(
                (r) => Number(r.id) === Number(line.lineID)
              );
              return (
                <li key={line.lineID}>
                  路線名稱：
                  {matchedRailway ? matchedRailway.name : `ID: ${line.lineID}`}
                </li>
              );
            }
          )}
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
      <Footer />
    </>
  );
}
