"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  
  const [photoSlots, setPhotoSlots] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("Original");
  const [stickers, setStickers] = useState<any[]>([]);

  useEffect(() => {
    const savedSlots = localStorage.getItem("arranged_slots");
    const savedFilter = localStorage.getItem("applied_filter");
    const savedStickers = localStorage.getItem("applied_stickers");

    if (savedSlots) setPhotoSlots(JSON.parse(savedSlots));
    if (savedFilter) setActiveFilter(savedFilter);
    if (savedStickers) setStickers(JSON.parse(savedStickers));
  }, []);

  const getFilterCSS = (filterName: string) => {
    switch (filterName) {
      case "Noir": return "grayscale(100%) contrast(120%)";
      case "Vintage": return "sepia(60%) contrast(90%)";
      case "Vivid": return "saturate(180%)";
      case "Warm": return "sepia(30%) saturate(140%)";
      case "Cool": return "hue-rotate(30deg) saturate(120%)";
      default: return "none";
    }
  };

  const handleNewSession = () => {
    localStorage.clear();
    router.push("/"); 
  };

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-8 pb-12"
      style={{ 
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)' 
      }}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>

      {/* Header Badge */}
      <div 
        style={{ width: '272px', height: '56px', background: '#476A53', border: '1px solid #85DDA6', borderRadius: '28px' }} 
        className="flex items-center justify-center gap-3 mb-6 shadow-lg z-10 shrink-0"
      >
        <div style={{ width: '31px', height: '31px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
        <span className="font-inter font-bold text-[24px]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Hasil Foto
        </span>
      </div>

      {/* Main Container - Gap diperkecil biar lebih naik */}
      <div className="flex flex-col items-center gap-6 z-10 w-full">
        
        {/* AREA FRAME HASIL */}
        <div 
          style={{ width: '380px', height: '560px', background: '#2E4F4D', border: '1.5px solid #54868A', borderRadius: '23px' }} 
          className="relative flex items-center justify-center p-4 shadow-2xl shrink-0"
        >
          <div className="relative w-[180px] h-[500px] bg-[#1A2E2D] rounded-[12px] p-2 flex flex-col gap-2 overflow-hidden shadow-inner border-[3px] border-[#1A2E2D]">
            <div className="w-full h-full flex flex-col gap-2 transition-all duration-700" style={{ filter: getFilterCSS(activeFilter) }}>
                {photoSlots.map((slot, index) => (
                <div 
                    key={index} 
                    className="w-full flex-grow rounded-sm shadow-md" 
                    style={{ backgroundColor: slot.photo ? slot.photo.bg : '#223736' }}
                />
                ))}
            </div>

            {/* Layer Stiker Statis */}
            <div className="absolute inset-0 pointer-events-none z-30">
              {stickers.map((stk, i) => (
                <div 
                  key={i}
                  style={{ 
                    position: 'absolute',
                    left: `${stk.x}%`, 
                    top: `${stk.y}%`, 
                    transform: `translate(-50%, -50%) rotate(${stk.rotation || 0}deg)`,
                    fontSize: `${(stk.size || 50) * 0.8}px`,
                    lineHeight: 1
                  }}
                >
                  {stk.emoji}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOMBOL AKSI (PRINT & DOWNLOAD) */}
        <div className="flex gap-4 shrink-0">
          <div style={{ width: '220px', height: '85px', background: '#2E4F4D', border: '1.5px solid #54868A', borderRadius: '20px' }} className="flex items-center gap-3 px-3 shadow-md cursor-pointer hover:bg-[#365c5a] transition-all group">
            <div style={{ width: '60px', height: '60px', background: '#2E706D', borderRadius: '15px' }} className="flex items-center justify-center shrink-0">
              <img src="/print.png" alt="print" className="w-[45px] h-[45px] object-contain group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="font-inter font-bold text-[18px] leading-tight text-white">Print</span>
              <span className="font-hind font-semibold text-[11px] text-[#3E8C7B] uppercase tracking-tighter">Cetak hasil</span>
            </div>
          </div>

          <div style={{ width: '220px', height: '85px', background: '#2E4F4D', border: '1.5px solid #54868A', borderRadius: '20px' }} className="flex items-center gap-3 px-3 shadow-md cursor-pointer hover:bg-[#365c5a] transition-all group">
            <div style={{ width: '60px', height: '60px', background: '#2E706D', borderRadius: '15px' }} className="flex items-center justify-center shrink-0">
              <img src="/expor.png" alt="export" className="w-[45px] h-[45px] object-contain group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="font-inter font-bold text-[18px] leading-tight text-white">Download</span>
              <span className="font-hind font-semibold text-[11px] text-[#3E8C7B] uppercase tracking-tighter">Simpan file</span>
            </div>
          </div>
        </div>

        {/* TOMBOL SESI BARU - Ditinggikan (Gap dikurangi) */}
        <button 
          onClick={handleNewSession}
          style={{ width: '250px', height: '70px', background: '#246855', border: '3px solid #30AC89', borderRadius: '18px' }}
          className="flex items-center justify-between px-6 hover:scale-105 transition-all shadow-xl group active:scale-95"
        >
          <span className="font-inter font-bold text-[18px]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SESI BARU
          </span>
          <div className="w-[45px] h-[45px] flex items-center justify-center opacity-90 group-hover:rotate-180 transition-transform duration-500">
             <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A9E2B5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
        </button>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@600&family=Inter:wght@700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
    </main>
  );
}