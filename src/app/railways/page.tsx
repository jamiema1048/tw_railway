// src/app/railways/LinePageServer.tsx
import LinePageClient from "./LinePageClient";

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

export default async function LinePageServer({ lineID }: { lineID: number }) {
  try {
    const res = await fetch("http://localhost:9000/railways");
    if (!res.ok) throw new Error("Fetch failed");
    const lines: Line[] = await res.json();

    return <LinePageClient lines={lines} />;
  } catch (err) {
    console.error(err);
    return <div>資料載入失敗</div>;
  }
}
