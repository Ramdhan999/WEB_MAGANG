"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success">("verifying");

  useEffect(() => {
    // Simulasi loading muter-muter selama 3 detik
    const verifyTimer = setTimeout(() => {
      setStatus("success");
    }, 3000);

    // Setelah tulisan "Berhasil" muncul, tunggu 2 detik trus lempar ke halaman berikutnya
    const redirectTimer = setTimeout(() => {
      // Ganti rute ini ke halaman selanjutnya (misal: halaman tutorial atau hitung mundur)
      router.push("/tutorial-kontrol"); 
    }, 5000);

    return () => {
      clearTimeout(verifyTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-white transition-all duration-500"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* --- 0. PROGRESS BAR (Sesuai gambar, sekitar 42%) --- */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20">
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)' }}></div>
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out" 
          style={{ width: '42%', background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}
        ></div>
      </div>

      {/* --- 1. BADGE VERIFIKASI (Di Atas Tengah) --- */}
      <div 
        className="absolute top-16 flex items-center justify-center gap-3 shadow-md transition-all duration-500 animate-fade-in-down" 
        style={{ width: '224px', height: '56px', background: '#476A53', border: '1px solid #85DDA6', borderRadius: '28px' }}
      >
        <div style={{ width: '24px', height: '24px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <span 
          style={{ 
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '24px', 
            background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' 
          }}
        >
          Verifikasi
        </span>
      </div>

      {/* --- 2. KONTEN TENGAH (SPINNER & TEKS) --- */}
      <div className="flex flex-col items-center justify-center z-10 mt-10">
        
        {/* LINGKARAN LOADING / CENTANG BERHASIL */}
        <div className="relative flex items-center justify-center mb-8 w-[187px] h-[187px]">
          {status === "verifying" ? (
            <>
              {/* Lingkaran Gelap (Background) */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{ border: '12px solid #0C201B', boxSizing: 'border-box' }}
              />
              {/* Lingkaran Hijau Terang + Blur (Animasi Muter) */}
              <div 
                className="absolute inset-0 rounded-full animate-spin-slow"
                style={{ 
                  border: '12px solid transparent', 
                  borderTopColor: '#00FFB7', // Efek sepotong lingkaran
                  filter: 'blur(1.1px)',
                  boxSizing: 'border-box' 
                }}
              />
            </>
          ) : (
            // Muncul Centang kalau udah sukses
            <div 
              className="absolute inset-0 flex items-center justify-center rounded-full bg-[#00FFB7] animate-pop-in shadow-[0_0_40px_rgba(0,255,183,0.6)]"
              style={{ border: '8px solid #0C201B' }}
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0C201B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-check">
                <path d="M5 12l5 5L20 7"/>
              </svg>
            </div>
          )}
        </div>

        {/* TEKS UTAMA MEMVERIFIKASI... */}
        <h1 
          className="italic transition-all duration-500"
          style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '48px', lineHeight: '58px', letterSpacing: '-0.05em',
            background: status === "success" ? 'linear-gradient(90deg, #75FFC3 0%, #FFFFFF 100%)' : 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textAlign: 'center', marginBottom: '12px',
            transform: status === "success" ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {status === "verifying" ? "Memverifikasi Pembayaran..." : "Pembayaran Berhasil!"}
        </h1>

        {/* SUBTEKS MOHON TUNGGU... */}
        <p 
          className="transition-opacity duration-500"
          style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '19px', letterSpacing: '-0.05em',
            background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            opacity: status === "verifying" ? 1 : 0.7
          }}
        >
          {status === "verifying" ? "Mohon tunggu sebentar..." : "Menyiapkan sesi foto Anda..."}
        </p>

      </div>

      {/* --- CUSTOM CSS ANIMATIONS (Langsung tancep disini biar simple) --- */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1.5s linear infinite;
        }
        @keyframes pop-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
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
          animation: check 0.6s ease-in-out forwards;
          animation-delay: 0.2s;
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  );
}