"use client";

import { useContext, useState, useEffect } from "react";
import { TitleContext } from "../../context/TitleContext";
import DistrictGroupedStations from "./DistrictGroupedStations";
import Head from "next/head";
import NotFound from "./not-found";
import Loading from "./loading";
import Footer from "../../footer/footer";
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
  line: StationLineInfo[];
  openDate?: string;
  closeDate?: string;
  originalName?: string;
  level?: string;
  miles?: string;
  height?: string;
  stationCode?: string;
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
const RailwayContent = ({ params }: RailwayContentProps): JSX.Element => {
  const [railwayId, setRailwayId] = useState<string | null>(null);
  const { title, setTitle } = useContext(TitleContext);
  const [data, setData] = useState<RailwayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFoundPage, setNotFoundPage] = useState<boolean>(false);
  const [allStations, setAllStations] = useState<Station[]>([]);

  useEffect(() => {
    setTitle("載入中請稍後");
    document.title = "載入中請稍後";

    const unwrapParams = async () => {
      try {
        const unwrappedParams = await params;
        if (!unwrappedParams?.railwayId) {
          setNotFoundPage(true);
          setTitle("無法顯示");
          document.title = "無法顯示";
          return;
        }
        setRailwayId(unwrappedParams.railwayId);
      } catch (err) {
        setError("Failed to load route parameters.");
      }
    };

    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (!railwayId) return;

    const fetchRailwayData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const [railwayRes, stationRes] = await Promise.all([
          fetch("http://localhost:9000/railways"),
          fetch("http://localhost:9000/stations"),
        ]);

        if (!railwayRes.ok || !stationRes.ok)
          throw new Error("Failed to fetch railway or station data");

        const allRailways: RailwayData[] = await railwayRes.json();
        const stations: Station[] = await stationRes.json();

        const railway = allRailways.find(
          (rwy) => Number(rwy.id) === Number(railwayId)
        );

        const fixedStations = stations.map((s) => ({
          //強制轉換為陣列
          ...s,
          line: Array.isArray(s.line) ? s.line : [s.line],
        }));

        const filteredStations = fixedStations.filter((s) =>
          s.line.some((l) => Number(l.lineID) === Number(railwayId))
        );

        setLoading(false);

        if (!railway) {
          setNotFoundPage(true);
          setTitle("無法顯示");
          document.title = "無法顯示";
          return;
        }

        // const [imagesRes, descRes] = await Promise.all([
        //   fetch("/db_image.json"),
        //   fetch("/db_description.json"),
        // ]);

        // if (!imagesRes.ok || !descRes.ok)
        //   throw new Error("Failed to fetch additional data");

        // const [imagesData, descriptionsData] = await Promise.all([
        //   imagesRes.json(),
        //   descRes.json(),
        // ]);

        // highway.images = imagesData[railwayId] || [];
        // highway.descriptions = descriptionsData[railwayId] || [];

        setData(railway);
        console.log(railway);

        setAllStations(filteredStations); // ⬅️ 儲存抓到的車站
        setTitle(`Railway ${railway.name}`);
        document.title = `${railway.name}`;
      } catch (error: any) {
        setError(error.message);
      }
    };

    fetchRailwayData();
    console.log(railwayId);
    console.log(allStations);
  }, [railwayId]);

  useEffect(() => {
    if (data) {
      console.log("✅ Railway data updated:", data);
    }
  }, [data]);

  if (error) return <h1>Error: {error}</h1>;
  if (notFoundPage) return <NotFound />;

  return loading ? (
    <>
      <Loading />
      <Footer />
    </>
  ) : (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      {data ? (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-extrabold text-white mb-6 border-b pb-2">
            {data.name}
          </h1>

          <div className="space-y-8">
            <DistrictGroupedStations
              lineID={data.id}
              lineData={data}
              stations={allStations}
              loading={loading}
              setLoading={setLoading}
            />
          </div>
        </div>
      ) : (
        <div className="loading-container flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-solid rounded-full animate-spin border-t-gray-800"></div>
          <span className="ml-2 text-xl">Loading data...</span>
        </div>
      )}
      <Footer />
    </>
  );
};
export default RailwayContent;
