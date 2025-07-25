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
import Loading from "./loading";
import Footer from "../footer/footer";

interface Line {
  id: number;
  name: string;
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
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return loading || lines.length === 0 ? (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-200">
      <Loading />
      <Footer />
    </div>
  ) : (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 p-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">
        🚉 車站一覽
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lines.map((l) => (
          <div
            key={l.id}
            className="bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-md p-5 hover:bg-[#2a2a2a] transition-colors"
          >
            <h2 className="text-xl font-semibold text-white">{l.name}</h2>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <Footer />
      </div>
    </div>
  );
}
