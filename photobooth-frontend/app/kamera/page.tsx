"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SesiFotoPage() {
  const [timeLeft, setTimeLeft] = useState(209);
  const [fotoDiambil, setFotoDiambil] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const tutorialGestures = [
    { src: "/1.png", alt: "1" },
    { src: "/2.png", alt: "2" },
    { src: "/3.png", alt: "3" },
    { src: "/4.png", alt: "4" },
    { src: "/5.png", alt: "5" },
    { src: "/kepalan.png", alt: "K" },
    { src: "/jempol.png", alt: "J" },
  ];

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-10 pb-12"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* --- PROGRESS BAR (1380px) --- */}
      <div className="absolute top-0 left-0 w-full h-[10px] z-20 flex">
        <div className="h-full w-[1380px]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* --- 1. TOP BAR (Pake icon1.png) --- */}
      <div className="w-full flex justify-center mt-6 mb-2 px-4 z-10">
        <div className="w-[929px] h-[74px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[23px] px-8 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            {/* Update: Pake icon1.png */}
            <img src="/icon1.png" alt="icon" className="w-[36px] h-[36px] object-contain" />
            <div className="flex flex-col justify-center leading-none">
              <span className="font-hind font-semibold text-[24px] tracking-[-0.08em]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Sisa waktu sesi:
              </span>
              <span className="font-inter font-medium text-[20px] text-[#FFAE00] mt-1">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-[194px] h-[40px] bg-[#224142] border border-[#379AA1] rounded-[28px] flex items-center px-4 gap-2">
                <div className="w-[16px] h-[16px] bg-[#4B8C86] rounded-full"></div>
                <span className="font-hind font-semibold text-[18px] text-[#53BFB9]">Robot Stand-by</span>
             </div>
             <div className="w-[158px] h-[10px] bg-[#373737] rounded-full overflow-hidden">
                <div className="h-full w-[80%]" style={{ background: 'linear-gradient(90deg, #18876F 0%, #2AEDC3 100%)' }}></div>
             </div>
          </div>
        </div>
      </div>

      {/* --- 2. HEADER --- */}
      <div className="w-full max-w-[1593px] flex items-end justify-between px-2 mb-2 z-10">
        <h1 className="font-inter font-bold text-[24px] tracking-[-0.05em]" style={{ background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Sesi Foto
        </h1>
        <span className="font-hind font-semibold text-[20px] text-[#4DE8D4]">
          {fotoDiambil} foto di ambil.
        </span>
      </div>

      {/* --- 3. MAIN WORKSPACE --- */}
      <div className="w-full max-w-[1593px] min-h-[665px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[23px] p-6 flex gap-6 shadow-2xl z-10">
        
        {/* KIRI: KAMERA */}
        <div className="flex-[1] flex flex-col">
          <h2 className="font-hind font-semibold text-[24px] text-white mb-2 ml-2">LAYAR 1 - Kamera Utama</h2>
          <div className="w-full flex-grow bg-[#1D2E2D] border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center justify-end pb-8">
            
            {/* --- AREA TOMBOL KONTROL --- */}
            <div className="absolute bottom-6 flex items-center gap-8">
              
              {/* Tombol Kiri: Reset dengan titik di tengah */}
              <button className="w-[58px] h-[58px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center transition-all hover:brightness-110 active:scale-95">
                <div className="w-[30px] h-[30px] border-[3px] border-[#235757] rounded-full flex items-center justify-center">
                  {/* Titik Buletan di Tengah */}
                  <div className="w-[10px] h-[10px] bg-[#235757] rounded-full"></div>
                </div>
              </button>

              {/* Tombol Tengah: Jepret (Shutter) */}
              <button 
                onClick={() => setFotoDiambil(p => p + 1)}
                className="w-[78px] h-[78px] border-[5px] border-[#57E19A] rounded-full flex items-center justify-center bg-transparent hover:scale-105 active:scale-95 transition-transform"
              >
                <div className="w-[58px] h-[58px] bg-[#559A7E] rounded-full shadow-inner"></div>
              </button>

              {/* Tombol Kanan: Timer pake icon1.png */}
              <button className="w-[58px] h-[58px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center transition-all hover:brightness-110 active:scale-95">
                <img src="/icon1.png" alt="timer icon" className="w-[32px] h-[32px] object-contain" />
              </button>

            </div>
          </div>
        </div>

        {/* KANAN: SENSOR --- UPDATE MEPETIN TEKS --- */}
        <div className="w-[413px] shrink-0 flex flex-col">
          <h2 className="font-hind font-semibold text-[24px] text-white mb-2 ml-2">LAYAR 2 - Sensor Gestur</h2>
          <div className="flex flex-col gap-4">
            
            {/* BOX INGAT (Mepetin Atas-Bawah) */}
            <div className="w-full bg-[rgba(199,128,97,0.2)] border-[1.5px] border-[#FFA470] rounded-[23px] p-5 relative flex flex-col justify-center min-h-[160px]">
              <div className="absolute top-3 left-4 rounded-[10px] px-3 h-[22px] flex items-center gap-2" style={{ background: 'linear-gradient(102deg, #FFA769 0%, #FF5500 100%)' }}>
                <img src="/warning.png" alt="warning" className="w-[12px] h-[12px]" />
                <span className="font-hind font-bold text-[12px] text-[#141313]">INGAT</span>
              </div>

              {/* Mepetin gap antar baris pake gap-2 dan leading-tight */}
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex items-center gap-4 leading-tight">
                  <img src="/penggaris.png" alt="ruler" className="w-[42px] h-[42px] object-contain" />
                  <span className="font-hind text-[18px] text-[#FCFCFC]">Mundur <strong className="text-[#FFA470]">3 Meter</strong></span>
                </div>
                <div className="flex items-center gap-4 leading-tight">
                  <img src="/jam.png" alt="clock" className="w-[42px] h-[42px] object-contain" />
                  <span className="font-hind text-[18px] text-[#FCFCFC]">Tunggu <strong className="text-[#FFA470]">3 - 5 detik</strong> antar gestur</span>
                </div>
                <div className="flex items-center gap-4 leading-tight">
                  <img src="/telapak.png" alt="palm" className="w-[42px] h-[42px] object-contain" />
                  <span className="font-hind text-[18px] text-[#FCFCFC]">Buka <strong className="text-[#FFA470]">telapak</strong> untuk reset</span>
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW */}
            <div className="w-full bg-[#3E7370] border-[1.5px] border-[#54868A] rounded-[23px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-[14px] h-[14px] rounded-full bg-[#FB0000] animate-pulse shadow-[0_0_8px_red]"></div>
                <h3 className="font-hind font-semibold text-[18px] text-white uppercase">Live Preview Sensorik</h3>
              </div>
              <div className="w-full h-[155px] bg-[#1D2E2D] border-[1.5px] border-[#54868A] rounded-[20px] relative">
                <div className="absolute bottom-3 left-3 px-3 py-0.5 bg-[#1D2E2D] border border-[#54868A] rounded-full text-[13px] text-[#919191]">IDLE</div>
              </div>
              <div className="w-full h-[40px] mt-3 bg-[#273F3E] border border-[#54868A] rounded-[10px] flex items-center justify-between px-4">
                <span className="font-hind text-[18px] text-[#919191]">GESTURE</span>
                <span className="font-hind text-[18px] text-[#919191]">-</span>
              </div>
            </div>

            {/* TUTORIAL GESTUR */}
            <div className="w-full bg-[#3E7370] border-[1.5px] border-[#54868A] rounded-[23px] p-4">
              <h4 className="font-hind font-semibold text-[16px] text-[#33E6CE] mb-3">Tutorial Gestur</h4>
              <div className="flex gap-1.5">
                {tutorialGestures.map((gesture, i) => (
                  <div key={i} className="w-[46px] h-[46px] bg-[#316360] border border-[#54868A] rounded-[6px] flex items-center justify-center">
                    <img src={gesture.src} alt={gesture.alt} className="w-[28px] h-[28px] object-contain" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/pilih-foto" className="px-10 h-[58px] flex items-center justify-center rounded-[23px] shadow-xl hover:scale-105 transition-transform" style={{ background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)', border: '3px solid #318570' }}>
          <span className="font-inter font-bold italic text-[20px] text-[#1D4F42]">Pilih foto terbaik!</span>
        </Link>
      </div>

    </main>
  );
}