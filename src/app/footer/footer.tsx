"use client";
import React from "react";
import { usePathname } from "next/navigation";

const Footer: React.FC = () => {
  const pathname = usePathname(); // 取得當前路徑

  const handleToLineClick = () => {
    window.location.href = "/railways";
  };
  const handleToHomeClick = () => {
    window.location.href = "/";
  };

  return (
    <footer className="flex flex-col gap-6 flex-wrap items-center justify-center">
      <div className="flex gap-4 items-center flex-col sm:flex-row">
        {pathname !== "/" && (
          <div className="container mx-auto mt-4 flex flex-row place-content-center">
            <button
              onClick={handleToHomeClick}
              className="text-lg m-4 cursor-pointer bg-green-500 text-white hover:text-yellow-300 active:text-yellow-600 p-4 rounded hover:bg-green-600 active:bg-green-800 active:shadow-green-400 active:shadow-md active:scale-95 hover:scale-[1.02] flex flex-row transition-colors"
            >
              <span>首頁</span>
            </button>
            {pathname !== "/railways" && (
              <button
                onClick={handleToLineClick}
                className="text-lg m-4 cursor-pointer bg-green-500 text-white hover:text-yellow-300 active:text-yellow-600 p-4 rounded hover:bg-green-600 active:bg-green-800 active:shadow-green-400 active:shadow-md active:scale-95 hover:scale-[1.02] flex flex-row transition-colors"
              >
                <span>路線一覽</span>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-white text-center my-8">
          Edit by Aaron Ma
        </h2>
        <h3 className="text-lg font-bold text-white text-center my-8">
          07.26.2025
        </h3>
      </div>
    </footer>
  );
};

export default Footer;
