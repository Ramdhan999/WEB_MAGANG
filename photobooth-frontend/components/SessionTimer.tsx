"use client";

import { useEffect, useRef } from "react";

// ⏱️ Timer sesi bersama untuk halaman edit foto (frame, print-preview, filter).
//    Pas 30 detik terakhir: warna jadi merah + animasi denyut, dan suara
//    habis.mp3 diputar SEKALI sebagai peringatan waktu mau habis.

const WARNING_AT = 30; // mulai peringatan di detik ke-30 terakhir

const formatTime = (s: number) => {
  const safe = Math.max(0, s);
  const m = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function SessionTimer({
  seconds,
  soundKey,
}: {
  seconds: number;
  /**
   * Kalau diisi, suara habis.mp3 cuma bunyi SEKALI total untuk semua halaman
   * dengan soundKey yang sama (dilacak lewat sessionStorage). Dipakai biar
   * frame + print-preview (timernya digabung/nyambung) nggak bunyi 2x.
   * Kalau kosong (misal filter), tiap halaman bunyi sendiri.
   */
  soundKey?: string;
}) {
  const warning = seconds <= WARNING_AT && seconds > 0;
  const playedRef = useRef(false);
  const storeKey = soundKey ? `habis-played-${soundKey}` : null;

  useEffect(() => {
    // Reset kalau timer balik di atas ambang (misal sesi diperpanjang)
    if (seconds > WARNING_AT) {
      playedRef.current = false;
      if (storeKey) { try { sessionStorage.removeItem(storeKey); } catch { } }
      return;
    }
    // Masuk 30 detik terakhir → bunyiin habis.mp3 sekali aja
    if (warning && !playedRef.current) {
      playedRef.current = true;
      // Cek penanda lintas-halaman: kalau timer digabung & udah bunyi di halaman
      // sebelumnya, jangan bunyiin lagi.
      let already = false;
      if (storeKey) { try { already = sessionStorage.getItem(storeKey) === "1"; } catch { } }
      if (!already) {
        if (storeKey) { try { sessionStorage.setItem(storeKey, "1"); } catch { } }
        try {
          const audio = new Audio("/fase/habis.mp3");
          audio.play().catch(() => { });
        } catch { }
      }
    }
  }, [warning, seconds, storeKey]);

  return (
    <div
      className={`fixed top-6 right-6 z-[80] px-4 h-[52px] bg-white rounded-[28px] shadow-md flex items-center gap-3 border-[1.5px] transition-colors duration-300 ${warning ? "border-[#FF3B30] animate-timer-warning" : "border-[#54868A]"
        }`}
    >
      <div
        className={`w-[32px] h-[32px] border-[2px] rounded-full flex items-center justify-center shadow-inner shrink-0 transition-colors duration-300 ${warning ? "bg-[#FF3B30] border-[#8B1A12]" : "bg-[#3F9C9B] border-[#235757]"
          }`}
      >
        <img src="/icon1.png" alt="timer" className="w-[16px] h-[16px] object-contain" />
      </div>
      <div className="flex flex-col justify-center leading-none">
        <span
          className="font-semibold text-[10px] tracking-widest text-[#7A7979]"
          style={{ fontFamily: "'Hind Vadodara', sans-serif" }}
        >
          SISA WAKTU
        </span>
        <span
          className={`font-bold text-[22px] tracking-[-0.05em] leading-none transition-colors duration-300 ${warning ? "text-[#FF3B30]" : "text-[#FFAE00]"
            }`}
          style={{ fontFamily: "'Inter', sans-serif", textShadow: "1px 1px 3px rgba(0,0,0,0.2)" }}
          suppressHydrationWarning
        >
          {formatTime(seconds)}
        </span>
      </div>

      <style jsx global>{`
        @keyframes timer-warning {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.5); transform: scale(1); }
          50% { box-shadow: 0 0 20px 5px rgba(255, 59, 48, 0.55); transform: scale(1.07); }
        }
        .animate-timer-warning { animation: timer-warning 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
