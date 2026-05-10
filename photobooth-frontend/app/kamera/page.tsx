"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SesiFotoPage() {
  const [timeLeft, setTimeLeft] = useState(209);
  const [fotoDiambil, setFotoDiambil] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    const cameraTimer = setTimeout(() => {
      setIsCameraActive(true);
      localStorage.setItem('triggerWarning', Date.now().toString());
      
    }, 3000); 
    return () => clearTimeout(cameraTimer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Fungsi buat ngebuka Layar 2 (Testimoni / Layar Operator)
  const openTestimoniScreen = () => {
    window.open('/testimoni', '_blank', 'width=1200,height=800');
  };

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center pt-6 pb-12 px-4 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{ backgroundColor: '#E3D5D5' }}
    >
      {/* PROGRESS BAR ATAS */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[65%]" style={{ backgroundImage: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* 1. TOP BAR */}
      <div className="w-full flex justify-center mt-6 mb-4 z-10 max-w-[1828px]">
        <div className="w-full h-[74px] bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[23px] px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-[37px] h-[37px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center shadow-inner">
               <img src="/icon1.png" alt="timer icon" className="w-[20px] h-[20px] object-contain" />
            </div>
            <div className="flex flex-col justify-center leading-none">
              <span className="font-hind font-semibold text-[20px] md:text-[24px] tracking-[-0.08em]" style={{ color: '#405444' }}>
                Sisa waktu sesi:
              </span>
              <span className="font-inter font-bold text-[18px] md:text-[20px] text-[#FFAE00] mt-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-[160px] md:w-[194px] h-[40px] bg-[#EAEAEA] border border-[#379AA1] rounded-[28px] flex items-center px-4 gap-2">
                <div className="w-[14px] h-[14px] md:w-[18px] md:h-[18px] bg-[#4B8C86] rounded-full"></div>
                <span className="font-hind font-semibold text-[16px] md:text-[20px] text-[#2B6E6A] tracking-[-0.08em]">Robot Stand-by</span>
             </div>
             <div className="hidden md:block w-[158px] h-[12px] bg-[#373737] rounded-full overflow-hidden">
                <div className="h-full w-[80%]" style={{ backgroundImage: 'linear-gradient(90deg, #18876F 0%, #2AEDC3 36.27%)' }}></div>
             </div>
          </div>
        </div>
      </div>

      {/* 2. HEADER TEKS */}
      <div className="w-full max-w-[1828px] flex items-end justify-between px-2 md:px-6 mb-2 z-10">
        <h1 className="font-inter font-bold text-[20px] md:text-[24px] tracking-[-0.05em] text-[#3F3F3F]">
          Sesi Foto
        </h1>
        <span className="font-hind font-semibold text-[18px] md:text-[20px] tracking-[-0.08em] text-[#2E8040]">
          {fotoDiambil} foto di ambil.
        </span>
      </div>

      {/* 3. MAIN WORKSPACE (Kamera Utama) */}
      <div className="w-full max-w-[1828px] min-h-[500px] md:min-h-[665px] bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[23px] p-4 md:p-6 flex flex-col shadow-sm z-10">
        <h2 className="font-hind font-semibold text-[20px] md:text-[24px] text-[#303030] mb-3 ml-2 tracking-tight">
          LAYAR 1 - Kamera Utama
        </h2>
        
        {/* Area Kotak Abu-Abu Kamera */}
        <div className="w-full flex-grow bg-[#B4B4B4] border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center justify-center overflow-hidden">
          
          {/* LOGIKA KAMERA */}
          {!isCameraActive ? (
            <div className="flex flex-col items-center animate-pulse">
               <span className="text-[40px] mb-2">📸</span>
               <span className="font-inter text-[#666666] text-[18px] font-medium text-center">
                 Menunggu akses kamera dari browser...
               </span>
            </div>
          ) : (
            <>
              {/* Feed Kamera Lu (UDAH GAK ADA TOMBOL JEPRET LAGI) */}
              <span className="font-inter text-[#888888] text-[20px] md:text-[24px] font-medium opacity-60 text-center animate-fade-in">
                (Live Feed Kamera Berjalan)
              </span>
            </>
          )}

        </div>
      </div>

      {/* 4. TOMBOL BOTTOM */}
      <div className="mt-8 flex items-center justify-center gap-4 z-10 w-full px-4">
        <Link 
          href="/frame" 
          className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md group shrink-0"
          style={{ 
            width: '248px',
            height: '58px', 
            background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)', 
            border: '3px solid #318570',
            borderRadius: '23px'
          }}
        >
          <span className="font-inter font-bold italic text-[20px] md:text-[24px] tracking-[-0.06em] text-[#1D4F42]">
            Lanjut
          </span>
        </Link>

        {/* Tombol Buka Tab Testimoni/Operator */}
        <button 
          onClick={openTestimoniScreen}
          className="w-[58px] h-[58px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 hover:brightness-110 shadow-md shrink-0"
          title="Buka Layar 2"
        >
          <div className="w-[32px] h-[32px] border-[3px] border-[#235757] rounded-full flex items-center justify-center">
            <div className="w-[12px] h-[12px] bg-[#235757] rounded-full"></div>
          </div>
        </button>

        {/* Tombol Tambahan (Timer Icon) */}
        <button 
          className="w-[58px] h-[58px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 hover:brightness-110 shadow-md shrink-0"
        >
          <img src="/icon1.png" alt="timer icon" className="w-[26px] h-[26px] object-contain" />
        </button>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </main>
  );
}