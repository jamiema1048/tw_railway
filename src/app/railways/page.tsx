"use client";
import {
  use,
  useState,
  useEffect,
  useContext,
  useRef,
  MouseEvent,
} from "react";
import { TitleContext } from "../context/TitleContext";
import Head from "next/head";
import Link from "next/link";
import Loading from "./loading";
import Footer from "../footer/footer";

interface Line {
  id: number;
  name: string;
  co: number;
  district: {
    districtID: number;
    districtName: string;
    prevArea?: number;
    nextArea?: number;
  }[];
  // 你可以依照實際資料補上更多欄位
}

export default function LinePage({ lineID }: { lineID: number }) {
  const [lines, setLines] = useState<Line[]>([]);
  const { title, setTitle } = useContext(TitleContext);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch("http://localhost:9000/railways");
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        setLines(data);
        setLoading(false);
        console.log(lines);
        setTitle("鐵路總覽");
        document.title = "鐵路總覽";
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  // 根據 co 分組
  const groupedByCo = lines.reduce<Record<number, Line[]>>((acc, line) => {
    if (!acc[line.co]) acc[line.co] = [];
    acc[line.co].push(line);
    return acc;
  }, {});

  // 這裡可以設定公司名稱
  const companyMap: Record<number, string> = {
    1: "台鐵",
    2: "林業鐵路",
    3: "糖業鐵路",
    4: "其他鐵路",
  };

  useEffect(() => {
    console.log("lines changed:", lines);
    console.log("lines length changed:", lines.length);
  }, [lines]);

  useEffect(() => {
    console.log("loading changed:", loading);
  }, [loading]);

  return loading ? (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-200">
      <Loading />
      <Footer />
    </div>
  ) : (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      {lines.length === 0 ? (
        <div className="loading-container flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-solid rounded-full animate-spin border-t-gray-800"></div>
          <span className="ml-2 text-xl">Loading data...</span>
        </div>
      ) : (
        <div className="min-h-screen bg-[#0f0f0f] text-gray-200 p-6">
          <h1 className="text-3xl font-bold mb-8 text-center text-white">
            🚉 鐵路總覽
          </h1>
          {Object.entries(groupedByCo).map(([co, lineList]) => (
            <div key={co} className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
                {companyMap[Number(co)] || `公司 ${co}`}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lineList.map((l) => (
                  <Link
                    href={`railways/${l.id}`}
                    key={l.id}
                    className="bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-md p-5 
               hover:bg-[#2a2a2a] active:bg-[#333] 
               active:scale-95 hover:scale-[1.02]
               transition-all duration-150 ease-in-out block"
                  >
                    <h3 className="text-xl font-semibold text-white">
                      {l.name}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-12">
        <Footer />
      </div>
    </>
  );
}
