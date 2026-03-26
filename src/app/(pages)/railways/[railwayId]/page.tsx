import RailwayContentClient from "@/app/(client)/(railways)/(railway)/RailwayContentClient";

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
    if (!unwrappedParams?.railwayId) {
      return { notFound: true };
    }
    const railwayId = unwrappedParams.railwayId;

    const [railwayRes, stationRes] = await Promise.all([
      fetch("http://localhost:9000/railways"),
      fetch("http://localhost:9000/stations"),
    ]);

    if (!railwayRes.ok || !stationRes.ok) throw new Error("Fetch failed");

    const allRailways: RailwayData[] = await railwayRes.json();
    const stations: Station[] = await stationRes.json();

    const railway = allRailways.find(
      (rwy) => Number(rwy.id) === Number(railwayId),
    );

    if (!railway) return { notFound: true };

    const fixedStations = stations.map((s) => ({
      ...s,
      line: Array.isArray(s.line) ? s.line : [s.line],
    }));

    const filteredStations = fixedStations.filter((s) =>
      s.line.some((l) => Number(l.lineID) === Number(railwayId)),
    );

    return <RailwayContentClient data={railway} stations={filteredStations} />;
  } catch (error) {
    console.error(error);
    return <div>Error loading railway data</div>;
  }
}
