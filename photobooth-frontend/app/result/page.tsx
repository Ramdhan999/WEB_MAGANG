"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  const [photoSlots, setPhotoSlots] = useState<any[]>([]);

  useEffect(() => {
    const savedData = localStorage.getItem("arranged_slots");
    if (savedData) {
      setPhotoSlots(JSON.parse(savedData));
    }
  }, []);

  const handleNewSession = () => {
    localStorage.removeItem("arranged_slots");
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
      <div style={{ width: '272px', height: '56px', background: '#476A53', border: '1px solid #85DDA6', borderRadius: '28px' }} className="flex items-center justify-center gap-3 mb-8 shadow-lg z-10 shrink-0">
        <div style={{ width: '31px', height: '31px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
        <span className="font-inter font-bold text-[24px]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Hasil Foto
        </span>
      </div>

      {/* Main Container */}
      <div className="flex flex-col items-center gap-6 z-10 w-full">
        
        {/* Frame Hasil */}
        <div style={{ width: '380px', height: '540px', background: '#2E4F4D', border: '1.5px solid #54868A', borderRadius: '23px' }} className="flex items-center justify-center p-4 shadow-2xl shrink-0">
          <div className="w-[140px] h-[480px] bg-[#1A2E2D] rounded-[12px] p-2 flex flex-col gap-2 overflow-hidden">
            {photoSlots.map((slot, index) => (
              <div 
                key={index} 
                className="w-full flex-grow rounded-sm shadow-inner" 
                style={{ backgroundColor: slot.photo ? slot.photo.bg : '#223736' }}
              ></div>
            ))}
          </div>
        </div>

        {/* Action Buttons (Print & Download) */}
        <div className="flex gap-4 shrink-0">
          {/* Tombol Print */}
          <div style={{ width: '220px', height: '85px', background: '#2E4F4D', border: '1.5px solid #54868A', borderRadius: '20px' }} className="flex items-center gap-3 px-3 shadow-md cursor-pointer hover:bg-[#365c5a] transition-all">
            {/* GAMBAR GEDE */}
            <div style={{ width: '60px', height: '60px', background: '#2E706D', borderRadius: '15px' }} className="flex items-center justify-center shrink-0">
               <img src="/print.png" alt="print" className="w-[45px] h-[45px] object-contain" />
            </div>
            {/* TULISAN TETEP KECIL */}
            <div className="flex flex-col">
              <span className="font-inter font-bold text-[18px] leading-tight" style={{ background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Print</span>
              <span className="font-hind font-semibold text-[11px] text-[#3E8C7B] uppercase tracking-tighter">Cetak hasil</span>
            </div>
          </div>

          {/* Tombol Download */}
          <div style={{ width: '220px', height: '85px', background: '#2E4F4D', border: '1.5px solid #54868A', borderRadius: '20px' }} className="flex items-center gap-3 px-3 shadow-md cursor-pointer hover:bg-[#365c5a] transition-all">
            {/* GAMBAR GEDE */}
            <div style={{ width: '60px', height: '60px', background: '#2E706D', borderRadius: '15px' }} className="flex items-center justify-center shrink-0">
               <img src="/expor.png" alt="export" className="w-[45px] h-[45px] object-contain" />
            </div>
            {/* TULISAN TETEP KECIL */}
            <div className="flex flex-col">
              <span className="font-inter font-bold text-[18px] leading-tight" style={{ background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Download</span>
              <span className="font-hind font-semibold text-[11px] text-[#3E8C7B] uppercase tracking-tighter">Simpan file</span>
            </div>
          </div>
        </div>

        {/* Tombol Sesi Baru */}
        <button 
          onClick={handleNewSession}
          style={{ width: '250px', height: '75px', background: '#246855', border: '3px solid #30AC89', borderRadius: '18px' }}
          className="flex items-center justify-between px-6 hover:scale-105 transition-all shadow-xl group mt-2"
        >
          <span className="font-inter font-bold text-[18px]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SESI BARU
          </span>
          {/* IKON REFRESH GEDE */}
          <div className="w-[45px] h-[45px] flex items-center justify-center opacity-90 group-hover:rotate-180 transition-transform duration-500">
             <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#A9E2B5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
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