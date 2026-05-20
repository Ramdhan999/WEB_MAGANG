"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SesiFotoPage() {
  const router = useRouter();
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

  const openTestimoniScreen = () => {
    window.open('/testimoni', '_blank', 'width=1200,height=800');
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center pt-6 pb-12 px-4 md:px-8 select-none overflow-x-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[65%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* CORE CONTENT WRAPPER */}
      <div className="w-full max-w-[1828px] flex flex-col items-center z-10 mt-12">
        
        {/* 1. TOP STATUS BAR */}
        <div className="w-full h-[74px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] px-8 flex items-center justify-between shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="w-[37px] h-[37px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center shadow-inner">
               <img src="/icon1.png" alt="timer icon" className="w-[20px] h-[20px] object-contain" />
            </div>
            <div className="flex flex-col justify-center leading-none">
              <span className="font-hind font-semibold text-[24px] tracking-[-0.08em] text-[#405444] text-right">
                Sisa waktu sesi:
              </span>
              <span className="font-inter font-medium text-[20px] text-[#FFAE00] mt-1 tracking-[-0.06em]" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="w-[194px] h-[40px] bg-[#EAEAEA] border border-[#379AA1] rounded-[28px] flex items-center px-4 justify-between shadow-inner">
                <div className="w-[18px] h-[18px] bg-[#4B8C86] rounded-full shrink-0"></div>
                <span className="font-hind font-semibold text-[20px] text-[#2B6E6A] tracking-[-0.08em] text-right pb-0.5">Robot Stand-by</span>
             </div>
             <div className="hidden md:block w-[158px] h-[12px] bg-[#373737] rounded-[35px] overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full w-[123px] rounded-[35px]" style={{ backgroundImage: 'linear-gradient(90deg, #18876F 0%, #2AEDC3 36.27%)' }}></div>
             </div>
          </div>
        </div>

        {/* 2. HEADER TEXT BAR */}
        <div className="w-full flex items-end justify-between px-2 mb-2">
          <h1 className="font-inter font-bold text-[24px] text-[#3F3F3F] tracking-[-0.05em] leading-none">
            Sesi Foto
          </h1>
          <span className="font-hind font-semibold text-[20px] text-[#2E8040] tracking-[-0.08em] text-right leading-none pb-0.5">
            {fotoDiambil} foto di ambil.
          </span>
        </div>

        {/* 3. MAIN WORKSPACE */}
        <div className="w-full h-[665px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-[17px] flex flex-col shadow-sm mb-8">
          <h2 className="font-hind font-semibold text-[24px] text-[#303030] mb-3 ml-2 leading-none">
            LAYAR 1 - Kamera Utama
          </h2>
          <div className="w-full flex-grow bg-[#B4B4B4] border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center justify-center overflow-hidden">
            {!isCameraActive ? (
              <div className="flex flex-col items-center animate-pulse">
                 <span className="text-[40px] mb-2">📸</span>
                 <span className="font-inter text-[#666666] text-[18px] font-medium text-center">
                   Menunggu akses kamera dari browser...
                 </span>
              </div>
            ) : (
              <span className="font-inter text-[#888888] text-[24px] font-medium opacity-60 text-center animate-fade-in">
                (Live Feed Kamera Berjalan)
              </span>
            )}
          </div>
        </div>

        {/* 4. BOTTOM ACTION FOOTER AREA (FIX SYSTEM: Dibagi grid agar lanjut terpusat di tengah figma) */}
        <div className="w-full grid grid-cols-3 items-center px-1">
          
          {/* Sisi Kiri (Kolom 1): Tombol KEMBALI tetep di sebelah situ */}
          <div className="flex justify-start">
            <button 
              onClick={() => router.push("/tutorial-kontrol")} 
              className="font-inter font-medium italic text-[24px] tracking-[-0.06em] text-[#0E1E1A] hover:opacity-70 transition-opacity"
            >
              ← KEMBALI
            </button>
          </div>

          {/* Sisi Tengah (Kolom 2): Kumpulan Tombol Lanjut Kunci Tepat di Tengah Layar */}
          <div className="flex items-center justify-center gap-4">
            {/* Tombol Lanjut */}
            {/* Tombol Lanjut (Gaya Font Disamakan Persis: text-[20px] font-extrabold) */}
            <button 
              onClick={() => router.push("/frame")} 
              className="flex items-center justify-center gap-3 w-[265px] h-[53px] bg-[#3A9F86] rounded-[23px] shadow-md transition-all hover:scale-105 active:scale-95 group"
            >
              <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em] leading-none pt-0.5">
                Lanjut
              </span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1 mt-0.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Tombol Bulat 1: Tab Testimoni */}
            <button 
              onClick={openTestimoniScreen}
              className="w-[58px] h-[58px] bg-white border-2 border-[#C4C4C4] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[2px_4px_4px_rgba(0,0,0,0.25)] shrink-0"
              title="Buka Layar 2"
            >
              <div className="w-[32px] h-[32px] border-[3px] border-[#8F8F8F] rounded-full flex items-center justify-center relative">
                <div className="w-[12px] h-[12px] bg-[#7F7F7F] border border-[#8F8F8F] rounded-full"></div>
              </div>
            </button>

            {/* Tombol Bulat 2: Timer Icon */}
            <button 
              className="w-[58px] h-[58px] bg-white border-2 border-[#C4C4C4] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[2px_4px_4px_rgba(0,0,0,0.25)] shrink-0"
            >
              <img src="/icon1.png" alt="timer icon" className="w-[32px] h-[32px] object-contain" />
            </button>
          </div>

          {/* Sisi Kanan (Kolom 3): Kosong Berfungsi untuk Penyeimbang Grid Tengah */}
          <div className="hidden sm:block"></div>

        </div>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </main>
  );
}