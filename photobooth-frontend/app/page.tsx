"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePageSound } from "@/hooks/usePageSound";

export default function Home() {
  usePageSound("/fase/awalan.mp3");

  // 🎯 Loop suara awalan.mp3 setiap 30 detik (sampai user navigate)
  const loopAudioRef = useRef<HTMLAudioElement | null>(null);
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startLoop = () => {
      if (loopIntervalRef.current) return;
      loopIntervalRef.current = setInterval(() => {
        if (loopAudioRef.current) {
          try {
            loopAudioRef.current.pause();
            loopAudioRef.current.currentTime = 0;
          } catch (e) { }
        }
        const audio = new Audio("/fase/awalan.mp3");
        loopAudioRef.current = audio;
        audio.play().catch((e) => {
          console.warn("🔇 [LOOP] awalan.mp3 gagal play:", e?.message);
        });
      }, 30000);
    };

    const delayStart = setTimeout(startLoop, 30000);

    return () => {
      clearTimeout(delayStart);
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
      if (loopAudioRef.current) {
        try {
          loopAudioRef.current.pause();
          loopAudioRef.current.currentTime = 0;
        } catch (e) { }
      }
    };
  }, []);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-white bg-[#737373]"
    >

      {/* Background image */}
      <div className="absolute top-0 left-0 w-full h-[75vh] md:h-[65vh] z-0 overflow-hidden pointer-events-none">
        <img
          src="/bg-keluarga.png"
          alt="Family Portrait"
          className="w-full h-full object-cover object-top"
          style={{
            opacity: 1,
            filter: 'contrast(1.1) brightness(1)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(217, 217, 217, 0.2) 0%, rgba(115, 115, 115, 0) 100%)'
          }}
        />
        <div className="absolute bottom-0 left-0 w-full h-32 md:h-48 bg-gradient-to-t from-[#737373] to-transparent"></div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen px-4 py-8 gap-6 md:gap-8">

        {/* 1. BADGE PREMIUM */}
        <div
          className="flex items-center justify-center gap-2 shadow-sm w-[280px] md:w-[342px] h-[32px] md:h-[37px] rounded-full"
          style={{
            background: '#476A53',
            border: '1px solid #85DDA6',
            boxSizing: 'border-box'
          }}
        >
          <div className="w-[14px] h-[14px] md:w-[18px] md:h-[18px]" style={{ background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />

          <span
            className="text-[13px] md:text-[16px] font-bold bg-clip-text text-transparent"
            style={{
              fontFamily: 'Inter, sans-serif',
              lineHeight: '19px',
              backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)'
            }}
          >
            Premium Glambot Photo Studio
          </span>
        </div>

        {/* 2. LOGO & TEKS GLAMBOT STUDIO */}
        <div className="flex items-center justify-center gap-3 md:gap-[15px]">
          <div
            className="flex items-center justify-center shadow-lg w-[60px] h-[60px] md:w-[77px] md:h-[77px] rounded-lg"
            style={{
              background: 'linear-gradient(180deg, #48CF8D 0%, #245F69 100%)',
              border: '1px solid #ACFFC1', boxSizing: 'border-box'
            }}
          >
            <img src="/image2.png" alt="Camera Icon" className="w-[30px] h-[30px] md:w-[41px] md:h-[41px] object-contain" />
          </div>

          <h2
            className="text-[36px] md:text-[48px] m-0"
            style={{ fontFamily: 'Inter, sans-serif', lineHeight: '58px' }}
          >
            <span
              className="not-italic bg-clip-text text-transparent"
              style={{
                fontWeight: 900,
                backgroundImage: 'linear-gradient(90deg, #FFFFFF 0%, #999999 200%)'
              }}
            >
              GLAMBOT
            </span>
            <span
              className="italic bg-clip-text text-transparent"
              style={{
                fontWeight: 300,
                backgroundImage: 'linear-gradient(273.8deg, #74BECD 23.66%, #96E4A9 63.36%)'
              }}
            >
              STUDIO
            </span>
          </h2>
        </div>

        {/* 3. CTA GROUP — heading + arrow + button (compact, related) */}
        <div className="flex flex-col items-center gap-3 md:gap-4 mt-2 md:mt-4">

          {/* Heading dengan decorative accents */}
          <div className="relative flex items-center justify-center py-4 md:py-6">

            {/* Decorative sparkles kiri */}
            <div className="absolute left-[-40px] md:left-[-60px] top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2 animate-fade-in-slow">
              <div className="w-[8px] h-[8px] rounded-full bg-[#96E4A9] shadow-[0_0_12px_#96E4A9]"></div>
              <div className="w-[4px] h-[4px] rounded-full bg-[#74BECD] shadow-[0_0_8px_#74BECD] ml-3"></div>
            </div>

            {/* Decorative sparkles kanan */}
            <div className="absolute right-[-40px] md:right-[-60px] top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2 items-end animate-fade-in-slow">
              <div className="w-[8px] h-[8px] rounded-full bg-[#96E4A9] shadow-[0_0_12px_#96E4A9]"></div>
              <div className="w-[4px] h-[4px] rounded-full bg-[#74BECD] shadow-[0_0_8px_#74BECD] mr-3"></div>
            </div>

            {/* Text "Tap untuk Mulai" — 1 line, gradient blue-green matching Opsi 1 */}
            <h1
              className="text-center italic m-0 whitespace-nowrap bg-clip-text text-transparent animate-pulse-slow"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(52px, 8vw, 96px)',
                backgroundImage: 'linear-gradient(273.8deg, #74BECD 23.66%, #96E4A9 63.36%)',
                lineHeight: '1.25',
                letterSpacing: '-0.02em',
                paddingLeft: '0.1em',
                paddingRight: '0.1em',
                textShadow: '0 2px 12px rgba(72, 197, 166, 0.35)',
              }}
            >
              Tap untuk Mulai
            </h1>
          </div>

          {/* Arrow tunggal — mengarah ke button */}
          <div className="flex flex-col items-center -mt-6 md:-mt-8 -mb-4 md:-mb-6">
            <div className="animate-bounce-arrow-1">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#96E4A9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </div>

          {/* Tombol dengan ring pulse */}
          <div className="relative flex items-center justify-center">
            {/* Ring pulse rings */}
            <div className="absolute w-full h-full rounded-full animate-ring-pulse-1" style={{ boxShadow: '0 0 0 4px rgba(72, 197, 166, 0.3)' }}></div>
            <div className="absolute w-full h-full rounded-full animate-ring-pulse-2" style={{ boxShadow: '0 0 0 4px rgba(72, 197, 166, 0.3)' }}></div>

            <Link href="/tutorial" className="group relative flex items-center justify-center cursor-pointer w-[140px] h-[140px] md:w-[184px] md:h-[184px]">
              <div className="absolute transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-110 w-full h-full rounded-full" style={{ background: 'radial-gradient(75% 75% at 50% 50%, rgba(72, 197, 166, 0.4) 0%, rgba(35, 95, 80, 0) 100%)' }}></div>
              <div className="absolute transition-transform duration-700 group-hover:rotate-180 w-[85%] h-[85%] rounded-full border-[1.5px] border-dashed border-[#27B18A] box-border animate-spin-slow"></div>
              <div className="absolute w-[75%] h-[75%] rounded-full border-[1.5px] border-solid border-[#27B18A] box-border"></div>
              <div className="absolute flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-lg w-[58%] h-[58%] rounded-full bg-[#48C5A6] animate-glow-pulse">
                <img src="/image1.png" alt="Touch" className="w-[45%] h-[45%] object-contain transition-transform duration-300 group-hover:scale-110" />
              </div>
            </Link>
          </div>
        </div>

      </div>

      {/* 🎯 Custom animation styles */}
      <style jsx global>{`
        /* Text glow effect */
        @keyframes glow-text {
          0%, 100% { 
            filter: drop-shadow(0 0 20px rgba(150, 228, 169, 0.4)) drop-shadow(0 0 40px rgba(116, 190, 205, 0.2));
            transform: scale(1);
          }
          50% { 
            filter: drop-shadow(0 0 30px rgba(150, 228, 169, 0.7)) drop-shadow(0 0 60px rgba(116, 190, 205, 0.4));
            transform: scale(1.02);
          }
        }
        .animate-glow-text { animation: glow-text 3s ease-in-out infinite; }

        /* Glow pulse button */
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 25px rgba(72, 197, 166, 0.5), 0 0 50px rgba(72, 197, 166, 0.25); }
          50% { box-shadow: 0 0 40px rgba(72, 197, 166, 0.9), 0 0 80px rgba(72, 197, 166, 0.5); }
        }
        .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }

        /* Arrow bounce - dua panah dengan delay beda */
        @keyframes bounce-arrow-1 {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(6px); opacity: 0.9; }
        }
        .animate-bounce-arrow-1 { animation: bounce-arrow-1 1.4s ease-in-out infinite; }

        @keyframes bounce-arrow-2 {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(6px); opacity: 0.7; }
        }
        .animate-bounce-arrow-2 { animation: bounce-arrow-2 1.4s ease-in-out infinite 0.2s; }

        /* Ring pulse (2 rings dengan delay) */
        @keyframes ring-pulse-1 {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .animate-ring-pulse-1 { animation: ring-pulse-1 2s ease-out infinite; }

        @keyframes ring-pulse-2 {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-ring-pulse-2 { animation: ring-pulse-2 2s ease-out infinite 0.5s; }

        /* Spin slow untuk dashed ring */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }

        /* Fade in slow untuk sparkles */
        @keyframes fade-in-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .animate-fade-in-slow { animation: fade-in-slow 2s ease-in-out infinite; }
      `}</style>
    </main>
  );
}