"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";
const AUDIO_SRC = "/fase/terima_kasih.mpeg";
const FALLBACK_REDIRECT_SEC = 5;

function TerimaKasihContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") || "";

  const hasRedirectedRef = useRef(false);

  const handleRedirect = () => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    console.log("🔀 [REDIRECT] Fire redirect to /frame");

    if (!txn) {
      router.push("/frame");
      return;
    }
    router.push(`/frame?txn=${txn}`);
  };

  // 🎯 Play audio + trigger redirect pas selesai
  usePageSound(AUDIO_SRC, true, {
    onEnded: handleRedirect,
    keepPlayingOnUnmount: true,
  });

  // 🎯 Safety fallback: kalo audio gak selesai dalam MAX detik, force redirect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasRedirectedRef.current) {
        console.log("⏰ [SAFETY] Max time reached, force redirect");
        handleRedirect();
      }
    }, 15000); // 15 detik max (kalo audio > 15s, adjust naik)

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center pt-4 pb-12 px-4 md:px-8 selection:bg-[#75FFC3] selection:text-[#2E4F4D] overflow-hidden"
      style={{ backgroundColor: '#E3D5D5' }}
    >

      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[65%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[800px] px-4">

        {/* Icon celebration */}
        <div className="relative mb-8">
          <div
            className="w-[160px] h-[160px] rounded-full flex items-center justify-center relative"
            style={{ background: 'linear-gradient(180deg, #3A9F86 0%, #245F55 100%)' }}
          >
            <div className="absolute -top-2 -left-4 w-[12px] h-[12px] rounded-full bg-[#FFAE00] shadow-[0_0_8px_rgba(255,174,0,0.6)] animate-twinkle-1"></div>
            <div className="absolute -top-4 right-6 w-[8px] h-[8px] rounded-full bg-[#96E4A9] shadow-[0_0_6px_rgba(150,228,169,0.6)] animate-twinkle-2"></div>
            <div className="absolute top-8 -right-6 w-[10px] h-[10px] rounded-full bg-[#FFAE00] shadow-[0_0_8px_rgba(255,174,0,0.6)] animate-twinkle-3"></div>
            <div className="absolute -bottom-2 left-8 w-[10px] h-[10px] rounded-full bg-[#96E4A9] shadow-[0_0_8px_rgba(150,228,169,0.6)] animate-twinkle-4"></div>
            <div className="absolute bottom-4 -left-6 w-[8px] h-[8px] rounded-full bg-[#FFAE00] shadow-[0_0_6px_rgba(255,174,0,0.6)] animate-twinkle-5"></div>

            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10" />
            </svg>
          </div>
        </div>

        {/* Label kecil */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#3A9F86]/15 border border-[#3A9F86]/40 rounded-full mb-4 animate-fade-in-up">
          <span className="w-[8px] h-[8px] rounded-full bg-[#3A9F86] animate-pulse"></span>
          <p className="font-hind font-semibold text-[16px] text-[#37786D] tracking-[-0.03em]">
            Sesi foto selesai
          </p>
        </div>

        {/* Heading utama */}
        <h1 className="font-inter font-bold text-[72px] md:text-[88px] text-[#332C2C] tracking-[-0.06em] leading-[0.9] mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Terima Kasih!
        </h1>

        {/* Description */}
        <p className="font-inter font-semibold text-[24px] text-[#37786D] max-w-[600px] leading-[32px] mb-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          Foto kamu sudah siap
        </p>

        <p className="font-inter font-medium text-[20px] text-[#6F6F6F] max-w-[600px] leading-[28px] mb-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          Silakan pilih foto favorit kamu untuk dicetak
        </p>

        {/* Info lanjut */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-[#D5C5B0] rounded-full shadow-md animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="w-[8px] h-[8px] rounded-full bg-[#FFAE00] animate-pulse"></div>
          <p className="font-inter font-semibold text-[15px] text-[#6F6F6F] tracking-[-0.03em]">
            Menuju halaman pilih foto...
          </p>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;0,900;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }

        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .animate-twinkle-1 { animation: twinkle 2s ease-in-out infinite; }
        .animate-twinkle-2 { animation: twinkle 2.3s ease-in-out infinite 0.4s; }
        .animate-twinkle-3 { animation: twinkle 2.5s ease-in-out infinite 0.8s; }
        .animate-twinkle-4 { animation: twinkle 2.2s ease-in-out infinite 1.2s; }
        .animate-twinkle-5 { animation: twinkle 2.4s ease-in-out infinite 1.6s; }

        @keyframes fade-in-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; opacity: 0; }
      `}</style>
    </main>
  );
}

export default function TerimaKasihPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <TerimaKasihContent />
    </Suspense>
  );
}