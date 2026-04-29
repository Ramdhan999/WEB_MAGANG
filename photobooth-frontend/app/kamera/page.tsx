"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function SesiFotoPage() {
  // Timer jalan dari 3 menit 29 detik (209 detik)
  const [timeLeft, setTimeLeft] = useState(209);
  const [fotoDiambil, setFotoDiambil] = useState(0);
  
  // STATE BARU: Buat nyimpen status gambar mana aja yang gagal di-load
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

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

  // 7 Gestur buat grid kotak-kotak di kanan bawah menggunakan PNG
  const tutorialGestures = [
    { src: "/1.png", alt: "1 Jari" },
    { src: "/2.png", alt: "2 Jari" },
    { src: "/3.png", alt: "3 Jari" },
    { src: "/4.png", alt: "4 Jari" },
    { src: "/5.png", alt: "Telapak (5 Jari)" },
    { src: "/kepalan.png", alt: "Kepalan" },
    { src: "/jempol.png", alt: "Jempol" },
  ];

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-10 pb-12 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* --- 0. PROGRESS BAR ATAS --- */}
      <div className="absolute top-0 left-0 w-full h-[10px] z-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[#151515]"></div>
        <div className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out w-[65%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
      </div>

      {/* --- 1. TOP BAR (TIMER & STATUS) --- */}
      <div className="w-full flex justify-center mt-6 mb-2 px-4 z-10">
        <div className="w-[929px] h-[74px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[23px] px-8 flex items-center justify-between shadow-lg">
          
          {/* Sisa Waktu */}
          <div className="flex items-center gap-4">
            {imgErrors['topTimer'] ? (
              <svg width="37" height="37" viewBox="0 0 24 24" fill="none" stroke="#6AC5C3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            ) : (
              <Image 
                src="/image_75.png" 
                alt="timer icon" 
                width={37} 
                height={37} 
                className="object-contain opacity-80" 
                onError={() => setImgErrors(prev => ({...prev, topTimer: true}))}
              />
            )}
            
            <div className="flex flex-col justify-center">
              <span className="font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Sisa waktu sesi:
              </span>
              <span className="font-inter font-medium text-[20px] leading-[24px] tracking-[-0.06em] text-[#FFAE00]" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Status Robot & Progress Bar Kecil */}
          <div className="flex items-center gap-4">
             <div className="w-[194px] h-[40px] bg-[#224142] border border-[#379AA1] rounded-[28px] flex items-center px-4 gap-2">
                <div className="w-[18px] h-[18px] bg-[#4B8C86] rounded-full shrink-0"></div>
                <span className="font-hind font-semibold text-[20px] leading-[30px] tracking-[-0.08em] text-[#53BFB9] whitespace-nowrap">
                  Robot Stand-by
                </span>
             </div>
             <div className="flex h-[12px] rounded-[35px] overflow-hidden bg-[#373737] w-[158px]">
               <div className="h-full rounded-[35px]" style={{ width: '123px', background: 'linear-gradient(90deg, #18876F 0%, #2AEDC3 36.27%)' }}></div>
             </div>
          </div>

        </div>
      </div>

      {/* --- 2. HEADER TITLE --- */}
      <div className="w-full max-w-[1593px] flex items-end justify-between px-2 mb-2 z-10">
        <h1 className="font-inter font-bold text-[24px] leading-[29px] tracking-[-0.05em]" style={{ background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Sesi Foto
        </h1>
        {/* Teks CSS 0 Foto Di Ambil - Sesuai style Figma */}
        <span 
          className="font-hind font-semibold text-[20px] leading-[30px] tracking-[-0.08em] text-right w-[137px] h-[35px]" 
          style={{ 
            background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          {fotoDiambil} foto di ambil.
        </span>
      </div>

      {/* --- 3. MAIN WORKSPACE --- */}
      <div className="w-full max-w-[1593px] min-h-[665px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[23px] p-6 flex gap-6 shadow-2xl z-10 box-border">
        
        {/* ================= KIRI: LAYAR 1 (KAMERA UTAMA) ================= */}
        <div className="flex-[1] flex flex-col">
          <h2 className="font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em] text-white mb-2 ml-2">
            LAYAR 1 - Kamera Utama
          </h2>
          {/* Kamera merentang ke bawah penuh */}
          <div className="w-full flex-grow bg-[#1D2E2D] border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center justify-end pb-8 shadow-inner min-h-[500px]">
            
            {/* AREA VIDEO KAMERA (Kosong warna gelap) */}

            {/* Tombol Kontrol Bawah */}
            <div className="absolute bottom-6 flex items-center justify-center gap-8">
              
              {/* Tombol Kiri (Refresh/Reset) */}
              <button className="w-[58px] h-[58px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center hover:brightness-110 transition-all box-border">
                <div className="w-[32px] h-[32px] border-[3px] border-[#235757] rounded-full flex items-center justify-center box-border">
                  <div className="w-[12px] h-[12px] bg-[#235757] rounded-full"></div>
                </div>
              </button>

              {/* Tombol Jepret Tengah */}
              <button 
                onClick={() => setFotoDiambil(p => p + 1)}
                className="w-[78px] h-[78px] rounded-full border-[5px] border-[#57E19A] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform box-border"
              >
                <div className="w-[58px] h-[58px] bg-[#559A7E] rounded-full shadow-inner"></div>
              </button>

              {/* Tombol Kanan (Timer) */}
              <button className="w-[58px] h-[58px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center hover:brightness-110 transition-all box-border">
                 {imgErrors['camTimer'] ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#235757" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                 ) : (
                    <Image 
                      src="/image_74.png" 
                      alt="timer" 
                      width={41} 
                      height={41} 
                      className="object-contain" 
                      onError={() => setImgErrors(prev => ({...prev, camTimer: true}))}
                    />
                 )}
              </button>

            </div>
          </div>
        </div>

        {/* ================= KANAN: LAYAR 2 (SENSOR GESTUR) ================= */}
        <div className="w-[413px] shrink-0 flex flex-col">
          <h2 className="font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em] text-white mb-2 ml-2">
            LAYAR 2 - Sensor Gestur
          </h2>
          
          <div className="flex flex-col gap-4">
            
            {/* BOX 1: INGAT (Warna Oranye Transparan) */}
            <div className="w-full bg-[rgba(199,128,97,0.2)] border-[1.5px] border-[#FFA470] rounded-[23px] p-5 relative flex flex-col justify-center h-[149px] box-border">
              
              {/* Badge INGAT Kiri Atas (+ logo warning.png) */}
              <div className="absolute top-4 left-4 rounded-[8.5px] px-2 h-[18px] flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(102.89deg, #FFA769 10.48%, #FF5500 152.29%)' }}>
                {imgErrors['warningIcon'] ? (
                  <span className="text-[#141313] font-bold text-[10px]">!</span>
                ) : (
                  <Image src="/warning.png" alt="warning" width={11} height={11} className="object-contain" onError={() => setImgErrors(prev => ({...prev, warningIcon: true}))} />
                )}
                <span className="font-hind font-semibold text-[12px] leading-[18px] tracking-[-0.08em] text-[#141313]">INGAT</span>
              </div>

              {/* List Instruksi (Di-pepetin ke bawah badge dengan PNG baru) */}
              <div className="mt-4 flex flex-col gap-0.5">
                <p className="font-hind font-normal text-[24px] leading-[36px] tracking-[-0.08em] text-[#FCFCFC] flex items-center gap-2 m-0 h-[33px]">
                   {imgErrors['penggaris'] ? <span>📏</span> : <Image src="/penggaris.png" alt="icon" width={24} height={24} className="object-contain" onError={() => setImgErrors(prev => ({...prev, penggaris: true}))} />}
                   <span>Mundur <strong className="font-semibold text-[#FFA470]">3 Meter</strong></span>
                </p>
                <p className="font-hind font-normal text-[24px] leading-[36px] tracking-[-0.08em] text-[#FCFCFC] flex items-center gap-2 m-0 h-[33px]">
                   {imgErrors['jamIcon'] ? <span>⏱️</span> : <Image src="/jam.png" alt="icon" width={24} height={24} className="object-contain" onError={() => setImgErrors(prev => ({...prev, jamIcon: true}))} />}
                   <span>Tunggu <strong className="font-semibold text-[#FFA470]">3 - 5 detik</strong> antar gestur</span>
                </p>
                <p className="font-hind font-normal text-[24px] leading-[36px] tracking-[-0.08em] text-[#FCFCFC] flex items-center gap-2 m-0 h-[33px]">
                   {imgErrors['telapakIcon'] ? <span>✋</span> : <Image src="/telapak.png" alt="icon" width={24} height={24} className="object-contain" onError={() => setImgErrors(prev => ({...prev, telapakIcon: true}))} />}
                   <span>Buka <strong className="font-semibold text-[#FFA470]">telapak</strong> untuk reset</span>
                </p>
              </div>
            </div>

            {/* BOX 2: LIVE PREVIEW SENSORIK */}
            <div className="w-[413px] h-[269px] bg-[#3E7370] border-[1.5px] border-[#54868A] rounded-[23px] p-4 flex flex-col box-border">
              
              <div className="flex items-center gap-2 mb-3">
                <div className="w-[18px] h-[18px] rounded-full shadow-[0_0_8px_#FB0000] animate-pulse" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #FF8686 56.25%, #FB0000 80.77%)' }}></div>
                <h3 className="font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em] text-white m-0">LIVE PREVIEW SENSORIK</h3>
              </div>
              
              {/* Screen Hitam Sensorik */}
              <div className="w-[377px] h-[166px] bg-[#1D2E2D] border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center justify-center shadow-inner box-border">
                {/* IDLE Badge (Kiri Bawah) */}
                <div className="absolute bottom-4 left-4 w-[63px] h-[26px] bg-[#1D2E2D] border-[1.5px] border-[#54868A] rounded-[23px] flex items-center justify-center box-border">
                  <span className="font-hind font-semibold text-[20px] leading-[30px] text-[#919191] tracking-[-0.08em]">IDLE</span>
                </div>
              </div>

              {/* Status Bar Gesture (Bawah) */}
              <div className="w-[377px] h-[41px] mt-3 bg-[#273F3E] border-[1.5px] border-[#54868A] rounded-[11px] flex items-center justify-between px-5 shadow-sm box-border">
                <span className="font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em] text-[#919191]">GESTURE</span>
                <span className="font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em] text-[#919191] text-right w-[91px]">-</span>
              </div>
            </div>

            {/* BOX 3: TUTORIAL GESTUR */}
            <div className="w-[413px] h-[158px] bg-[#3E7370] border-[1.5px] border-[#54868A] rounded-[23px] p-4 flex flex-col box-border">
              <div className="w-full border-t-[3px] border-dashed border-[#54868A] mb-2"></div>
              <h4 className="font-hind font-semibold text-[20px] leading-[30px] tracking-[-0.08em] text-[#33E6CE] mb-2 m-0 h-[29px]">
                Tutorial Gestur
              </h4>
              
              {/* Grid 7 Ikon Gestur menggunakan Image PNG */}
              <div className="flex gap-[8px]">
                {tutorialGestures.map((gesture, i) => (
                  <div key={i} className="w-[64px] h-[55px] bg-[#316360] border border-[#54868A] rounded-[4px] flex items-center justify-center shadow-sm hover:brightness-110 transition-all cursor-default overflow-hidden box-border">
                    {imgErrors[`gesture_${i}`] ? (
                      <span className="text-[20px]">👋</span>
                    ) : (
                      <Image 
                        src={gesture.src} 
                        alt={gesture.alt} 
                        width={25} 
                        height={25} 
                        className="object-contain drop-shadow-md"
                        onError={() => setImgErrors(prev => ({...prev, [`gesture_${i}`]: true}))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- 4. TOMBOL BOTTOM LANJUT --- */}
      <div className="mt-8 mb-4 z-10">
        <Link 
          href="/pilih-foto" 
          className="w-[248px] h-[58px] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(72,197,166,0.3)] rounded-[23px] box-border"
          style={{ background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)', border: '3px solid #318570' }}
        >
          <span className="font-inter font-bold italic text-[24px] leading-[29px] tracking-[-0.06em] text-[#1D4F42] text-center w-[177.17px]">
            Pilih foto terbaik!
          </span>
        </Link>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
    </main>
  );
}