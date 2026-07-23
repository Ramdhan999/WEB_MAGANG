"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { usePageSound } from "@/hooks/usePageSound";
import dynamic from "next/dynamic";

// Robot 3D — three.js cuma jalan di browser, jadi WAJIB ssr: false
const DobotViewer = dynamic(() => import("@/components/DobotViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <span className="font-hind font-semibold text-[14px] text-[#A5CFC4]">
        Memuat robot 3D...
      </span>
    </div>
  ),
});

const BACKEND_URL = "http://localhost:8080";

const TUTORIAL_DURATION_SEC = 60;

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

const NUMBER_NAMES: Record<number, string> = {
  1: "satu", 2: "dua", 3: "tiga", 4: "empat", 5: "lima",
  6: "enam", 7: "tujuh", 8: "delapan", 9: "sembilan", 10: "sepuluh"
};

interface Preset {
  id: number;
  name: string;
  desc: string;
}

const PRESETS: Preset[] = [
  { id: 1,  name: "Preset 1",  desc: "Kamera di tengah" },
  { id: 2,  name: "Preset 2",  desc: "Kamera ke atas" },
  { id: 3,  name: "Preset 3",  desc: "Kamera ke kiri atas" },
  { id: 4,  name: "Preset 4",  desc: "Kamera ke kanan atas" },
  { id: 5,  name: "Preset 5",  desc: "Kamera kedepan menunduk" },
  { id: 6,  name: "Preset 6",  desc: "Kamera ke bawah" },
  { id: 7,  name: "Preset 7",  desc: "Kamera ke kanan bawah" },
  { id: 8,  name: "Preset 8",  desc: "Kamera ke kiri bawah" },
  { id: 9,  name: "Preset 9",  desc: "Kamera mundur ke belakang" },
  { id: 10, name: "Preset 10", desc: "Kamera maju ke depan" },
];

function TutorialKontrolContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") || "";

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(TUTORIAL_DURATION_SEC);
  const hasRedirectedRef = useRef(false);

  usePageSound("/fase/kontrol.mpeg");

  const activePreset = PRESETS[activeIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PRESETS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleNext();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleNext = () => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    if (!txn) {
      router.push("/instruksi");
      return;
    }
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
      <div className="w-full max-w-[1620px] flex flex-col xl:flex-row items-center justify-center gap-6 mb-10 z-10">

        {/* PANEL PREVIEW ROBOT — sekarang pakai model 3D asli */}
        <div
          className="w-full xl:w-[600px] h-[600px] flex flex-col p-5 relative overflow-hidden shadow-xl shrink-0"
          style={{
            background: 'radial-gradient(120% 120% at 50% -10%, #2A6B57 0%, #143028 40%, #1A2438 90%)',
            border: '2px solid #3A9F86',
            borderRadius: '20px'
          }}
        >
          {/* Baris atas: badge kiri, label preset kanan.
              Label sengaja DI ATAS, bukan di bawah, supaya pose yang menunduk
              (preset 6/7/8) tidak tertutup tulisan. */}
          <div className="flex items-start justify-between gap-2 z-40 shrink-0">
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#305A53] border border-[#5D837A] rounded-full shadow-inner">
              <div className="w-[10px] h-[10px] rounded-full bg-[#27E6A0] animate-pulse" />
              <span className="font-hind font-semibold text-[13px] text-[#A5CFC4] tracking-[-0.05em]">Pratinjau Robot</span>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-[#3A9F86] border border-[#5DBFAA] rounded-full shadow-lg">
                <span className="font-inter font-black text-[16px] text-white tracking-tight">
                  {activePreset.name}
                </span>
              </div>
              <span className="font-hind font-medium text-[14px] text-[#A5CFC4] tracking-[-0.04em] text-right">
                {activePreset.desc}
              </span>
            </div>
          </div>

          {/* ROBOT 3D — mengisi seluruh panel. Robot diam di tempat,
              hanya sendinya yang bergerak mengikuti preset aktif. */}
          <div className="absolute inset-0 z-10">
            <DobotViewer preset={activePreset.id} />
          </div>
        </div>

        {/* GRID PRESET */}
        <div className="flex-1 max-w-[1000px]">
          <div className="grid grid-cols-5 gap-4">
            {PRESETS.map((preset) => {
              const isActive = activePreset.id === preset.id;
              const imgName = NUMBER_NAMES[preset.id];
              return (
                <div
                  key={preset.id}
                  className={`
                    flex flex-col items-center justify-between py-5 px-3 rounded-[22px] transition-all duration-300 shadow-md border-2 h-[228px]
                    ${isActive
                      ? 'bg-gradient-to-br from-[#3A9F86] to-[#245F55] border-white scale-105 shadow-[0_0_20px_rgba(58,159,134,0.5)] z-10'
                      : 'bg-white border-[#54868A]/40'
                    }
                  `}
                >
                  <div className={`
                    w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0
                    ${isActive ? 'bg-white' : 'bg-[#3A9F86]'}
                  `}>
                    <span className={`font-inter font-black text-[20px] ${isActive ? 'text-[#3A9F86]' : 'text-white'}`}>
                      {preset.id}
                    </span>
                  </div>

                  <div className="h-[92px] flex items-center justify-center shrink-0">
                    <SmartImg
                      src={`/${imgName}.png`}
                      alt={`Gesture ${preset.id}`}
                      className="w-full h-full object-contain"
                      fallback={String(preset.id)}
                    />
                  </div>

                  <p className={`
                    font-hind font-semibold text-[15px] text-center leading-tight tracking-[-0.03em]
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

      {/* FOOTER */}
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