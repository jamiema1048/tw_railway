"use client";

import { useContext, useEffect } from "react";
import { TitleContext } from "../../context/TitleContext";
import Footer from "../../footer/footer";
import Head from "next/head";
import Link from "next/link";

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
}

export default function StationClient({
  station,
  railways,
  adjacentStations,
}: {
  station: Station;
  railways: Line[];
  adjacentStations: Station[];
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
          {station.height && (
            <h3 className="text-xl mb-4">
              <strong>海拔高度:</strong> {station.height}
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
                <Link
                  key={line.lineID}
                  href={`/railways/${line.lineID}`}
                  className="text-blue-500 hover:underline mr-2"
                >
                  {matchedRailway ? matchedRailway.name : `ID: ${line.lineID}`}
                </Link>
              );
            }
          )}
        </ul>

        {station.prevStation && (
          <div className="mt-4">
            上一站：
            {Array.isArray(station.prevStation)
              ? station.prevStation.map((id) => {
                  const match = adjacentStations.find(
                    (s) => String(s.id) === String(id)
                  );
                  console.log("prevStation match:", match);
                  return match ? (
                    match.hasDetail ? (
                      <Link
                        key={id}
                        href={`/stations/${id}`}
                        className="text-blue-500 hover:underline mr-2"
                      >
                        {match.name}
                      </Link>
                    ) : (
                      <div className="text-white mr-2">{match.name}</div>
                    )
                  ) : (
                    `ID: ${id}`
                  );
                })
              : (() => {
                  const match = adjacentStations.find(
                    (s) => String(s.id) === String(station.prevStation)
                  );
                  console.log("prevStation single match:", match);
                  return match ? (
                    match.hasDetail ? (
                      <Link
                        href={`/stations/${station.prevStation}`}
                        className="text-blue-500 hover:underline"
                      >
                        {match.name}
                      </Link>
                    ) : (
                      <div className="text-white mr-2">{match.name}</div>
                    )
                  ) : (
                    `ID: ${station.prevStation}`
                  );
                })()}
          </div>
        )}

        {station.nextStation && (
          <div className="mt-4">
            下一站：
            {Array.isArray(station.nextStation)
              ? station.nextStation.map((id) => {
                  const match = adjacentStations.find(
                    (s) => String(s.id) === String(id)
                  );
                  console.log("nextStation match:", match);
                  return match ? (
                    match.hasDetail ? (
                      <Link
                        key={id}
                        href={`/stations/${id}`}
                        className="text-blue-500 hover:underline mr-2"
                      >
                        {match.name}
                      </Link>
                    ) : (
                      <div key={id} className="text-white mr-2">
                        {match.name}
                      </div>
                    )
                  ) : (
                    `ID: ${id}`
                  );
                })
              : (() => {
                  const match = adjacentStations.find(
                    (s) => String(s.id) === String(station.nextStation)
                  );
                  console.log("nextStation single match:", match);
                  return match ? (
                    match.hasDetail ? (
                      <Link
                        href={`/stations/${station.nextStation}`}
                        className="text-blue-500 hover:underline mr-2"
                      >
                        {match.name}
                      </Link>
                    ) : (
                      <div className="text-white mr-2">{match.name}</div>
                    )
                  ) : (
                    `ID: ${station.nextStation}`
                  );
                })()}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
