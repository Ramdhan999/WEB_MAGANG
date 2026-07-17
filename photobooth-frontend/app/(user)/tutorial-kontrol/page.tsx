"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";

const TUTORIAL_DURATION_SEC = 120;

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

type RenderMode = "standard" | "camera-down" | "flipped" | "receding" | "approaching";

interface Preset {
  id: number;
  name: string;
  desc: string;
  cameraX: number;
  cameraY: number;
  armReachY: number;
  scale: number;
  renderMode: RenderMode;
}

const PRESETS: Preset[] = [
  { id: 1,  name: "Preset 1",  desc: "Kamera di tengah",          cameraX: 0,    cameraY: -30,  armReachY: -30, scale: 1.00, renderMode: "standard" },
  { id: 2,  name: "Preset 2",  desc: "Kamera ke atas",            cameraX: 0,    cameraY: -70,  armReachY: -70, scale: 1.00, renderMode: "standard" },
  { id: 3,  name: "Preset 3",  desc: "Kamera ke kiri atas",       cameraX: -95,  cameraY: -40,  armReachY: -40, scale: 1.00, renderMode: "standard" },
  { id: 4,  name: "Preset 4",  desc: "Kamera ke kanan atas",      cameraX: 95,   cameraY: -40,  armReachY: -40, scale: 1.00, renderMode: "standard" },
  { id: 5,  name: "Preset 5",  desc: "Kamera kedepan menunduk",   cameraX: 0,    cameraY: -50,  armReachY: -50, scale: 1.00, renderMode: "camera-down" },
  { id: 6,  name: "Preset 6",  desc: "Kamera ke bawah",           cameraX: 0,    cameraY: 0,    armReachY: 0,   scale: 1.00, renderMode: "flipped" },
  { id: 7,  name: "Preset 7",  desc: "Kamera ke kanan bawah",     cameraX: 120,  cameraY: 110,   armReachY: 90,  scale: 1.00, renderMode: "standard" },
  { id: 8,  name: "Preset 8",  desc: "Kamera ke kiri bawah",      cameraX: -120, cameraY: 110,   armReachY: 90,  scale: 1.00, renderMode: "standard" },
  { id: 9,  name: "Preset 9",  desc: "Kamera mundur ke belakang", cameraX: 0,    cameraY: -20,  armReachY: -20, scale: 0.70, renderMode: "receding" },
  { id: 10, name: "Preset 10", desc: "Kamera maju ke depan",      cameraX: 0,    cameraY: -30,  armReachY: -10, scale: 1.25, renderMode: "approaching" },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const mode = activePreset.renderMode;
  const isFlipped = mode === "flipped";
  const isCameraDown = mode === "camera-down";
  const isReceding = mode === "receding";
  const isApproaching = mode === "approaching";
  // Scale hanya untuk arm + kamera (bukan base plate)
  const armScale = (isReceding || isApproaching) ? activePreset.scale : 1;

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

        {/* PANEL PREVIEW ROBOT */}
        <div
          className="w-full xl:w-[420px] h-[420px] flex flex-col items-center justify-between p-5 relative overflow-hidden shadow-xl shrink-0"
          style={{
            background: 'radial-gradient(120% 120% at 50% -10%, #2A6B57 0%, #143028 40%, #1A2438 90%)',
            border: '2px solid #3A9F86',
            borderRadius: '20px'
          }}
        >
          {/* Label atas kiri */}
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#305A53] border border-[#5D837A] rounded-full self-start shadow-inner z-40">
            <div className="w-[10px] h-[10px] rounded-full bg-[#27E6A0] animate-pulse" />
            <span className="font-hind font-semibold text-[13px] text-[#A5CFC4] tracking-[-0.05em]">Pratinjau Robot</span>
          </div>

          {/* ROBOT ILUSTRASI — SVG */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              viewBox="0 0 400 380"
              className="w-full h-full"
              style={{ maxHeight: '380px' }}
            >
              <defs>
                <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4A8778" />
                  <stop offset="50%" stopColor="#7BC0AA" />
                  <stop offset="100%" stopColor="#4A8778" />
                </linearGradient>
                <radialGradient id="jointGrad" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#7BC0AA" />
                  <stop offset="60%" stopColor="#3E7566" />
                  <stop offset="100%" stopColor="#1F4238" />
                </radialGradient>
                <linearGradient id="baseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5A9887" />
                  <stop offset="100%" stopColor="#2A5A4A" />
                </linearGradient>
                <linearGradient id="camGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5A9887" />
                  <stop offset="100%" stopColor="#1F4238" />
                </linearGradient>
                <radialGradient id="shadowGrad">
                  <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
                  <stop offset="70%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
              </defs>

              {/* GROUND SHADOW — TETAP FIXED, ga scale */}
              <ellipse
                cx="200"
                cy="330"
                rx="110"
                ry="8"
                fill="url(#shadowGrad)"
                opacity="0.5"
              />

              {/* BASE PLATE — SELALU FIXED SIZE, tidak ikut scale */}
              {!isFlipped && (
                <>
                  <rect x="100" y="310" width="200" height="14" rx="7" fill="url(#baseGrad)" stroke="#3E8568" strokeWidth="1.5" />
                  <circle cx="200" cy="298" r="14" fill="url(#jointGrad)" stroke="#5A9887" strokeWidth="2" />
                </>
              )}

              {/* ARM + KAMERA — scale hanya arm & kamera (bukan base) */}
              <g style={{ transform: `scale(${armScale})`, transformOrigin: '200px 298px' }}>

                {/* ===== FLIPPED MODE (Preset 6): Base atas, arm hang down, kamera bawah ===== */}
                {isFlipped ? (
                  <>
                    {/* Base plate ATAS — rapi center */}
                    <rect x="100" y="70" width="200" height="14" rx="7" fill="url(#baseGrad)" stroke="#3E8568" strokeWidth="1.5" />
                    {/* Base joint di BAWAH plate */}
                    <circle cx="200" cy="92" r="14" fill="url(#jointGrad)" stroke="#5A9887" strokeWidth="2" />
                    {/* Lower arm hang down */}
                    <rect x="193" y="106" width="14" height="65" rx="4" fill="url(#armGrad)" stroke="#3E8568" strokeWidth="1.5" />
                    {/* Elbow */}
                    <circle cx="200" cy="175" r="11" fill="url(#jointGrad)" stroke="#5A9887" strokeWidth="2" />
                    {/* Upper arm continue down */}
                    <rect x="194" y="186" width="12" height="55" rx="3" fill="url(#armGrad)" stroke="#3E8568" strokeWidth="1.5" />
                    {/* Camera di bawah */}
                    <g transform="translate(160, 245)">
                      <rect x="0" y="0" width="80" height="60" rx="10" fill="url(#camGrad)" stroke="#7BC0AA" strokeWidth="2.5" />
                      <circle cx="40" cy="30" r="17" fill="#0F1F1B" stroke="#7BC0AA" strokeWidth="3" />
                      <circle cx="40" cy="30" r="10" fill="#27E6A0" />
                      <circle cx="72" cy="8" r="3" fill="#FF5555" />
                    </g>
                  </>
                ) : isCameraDown ? (
                  <>
                    {/* ===== CAMERA-DOWN MODE (Preset 5): Arm lurus, kamera lurus + label nunduk ===== */}
                    {/* Lower arm vertikal */}
                    <rect x="193" y="216" width="14" height="70" rx="4" fill="url(#armGrad)" stroke="#3E8568" strokeWidth="1.5" />
                    {/* Elbow */}
                    <circle cx="200" cy="216" r="11" fill="url(#jointGrad)" stroke="#5A9887" strokeWidth="2" />
                    {/* Upper arm lurus vertikal */}
                    <rect
                      x="194"
                      y="146"
                      width="12"
                      height="70"
                      rx="3"
                      fill="url(#armGrad)"
                      stroke="#3E8568"
                      strokeWidth="1.5"
                    />
                    {/* Camera — lurus (gak rotate) */}
                    <g transform="translate(160, 86)">
                      <rect x="0" y="0" width="80" height="60" rx="10" fill="url(#camGrad)" stroke="#7BC0AA" strokeWidth="2.5" />
                      <circle cx="40" cy="30" r="17" fill="#0F1F1B" stroke="#7BC0AA" strokeWidth="3" />
                      <circle cx="40" cy="30" r="10" fill="#27E6A0" />
                      <circle cx="72" cy="8" r="3" fill="#FF5555" />
                    </g>
                    {/* Badge indicator — match style dengan preset 9/10 */}
                    <g transform="translate(300, 40)">
                      <rect x="0" y="0" width="80" height="24" rx="12" fill="#0F1F1B" opacity="0.8" stroke="#7BC0AA" strokeOpacity="0.5" strokeWidth="1" />
                      <text x="40" y="16" textAnchor="middle" fill="#A5CFC4" fontSize="10" fontWeight="700" fontFamily="Hind Vadodara">
                        ⬇ MENUNDUK
                      </text>
                    </g>
                    {/* Arrow line pointing dari badge ke bawah kamera (nunjukin arah nunduk) */}
                    <line
                      x1="240"
                      y1="146"
                      x2="200"
                      y2="180"
                      stroke="#FFAE00"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                      opacity="0.6"
                    />
                    <polygon points="200,180 205,175 205,185" fill="#FFAE00" opacity="0.7" />
                  </>
                ) : (
                  <>
                    {/* ===== STANDARD MODE (Preset 1-4, 7, 8) + RECEDING (9) + APPROACHING (10) ===== */}

                    {/* RECEDING (Preset 9): Ghost arm segments di belakang */}
                    {isReceding && (
                      <>
                        <rect x="195" y="220" width="10" height="70" rx="3" fill="url(#armGrad)" opacity="0.25" />
                        <rect x="196" y="200" width="8" height="85" rx="3" fill="url(#armGrad)" opacity="0.4" />
                      </>
                    )}

                    {/* Lower arm */}
                    <rect
                      x="193"
                      y="216"
                      width="14"
                      height="70"
                      rx="4"
                      fill="url(#armGrad)"
                      stroke="#3E8568"
                      strokeWidth="1.5"
                    />
                    {/* Elbow */}
                    <circle cx="200" cy="216" r="11" fill="url(#jointGrad)" stroke="#5A9887" strokeWidth="2" />

                    {/* Upper arm — bend ke arah camera (support arah atas & bawah) */}
                    {(() => {
                      const dx = activePreset.cameraX;
                      // armReachY negatif = ke atas, positif = ke bawah
                      const dy = activePreset.armReachY < 0
                        ? -70 + activePreset.armReachY * 0.5   // ke atas: default -70
                        : activePreset.armReachY * 0.7;         // ke bawah: langsung ke bawah dari elbow
                      const armLength = Math.sqrt(dx * dx + dy * dy);
                      // Kalo dy positif (ke bawah), angle di-flip
                      const angle = Math.atan2(dx, dy < 0 ? -dy : -dy) * (180 / Math.PI);
                      // Untuk ke bawah, rotate 180° biar arm mengarah ke bawah
                      const finalAngle = dy > 0 ? angle + 180 : angle;

                      return (
                        <rect
                          x="194"
                          y={216 - (dy > 0 ? 0 : armLength)}
                          width="12"
                          height={armLength}
                          rx="3"
                          fill="url(#armGrad)"
                          stroke="#3E8568"
                          strokeWidth="1.5"
                          transform={`rotate(${finalAngle} 200 216)`}
                        />
                      );
                    })()}

                    {/* Camera head — end of upper arm */}
                    <g transform={`translate(${160 + activePreset.cameraX}, ${105 + activePreset.cameraY})`}>
                      <rect x="0" y="0" width="80" height="60" rx="10" fill="url(#camGrad)" stroke="#7BC0AA" strokeWidth="2.5" />
                      <circle cx="40" cy="30" r="17" fill="#0F1F1B" stroke="#7BC0AA" strokeWidth="3" />
                      <circle cx="40" cy="30" r="10" fill="#27E6A0" />
                      <circle cx="72" cy="8" r="3" fill="#FF5555" />
                    </g>
                  </>
                )}
              </g>

              {/* Depth indicator */}
              {(activePreset.scale < 0.9 || activePreset.scale > 1.1) && (
                <g transform="translate(300, 40)">
                  <rect x="0" y="0" width="80" height="24" rx="12" fill="#0F1F1B" opacity="0.8" stroke="#7BC0AA" strokeOpacity="0.5" strokeWidth="1" />
                  <text x="40" y="16" textAnchor="middle" fill="#A5CFC4" fontSize="10" fontWeight="700" fontFamily="Hind Vadodara">
                    {activePreset.scale > 1 ? '⤴ MAJU' : '⤵ MUNDUR'}
                  </text>
                </g>
              )}
            </svg>
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

        {/* GRID PRESET */}
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
                  <div className={`
                    w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0
                    ${isActive ? 'bg-white' : 'bg-[#3A9F86]'}
                  `}>
                    <span className={`font-inter font-black text-[17px] ${isActive ? 'text-[#3A9F86]' : 'text-white'}`}>
                      {preset.id}
                    </span>
                  </div>

                  <div className="h-[68px] flex items-center justify-center shrink-0">
                    <SmartImg
                      src={`/${imgName}.png`}
                      alt={`Gesture ${preset.id}`}
                      className="w-full h-full object-contain"
                      fallback={String(preset.id)}
                    />
                  </div>

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