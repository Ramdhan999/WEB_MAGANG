"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success">("verifying");

  useEffect(() => {
    const verifyTimer = setTimeout(() => {
      setStatus("success");
    }, 3000);

    const redirectTimer = setTimeout(() => {
      router.push("/tutorial-kontrol"); 
    }, 5500);

    return () => {
      clearTimeout(verifyTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-white"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* --- PROGRESS BAR  */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20">
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)' }}></div>
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out" 
          style={{ width: '42%', background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}
        ></div>
      </div>

      {/* --- 1. BADGE VERIFIKASI --- */}
      <div 
        className="absolute top-16 flex items-center justify-center gap-3 shadow-lg animate-fade-in-down" 
        style={{ width: '224px', height: '56px', background: '#476A53', border: '1px solid #85DDA6', borderRadius: '28px' }}
      >
        <div style={{ width: '24px', height: '24px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <span className="font-inter font-bold text-[24px]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Verifikasi
        </span>
      </div>

      {/* --- 2. KONTEN TENGAH (CLEAN DESIGN) --- */}
      <div className="relative flex flex-col items-center justify-center z-10">
        
        {/* Glow Aura di belakang (Efek sinar ijo lembut) */}
        <div 
          className={`absolute w-[250px] h-[250px] rounded-full transition-all duration-1000 blur-[80px] ${status === "success" ? "bg-[#00FFB7] opacity-30" : "bg-[#4DE8D4] opacity-10"}`}
        />

        {/* ICON AREA */}
        <div className="relative flex items-center justify-center mb-12 w-[180px] h-[180px]">
          {status === "verifying" ? (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 rounded-full border-[10px] border-[#0C201B]" />
              <div className="absolute inset-0 rounded-full animate-spin-custom border-[10px] border-transparent border-t-[#00FFB7]" />
            </div>
          ) : (
            <div 
              className="absolute inset-0 flex items-center justify-center rounded-full bg-[#00FFB7] animate-pop-in shadow-[0_0_50px_rgba(0,255,183,0.5)]"
              style={{ border: '6px solid #0C201B' }}
            >
              <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#0C201B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="animate-check">
                <path d="M5 12l5 5L20 7"/>
              </svg>
            </div>
          )}
        </div>

        {/* TEXT AREA (FIXED: Tanpa Kotak Putih Glitch) */}
        <div className="flex flex-col items-center gap-2">
          <h1 
            className="font-inter font-bold italic text-[48px] tracking-tight transition-all duration-500"
            style={{ 
              color: status === "success" ? "#FFFFFF" : "#D1D1D1",
              textShadow: status === "success" ? "0 0 20px rgba(117,255,195,0.4)" : "none"
            }}
          >
            {status === "verifying" ? "Memverifikasi..." : "Pembayaran Berhasil!"}
          </h1>
          
          <p className="font-inter text-[18px] opacity-70 tracking-[-0.03em]">
            {status === "verifying" ? "Mohon tunggu sebentar..." : "Menyiapkan sesi Glambot Anda"}
          </p>
        </div>

      </div>

      <style jsx global>{`
        @keyframes spin-custom {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-custom {
          animation: spin-custom 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes pop-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes check {
          0% { stroke-dasharray: 100; stroke-dashoffset: 100; }
          100% { stroke-dasharray: 100; stroke-dashoffset: 0; }
        }
        .animate-pop-in {
          animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-check {
          animation: check 0.7s ease-out forwards;
          animation-delay: 0.2s;
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
      `}</style>
    </main>
  );
}