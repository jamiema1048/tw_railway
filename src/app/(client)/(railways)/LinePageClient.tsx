"use client";
import { useEffect, useState, useContext } from "react";
import { TitleContext } from "@/app/(context)/title/TitleContext";
import Head from "next/head";
import Link from "next/link";
import Footer from "@/app/(components)/(footer)/footer";

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
}

interface Props {
  lines: Line[];
}

export default function LinePageClient({ lines }: Props) {
  const { title, setTitle } = useContext(TitleContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模擬載入動畫
    const timer = setTimeout(() => {
      setLoading(false);
      setTitle("鐵路總覽");
      document.title = "鐵路總覽";
    }, 100); // 可自行調整延遲，測試可縮短

    return () => clearTimeout(timer);
  }, [setTitle]);

  // 根據 co 分組
  const groupedByCo = lines.reduce<Record<number, Line[]>>((acc, line) => {
    if (!acc[line.co]) acc[line.co] = [];
    acc[line.co].push(line);
    return acc;
  }, {});

  const companyMap: Record<number, string> = {
    1: "台鐵",
    2: "林業鐵路",
    3: "糖業鐵路",
    4: "其他鐵路",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-200">
        <p className="text-xl text-white mt-4">Loading data...</p>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
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
                  className="bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-md p-5 hover:bg-[#2a2a2a] active:bg-[#333] active:scale-95 hover:scale-[1.02] transition-all duration-150 ease-in-out block"
                >
                  <h3 className="text-xl font-semibold text-white">{l.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}
