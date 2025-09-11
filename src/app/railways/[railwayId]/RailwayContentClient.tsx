"use client";
import { useContext, useState, useEffect } from "react";
import { TitleContext } from "../../context/TitleContext";
import DistrictGroupedStations from "./DistrictGroupedStations";
import Head from "next/head";
import Footer from "../../footer/footer";
import Loading from "./loading";
import NotFound from "./not-found";

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
  line: StationLineInfo[];
  prevStation?: number[] | number;
  nextStation?: number[] | number;
}

interface RailwayData {
  id: number;
  name: string;
  district: District[];
}

interface Props {
  data: RailwayData;
  stations: Station[];
}

export default function RailwayContentClient({ data, stations }: Props) {
  const { title, setTitle } = useContext(TitleContext);
  const [loading, setLoading] = useState(true);
  const [notFoundPage, setNotFoundPage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!data) {
        setNotFoundPage(true);
        setTitle("無法顯示");
        document.title = "無法顯示";
        return;
      }
      setLoading(false);
      setTitle(`Railway ${data.name}`);
      document.title = `${data.name}`;
    }, 100); // 延遲模擬

    return () => clearTimeout(timer);
  }, [data, setTitle]);

  if (notFoundPage) return <NotFound />;

  if (loading) return <Loading />;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-4xl font-extrabold text-white mb-6 border-b pb-2">
          {data.name}
        </h1>
        <div className="space-y-8">
          <DistrictGroupedStations
            lineID={data.id}
            lineData={data}
            stations={stations}
            loading={loading}
            setLoading={setLoading}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
