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
    document.title = `${station.name}`;
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

        <div className="my-9">
          <h2 className="text-xl mt-6 mb-5 font-semibold">所屬路線：</h2>
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
                    className="bg-green-500 text-white hover:text-yellow-300 active:text-yellow-600 hover:bg-green-600 active:bg-green-800 active:shadow-green-400 active:scale-75 hover:scale-[1.05] p-4 rounded active:shadow-md mx-4 transition-all duration-200 ease-in-out"
                  >
                    {matchedRailway
                      ? matchedRailway.name
                      : `ID: ${line.lineID}`}
                  </Link>
                );
              }
            )}
          </ul>
        </div>

        {station.prevStation && (
          <div className="my-4 flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold">上一站：</span>
            {Array.isArray(station.prevStation)
              ? station.prevStation.map((id) => {
                  const match = adjacentStations.find(
                    (s) => String(s.id) === String(id)
                  );
                  return match ? (
                    match.hasDetail ? (
                      <Link
                        key={id}
                        href={`/stations/${id}`}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:text-yellow-300 active:text-yellow-600 active:scale-90 hover:scale-[1.05] px-4 py-2 rounded-lg transition-all duration-200 ease-in-out"
                      >
                        {match.name}
                      </Link>
                    ) : (
                      <div
                        key={id}
                        className="bg-gray-600 text-gray-200 px-4 py-2 rounded-lg opacity-70 cursor-not-allowed active:bg-gray-700"
                      >
                        {match.name}
                      </div>
                    )
                  ) : (
                    <span key={id}>ID: {id}</span>
                  );
                })
              : (() => {
                  const match = adjacentStations.find(
                    (s) => String(s.id) === String(station.prevStation)
                  );
                  return match ? (
                    match.hasDetail ? (
                      <Link
                        href={`/stations/${station.prevStation}`}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:text-yellow-300 active:text-yellow-600 active:scale-90 hover:scale-[1.05] px-4 py-2 rounded-lg transition-all duration-200 ease-in-out"
                      >
                        {match.name}
                      </Link>
                    ) : (
                      <div className="bg-gray-600 text-gray-200 px-4 py-2 rounded-lg opacity-70 cursor-not-allowed active:bg-gray-700">
                        {match.name}
                      </div>
                    )
                  ) : (
                    <span>ID: {station.prevStation}</span>
                  );
                })()}
          </div>
        )}

        {station.nextStation && (
          <div className="my-4 flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold">下一站：</span>
            {Array.isArray(station.nextStation)
              ? station.nextStation.map((id) => {
                  const match = adjacentStations.find(
                    (s) => String(s.id) === String(id)
                  );
                  return match ? (
                    match.hasDetail ? (
                      <Link
                        key={id}
                        href={`/stations/${id}`}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:text-yellow-300 active:text-yellow-600 active:scale-90 hover:scale-[1.05] px-4 py-2 rounded-lg transition-all duration-200 ease-in-out"
                      >
                        {match.name}
                      </Link>
                    ) : (
                      <div
                        key={id}
                        className="bg-gray-600 text-gray-200 px-4 py-2 rounded-lg opacity-70 cursor-not-allowed active:bg-gray-700"
                      >
                        {match.name}
                      </div>
                    )
                  ) : (
                    <span key={id}>ID: {id}</span>
                  );
                })
              : (() => {
                  const match = adjacentStations.find(
                    (s) => String(s.id) === String(station.nextStation)
                  );
                  return match ? (
                    match.hasDetail ? (
                      <Link
                        href={`/stations/${station.nextStation}`}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:text-yellow-300 active:text-yellow-600 active:scale-90 hover:scale-[1.05] px-4 py-2 rounded-lg transition-all duration-200 ease-in-out"
                      >
                        {match.name}
                      </Link>
                    ) : (
                      <div className="bg-gray-600 text-gray-200 px-4 py-2 rounded-lg opacity-70 cursor-not-allowed active:bg-gray-700">
                        {match.name}
                      </div>
                    )
                  ) : (
                    <span>ID: {station.nextStation}</span>
                  );
                })()}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
