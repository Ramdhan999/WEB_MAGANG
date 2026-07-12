"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";

// 🎯 Timer config
const TUTORIAL_DURATION_SEC = 120; // 2 menit

function SmartImg({
  src, alt, className, fallback,
}: { src: string; alt: string; className?: string; fallback?: string }) {
  const [tries, setTries] = useState(0);
  const [failed, setFailed] = useState(false);
  const MAX_RETRY = 4;

  const realSrc = tries === 0 ? src : `${src}?r=${tries}`;

  if (failed && fallback) {
    return <span className="text-white text-base font-bold">{fallback}</span>;
  }

  return (
    <img
      src={realSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (tries < MAX_RETRY) {
          setTimeout(() => setTries((t) => t + 1), 200 * (tries + 1));
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

// 🎯 Mapping angka → nama file gambar (matching /kamera page)
const NUMBER_NAMES: Record<number, string> = {
  1: "satu", 2: "dua", 3: "tiga", 4: "empat", 5: "lima",
  6: "enam", 7: "tujuh", 8: "delapan", 9: "sembilan", 10: "sepuluh"
};

// 🎯 Preset list — 10 posisi kamera
interface Preset {
  id: number;
  name: string;
  desc: string;
  cameraX: number;
  cameraY: number;
  tilt: number;
}

const PRESETS: Preset[] = [
  { id: 1, name: "Preset 1", desc: "Angle atas-kiri", cameraX: -80, cameraY: -30, tilt: -15 },
  { id: 2, name: "Preset 2", desc: "Angle atas-kanan", cameraX: 80, cameraY: -30, tilt: 15 },
  { id: 3, name: "Preset 3", desc: "Angle bawah-kiri", cameraX: -80, cameraY: 30, tilt: -15 },
  { id: 4, name: "Preset 4", desc: "Angle bawah-kanan", cameraX: 80, cameraY: 30, tilt: 15 },
  { id: 5, name: "Preset 5", desc: "Depan, agak nunduk", cameraX: 0, cameraY: 25, tilt: 0 },
  { id: 6, name: "Preset 6", desc: "Sisi kiri", cameraX: -110, cameraY: 0, tilt: 0 },
  { id: 7, name: "Preset 7", desc: "Sisi kanan", cameraX: 110, cameraY: 0, tilt: 0 },
  { id: 8, name: "Preset 8", desc: "Atas dead-center", cameraX: 0, cameraY: -40, tilt: 0 },
  { id: 9, name: "Preset 9", desc: "Zoom-in tengah", cameraX: 0, cameraY: -10, tilt: 0 },
  { id: 10, name: "Preset 10", desc: "Wide shot tengah", cameraX: 0, cameraY: 10, tilt: 0 },
];

function TutorialKontrolContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") || "";

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(TUTORIAL_DURATION_SEC);
  const hasRedirectedRef = useRef(false);

  usePageSound("/fase/kontrol.mp3");

  const activePreset = PRESETS[activeIndex];

  // Auto-cycle preset tiap 2.5 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PRESETS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Timer 2 menit → auto-redirect ke /instruksi
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        handleNext();
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

const handleNext = () => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    if (!txn) {
      router.push("/instruksi");
      return;
    }

    // Navigate ke halaman instruksi (robot enable dipindah ke sana)
    router.push(`/instruksi?txn=${txn}`);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center pt-4 pb-12 px-4 md:px-8 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>

      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[55%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* TIMER */}
      <div className="fixed top-6 right-6 z-[80] px-4 h-[52px] bg-white border-[1.5px] border-[#54868A] rounded-[28px] shadow-md flex items-center gap-3">
        <div className="w-[32px] h-[32px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center shadow-inner shrink-0">
          <img src="/icon1.png" alt="timer" className="w-[16px] h-[16px] object-contain" />
        </div>
        <div className="flex flex-col justify-center leading-none">
          <span className="font-hind font-semibold text-[10px] tracking-widest text-[#7A7979]">SISA WAKTU</span>
          <span className="font-inter font-bold text-[22px] text-[#FFAE00] tracking-[-0.05em] leading-none" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.2)" }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* HEADER AREA */}
      <div className="w-full max-w-[1225px] flex flex-col items-center mt-12 mb-16 z-10 text-center relative px-2">
        <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">
          Panduan Kontrol Kamera Glambot
        </p>
        <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">
          Preset Kamera Glambot
        </h1>
        <div className="text-[28px] text-[#328F7F] mb-3">★</div>
        <p className="font-inter font-semibold text-[20px] text-[#6F6F6F] mt-4 leading-[24px] whitespace-nowrap">
          Glambot dapat di kontrol melalui gesture jari tangan 1 sampai 10 seperti di bawah ini
        </p>
      </div>

      {/* CONTAINER UTAMA */}
      <div className="w-full max-w-[1400px] flex flex-col xl:flex-row items-center justify-center gap-6 mb-10 z-10">

        {/* PANEL PREVIEW ROBOT (POLISHED) */}
        <div
          className="w-full xl:w-[420px] h-[420px] flex flex-col items-center justify-between p-5 relative overflow-hidden shadow-xl shrink-0"
          style={{
            background: 'radial-gradient(120% 120% at 50% -10%, #2A6B57 0%, #143028 40%, #1A2438 90%)',
            border: '2px solid #3A9F86',
            borderRadius: '20px'
          }}
        >
          {/* Label atas kiri */}
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#305A53] border border-[#5D837A] rounded-full self-start shadow-inner">
            <div className="w-[10px] h-[10px] rounded-full bg-[#27E6A0] animate-pulse" />
            <span className="font-hind font-semibold text-[13px] text-[#A5CFC4] tracking-[-0.05em]">Pratinjau Robot</span>
          </div>

          {/* Robot arm ilustrasi */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Base plate — lebih terang */}
            <div
              className="absolute bottom-[50px] w-[200px] h-[12px] rounded-[6px] shadow-xl"
              style={{
                background: 'linear-gradient(180deg, #4A8778 0%, #2A5A4A 100%)',
                border: '1.5px solid #3E8568',
              }}
            ></div>

            {/* Base joint (bulat di atas base plate) */}
            <div
              className="absolute bottom-[54px] w-[24px] h-[24px] rounded-full shadow-lg z-10"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #6BAB99 0%, #3E7566 60%, #1F4238 100%)',
                border: '2px solid #4A8778',
                left: 'calc(50% - 12px)',
              }}
            ></div>

            {/* Arm segment (vertical rod) — lebih terang, connected ke camera */}
            <div
              className="absolute w-[10px] rounded-full transition-all duration-1000 ease-in-out shadow-xl z-[15]"
              style={{
                background: 'linear-gradient(90deg, #4A8778 0%, #6BAB99 50%, #4A8778 100%)',
                border: '1px solid #3E8568',
                bottom: `65px`,
                left: `calc(50% + ${activePreset.cameraX / 2}px - 5px)`,
                height: `${150 - activePreset.cameraY * 0.3}px`,
                transform: `rotate(${activePreset.tilt * 0.4}deg)`,
                transformOrigin: 'bottom center'
              }}
            />

            {/* Camera head — connected ke arm (offset lebih dekat) */}
            <div
              className="absolute w-[76px] h-[58px] rounded-[12px] flex items-center justify-center shadow-2xl z-20 transition-all duration-1000 ease-in-out"
              style={{
                background: 'linear-gradient(135deg, #4A8778 0%, #1F4238 100%)',
                border: '2.5px solid #6BAB99',
                transform: `translate(${activePreset.cameraX}px, ${activePreset.cameraY}px) rotate(${activePreset.tilt}deg)`,
                top: '38%',
                left: 'calc(50% - 38px)',
              }}
            >
              {/* Lens ring */}
              <div className="w-[32px] h-[32px] rounded-full border-[3px] border-[#6BAB99] flex items-center justify-center bg-[#0F1F1B]">
                <div className="w-[18px] h-[18px] rounded-full bg-[#27E6A0] shadow-[0_0_12px_#27E6A0]" />
              </div>
              {/* LED indicator */}
              <div className="absolute top-1.5 right-1.5 w-[5px] h-[5px] rounded-full bg-[#FF5555] animate-pulse shadow-[0_0_4px_#FF5555]"></div>
              {/* Small detail: model text */}
              <div className="absolute bottom-1 left-2 w-[8px] h-[3px] rounded-full bg-[#6BAB99]/60"></div>
            </div>
          </div>

          {/* Label preset aktif (bawah) */}
          <div className="flex flex-col items-center gap-1.5 z-30 mt-auto w-full">
            <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-[#3A9F86] border border-[#5DBFAA] rounded-full shadow-lg">
              <span className="font-inter font-black text-[16px] text-white tracking-tight">
                {activePreset.name}
              </span>
            </div>
            <span className="font-hind font-medium text-[15px] text-[#A5CFC4] tracking-[-0.04em]">
              {activePreset.desc}
            </span>
          </div>
        </div>

        {/* GRID PRESET (2 rows × 5 cols, BIGGER) */}
        <div className="flex-1 max-w-[1050px]">
          <div className="grid grid-cols-5 gap-4">
            {PRESETS.map((preset) => {
              const isActive = activePreset.id === preset.id;
              const imgName = NUMBER_NAMES[preset.id];
              return (
                <div
                  key={preset.id}
                  className={`
                    flex flex-col items-center justify-between py-4 px-3 rounded-[20px] transition-all duration-300 shadow-md border-2 h-[190px]
                    ${isActive
                      ? 'bg-gradient-to-br from-[#3A9F86] to-[#245F55] border-white scale-105 shadow-[0_0_20px_rgba(58,159,134,0.5)] z-10'
                      : 'bg-white border-[#54868A]/40'
                    }
                  `}
                >
                  {/* Number badge */}
                  <div className={`
                    w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0
                    ${isActive ? 'bg-white' : 'bg-[#3A9F86]'}
                  `}>
                    <span className={`font-inter font-black text-[17px] ${isActive ? 'text-[#3A9F86]' : 'text-white'}`}>
                      {preset.id}
                    </span>
                  </div>

                  {/* Gesture image */}
                  <div className="h-[68px] flex items-center justify-center shrink-0">
                    <SmartImg
                      src={`/${imgName}.png`}
                      alt={`Gesture ${preset.id}`}
                      className="w-full h-full object-contain"
                      fallback={String(preset.id)}
                    />
                  </div>

                  {/* Preset description */}
                  <p className={`
                    font-hind font-semibold text-[14px] text-center leading-tight tracking-[-0.03em]
                    ${isActive ? 'text-white' : 'text-[#405444]'}
                  `}>
                    {preset.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER — tombol (matching original style) */}
      <div className="w-full max-w-[1200px] flex items-center justify-center z-10">
        <button
          onClick={handleNext}
          className="flex items-center justify-center gap-3 w-full sm:w-[265px] h-[53px] bg-[#3A9F86] border-3 border-[#E3D5D5] rounded-[23px] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
         <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em]">
            Siap Lanjut
          </span>
          <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </div>
        </button>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
    </main>
  );
}

export default function TutorialKontrolPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <TutorialKontrolContent />
    </Suspense>
  );
}