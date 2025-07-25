import React from "react";

interface Props {
  lineID: number;
  lineData: Line; // eg. 縱貫線(基隆=新竹)
  stations: Station[];
}

interface District {
  districtID: number;
  districtName: string;
}

interface Line {
  id: number;
  name: string;
  district: District[];
}

interface StationLineInfo {
  lineID: number;
  lineDistrict: number;
}

interface Station {
  id: number;
  name: string;
  line: StationLineInfo[];
}

interface RailwayParams {
  railwayId: string;
}

interface RailwayData {
  id: number;
  name: string;
  district: District[];
}

interface RailwayContentProps {
  params: Promise<RailwayParams> | RailwayParams;
}

const DistrictGroupedStations: React.FC<Props> = ({
  lineID,
  lineData,
  stations,
}) => {
  // 先建立一個 map: districtID -> 所屬車站[]
  const districtMap: Record<number, Station[]> = {};

  // 初始化每個區的 array
  for (const district of lineData.district) {
    districtMap[district.districtID] = [];
    console.log(districtMap);
  }

  // 將每個 station 依據 lineID 與 lineDistrict 加入對應區域
  for (const station of stations) {
    const stationLines = Array.isArray(station.line)
      ? station.line
      : [station.line];
    for (const line of stationLines) {
      if (line.lineID === lineID) {
        // 該車站屬於此 route 的某 district
        if (districtMap[line.lineDistrict]) {
          districtMap[line.lineDistrict].push(station);
        }
      }
      console.log(lineData);
    }
    console.log(station);
  }

  return (
    <div>
      {lineData.district.map((district) => (
        <div key={district.districtID} className="mb-6">
          <h2 className="text-xl font-bold mb-2">{district.districtName}</h2>
          <ul className="list-disc pl-5">
            {districtMap[district.districtID].length > 0 ? (
              districtMap[district.districtID].map((station) => (
                <li
                  key={station.id}
                  className={`ml-2 list-disc ${
                    station.status === "active"
                      ? "text-white"
                      : station.status === "disused"
                      ? "text-red-500 line-through"
                      : station.status === "planned"
                      ? "text-blue-500 italic"
                      : "text-gray-500"
                  }`}
                >
                  {station.name}
                </li>
              ))
            ) : (
              <li className="text-gray-500">（無車站）</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default DistrictGroupedStations;
