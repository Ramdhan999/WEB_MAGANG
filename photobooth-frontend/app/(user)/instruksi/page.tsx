"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";

const BACKEND_URL = "http://localhost:8080";
const FALLBACK_DURATION_SEC = 300;

const AUDIO_SEGMENTS = [
  { key: "opening", src: "/fase/instruksi_1.mp3", highlight: "none" },
  { key: "timer", src: "/fase/instruksi_2.mp3", highlight: "timer" },
  { key: "rule-1", src: "/fase/instruksi_3.mp3", highlight: "rule-1" },
  { key: "rule-2", src: "/fase/instruksi_4.mp3", highlight: "rule-2" },
  { key: "rule-3", src: "/fase/instruksi_5.mp3", highlight: "rule-3" },
];

type HighlightTarget = "none" | "timer" | "rule-1" | "rule-2" | "rule-3";

function InstruksiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") || "";

  const [canProceed, setCanProceed] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [packageName, setPackageName] = useState<string>("");
  const [highlight, setHighlight] = useState<HighlightTarget>("none");
  const [currentSegment, setCurrentSegment] = useState<number>(-1);
  const hasRedirectedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // 🎯 Fetch durasi paket
  useEffect(() => {
    if (!txn) {
      setDurationSeconds(FALLBACK_DURATION_SEC);
      return;
    }
    const fetchDuration = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/photo-session/by-transaction/${txn}`);
        if (!res.ok) {
          setDurationSeconds(FALLBACK_DURATION_SEC);
          return;
        }
        const data = await res.json();

        const duration =
          data.duration_seconds ||
          data.session?.duration_seconds ||
          data.session?.duration ||
          data.session?.package?.duration ||
          data.package?.duration ||
          null;

        if (duration) {
          const durationInSeconds = duration < 60 ? duration * 60 : duration;
          setDurationSeconds(durationInSeconds);
        } else {
          setDurationSeconds(FALLBACK_DURATION_SEC);
        }

        if (data.session?.template_name) {
          setPackageName(data.session.template_name);
        }
      } catch (err) {
        console.warn("Gagal fetch durasi paket:", err);
        setDurationSeconds(FALLBACK_DURATION_SEC);
      }
    };
    fetchDuration();
  }, [txn]);

  // 🎯 Play audio sequence dengan sync highlight
  useEffect(() => {
    let cancelled = false;

    const playSegment = (idx: number) => {
      if (cancelled || idx >= AUDIO_SEGMENTS.length) {
        if (!cancelled) {
          setHighlight("none");
          setCurrentSegment(-1);
          setCanProceed(true);
        }
        return;
      }

      const segment = AUDIO_SEGMENTS[idx];
      setCurrentSegment(idx);
      setHighlight(segment.highlight as HighlightTarget);

      const audio = new Audio(segment.src);
      currentAudioRef.current = audio;

      audio.play().catch((err) => {
        if (cancelled) return;
        // AbortError = dev-only (StrictMode/Fast Refresh)
        if (err?.name === "AbortError") {
          console.log(`🔊 [AUDIO] Segment ${idx} aborted (dev), skip`);
          return;
        }
        console.warn(`🔇 [AUDIO] Segment ${idx} (${segment.key}) gagal play:`, err?.message);
        // Fallback: lanjut segment berikutnya setelah 3s
        setTimeout(() => {
          if (!cancelled) playSegment(idx + 1);
        }, 3000);
      });

      audio.addEventListener("ended", () => {
        if (!cancelled) {
          setTimeout(() => {
            playSegment(idx + 1);
          }, 300);
        }
      });

      audio.addEventListener("error", () => {
        if (!cancelled) {
          console.warn(`🔇 [AUDIO] Segment ${idx} (${segment.key}) error, skip`);
          setTimeout(() => playSegment(idx + 1), 500);
        }
      });
    };

    // 🎯 Delay 300ms biar StrictMode double-mount settle
    const startTimeout = setTimeout(() => {
      if (!cancelled) playSegment(0);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(startTimeout);
      // JANGAN pause audio — biarin selesai
    };
  }, []);

  const handleLanjut = async () => {
    if (hasRedirectedRef.current || !canProceed) return;
    hasRedirectedRef.current = true;

    try {
      await fetch(`${BACKEND_URL}/api/robot/enable`, { method: "POST" });
    } catch (err) {
      console.warn("Gagal enable robot:", err);
    }

    if (!txn) {
      router.push("/kamera");
      return;
    }
    router.push(`/kamera?txn=${txn}`);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return { minutes: "-", seconds: "00" };
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return {
      minutes: m.toString(),
      seconds: s.toString().padStart(2, "0"),
    };
  };

  const dur = formatDuration(durationSeconds);
  const hasExtraSeconds = durationSeconds !== null && durationSeconds % 60 !== 0;

  const isActive = (target: HighlightTarget) => highlight === target;
  const isDimmed = (target: HighlightTarget) => highlight !== "none" && highlight !== target;

  const rules = [
    {
      number: 1,
      title: "Jaga Jarak 2 Meter dari Robot",
      titleAccent: "2 Meter",
      titleAccentColor: "#3A9F86",
      description: "Berdiri minimal 2 meter dari lengan robot. Jangan mendekat saat robot bergerak.",
      color: "#3A9F86",
      colorDark: "#245F55",
      highlightKey: "rule-1" as HighlightTarget,
    },
    {
      number: 2,
      title: "Hanya 1 Tangan yang Kontrol Robot",
      titleAccent: "1 Tangan",
      titleAccentColor: "#3A9F86",
      description: "Tunjuk 1 tangan aja untuk gesture jari. Yang lain fokus pose, biar robot gak bingung.",
      color: "#3A9F86",
      colorDark: "#245F55",
      highlightKey: "rule-2" as HighlightTarget,
    },
    {
      number: 3,
      title: "Angkat Telapak (5 Jari) dulu, Baru Pilih Preset",
      titleAccent: "Telapak (5 Jari)",
      titleAccentColor: "#3A9F86",
      description: "Untuk mulai sesi, tunjukkan telapak dulu ke robot. Setelah itu baru pilih preset 1-10 pakai jari.",
      color: "#3A9F86",
      colorDark: "#245F55",
      highlightKey: "rule-3" as HighlightTarget,
    },
  ];

  return (
    <main
      className="relative flex min-h-screen flex-col items-center pt-4 pb-12 px-4 md:px-8 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{ backgroundColor: '#E3D5D5' }}
    >

      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[65%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* HEADER */}
      <div className="w-full max-w-[1225px] flex flex-col items-center mt-10 mb-8 z-10 text-center relative px-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFAE00]/15 border border-[#FFAE00]/40 rounded-full mb-3">
          <span className="w-[8px] h-[8px] rounded-full bg-[#FFAE00] animate-pulse"></span>
          <p className="font-hind font-semibold text-[16px] text-[#B8860B] tracking-[-0.03em]">
            Baca dulu sebelum mulai
          </p>
        </div>
        <p className="font-hind font-semibold text-[24px] text-[#B8860B] tracking-[-0.08em] leading-none text-center mb-1">
          Perhatian
        </p>
        <h1 className="font-inter font-bold text-[56px] text-[#332C2C] tracking-[-0.06em] leading-[64px]">
          Instruksi Sebelum Mulai
        </h1>
        <p className="font-inter font-semibold text-[18px] text-[#6F6F6F] mt-3 max-w-[600px] leading-[22px]">
          Biar sesi foto lancar dan aman, tolong ikuti aturan di bawah ini ya
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="w-full max-w-[720px] flex flex-col items-center justify-center gap-6 mb-8 z-10">

        {/* ⏱️ TIMER CARD */}
        <div className={`w-full max-w-[600px] transition-all duration-500 ${isActive("timer") ? "scale-105" : ""} ${isDimmed("timer") ? "opacity-40" : "opacity-100"}`}>
          <div
            className={`relative rounded-[28px] p-6 shadow-[6px_9px_20px_rgba(0,0,0,0.25)] border-[3px] flex flex-col items-center justify-center overflow-hidden w-full transition-all duration-500 ${isActive("timer") ? "border-[#96E4A9] shadow-[0_0_40px_rgba(150,228,169,0.6)]" : "border-[#3A9F86]"
              }`}
            style={{
              background: 'linear-gradient(180deg, #1C614E 0%, #245F55 100%)'
            }}
          >
            {isActive("timer") && (
              <>
                <div className="absolute inset-[-4px] rounded-[32px] pointer-events-none animate-ring-pulse-1" style={{ boxShadow: '0 0 0 4px rgba(150, 228, 169, 0.4)' }}></div>
                <div className="absolute inset-[-4px] rounded-[32px] pointer-events-none animate-ring-pulse-2" style={{ boxShadow: '0 0 0 4px rgba(150, 228, 169, 0.4)' }}></div>
              </>
            )}

            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 0%, #3A9F86 0%, transparent 70%)',
              }}
            />

            <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 bg-[#3A9F86] rounded-full mb-4 shadow-md border border-[#5DBFAA]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="font-inter font-black text-[13px] text-white tracking-widest">
                WAKTU FOTO KAMU
              </span>
            </div>

            <div className="relative z-10 flex items-baseline gap-2 mb-1">
              <span
                className="font-inter font-black text-[110px] text-white tracking-[-0.06em] leading-none"
                style={{ textShadow: "3px 3px 8px rgba(0,0,0,0.35)" }}
              >
                {dur.minutes}
              </span>
              <span className="font-inter font-black text-[42px] text-[#96E4A9] tracking-[-0.03em]">
                MENIT
              </span>
              {hasExtraSeconds && (
                <span className="font-inter font-bold text-[28px] text-white/70 tracking-[-0.03em] ml-2">
                  {dur.seconds}s
                </span>
              )}
            </div>

            {packageName && (
              <p className="relative z-10 font-inter font-bold text-[15px] text-[#96E4A9] text-center tracking-[-0.03em] mt-2">
                Paket {packageName}
              </p>
            )}
          </div>
        </div>

        {/* 📋 RULES CARD */}
        <div className="w-full">
          <div className="bg-white rounded-[28px] p-8 shadow-[6px_9px_20px_rgba(0,0,0,0.12)] border-[1.5px] border-[#D5C5B0] w-full">

            <div className="flex flex-col items-center gap-3 mb-6 pb-4 border-b border-[#E3D5D5]">
              <div
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-md shrink-0"
                style={{ background: 'linear-gradient(180deg, #FFAE00 0%, #B8860B 100%)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10" />
                </svg>
              </div>
              <p className="font-hind font-bold text-[16px] text-[#B8860B] tracking-widest uppercase leading-none">
                Aturan Penting
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {rules.map((rule) => {
                const parts = rule.title.split(rule.titleAccent);
                const active = isActive(rule.highlightKey);
                const dimmed = isDimmed(rule.highlightKey);
                return (
                  <div
                    key={rule.number}
                    className={`flex items-start gap-4 transition-all duration-500 rounded-[16px] p-3 -m-3 ${active ? "scale-105 bg-[#3A9F86]/10 shadow-[0_0_30px_rgba(58,159,134,0.3)]" : ""
                      } ${dimmed ? "opacity-40" : "opacity-100"}`}
                  >
                    <div
                      className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 shadow-md transition-all duration-500 ${active ? "shadow-[0_0_20px_rgba(58,159,134,0.7)]" : ""}`}
                      style={{ background: `linear-gradient(180deg, ${rule.color} 0%, ${rule.colorDark} 100%)` }}
                    >
                      <span className="font-inter font-black text-white text-[22px]">{rule.number}</span>
                    </div>

                    <div className="flex-1 pt-1">
                      <h3 className="font-inter font-bold text-[20px] text-[#332C2C] tracking-[-0.03em] leading-[24px] mb-1.5">
                        {parts[0]}
                        <span style={{ color: rule.titleAccentColor }}>{rule.titleAccent}</span>
                        {parts[1]}
                      </h3>
                      <p className="font-inter font-medium text-[14px] text-[#6F6F6F] leading-[20px]">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="w-full max-w-[1440px] flex flex-col items-center mt-2 z-10 relative">
        <button
          onClick={handleLanjut}
          disabled={!canProceed}
          className={`flex items-center justify-center gap-3 w-full sm:w-[320px] h-[53px] rounded-[23px] shadow-md transition-all ${canProceed
            ? 'bg-[#3A9F86] border-3 border-[#E3D5D5] hover:scale-105 active:scale-95 cursor-pointer'
            : 'bg-[#B8B8B8] border-3 border-[#E3D5D5] cursor-not-allowed opacity-70'
            }`}
        >
          <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em]">
            {canProceed ? "Siap Mulai Foto" : `Sedang menjelaskan...`}
          </span>
          {canProceed && (
            <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </div>
          )}
        </button>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;0,900;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }

        @keyframes ring-pulse-1 {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        .animate-ring-pulse-1 { animation: ring-pulse-1 2s ease-out infinite; }

        @keyframes ring-pulse-2 {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        .animate-ring-pulse-2 { animation: ring-pulse-2 2s ease-out infinite 0.5s; }

        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 15px rgba(58, 159, 134, 0.4); }
          50% { box-shadow: 0 0 30px rgba(58, 159, 134, 0.8); }
        }
        .animate-pulse-subtle { animation: pulse-subtle 2s ease-in-out infinite; }
      `}</style>
    </main>
  );
}

export default function InstruksiPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <InstruksiContent />
    </Suspense>
  );
}