"use client";
import { useEffect, useState } from "react";

interface Line {
  id: number;
  name: string;
  // 你可以依照實際資料補上更多欄位
}

export default function LinePage({ lineID }: { lineID: number }) {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:9000/railways");
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        setLines(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return lines.length === 0 ? (
    <div>載入中...</div>
  ) : (
    <div>
      <h1>車站一覽</h1>
      {lines.map((l) => (
        <div key={l.id}>{l.name}</div>
      ))}
    </div>
  );
}
