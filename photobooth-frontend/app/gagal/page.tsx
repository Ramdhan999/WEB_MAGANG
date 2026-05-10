"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function GagalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const reason = searchParams.get("reason") || "error";
  const paketDipilih = searchParams.get("paket") || "premium";

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 md:px-0"
      style={{ backgroundColor: '#E3D5D5' }} 
    >
      {/* PROGRESS BAR (Warna Merah Tanda Gagal) */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[45%]" style={{ backgroundImage: 'linear-gradient(270deg, #FF4C4C 0%, #8A2B2B 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* BADGE ATAS (Merah) */}
      <div 
        className="absolute top-12 md:top-16 flex items-center justify-center gap-3 shadow-md animate-fade-in-down z-10 rounded-full" 
        style={{ width: '224px', height: '56px', backgroundColor: '#6A4747', border: '1px solid #DD8585' }}
      >
        <div style={{ width: '24px', height: '24px', backgroundImage: 'linear-gradient(180deg, #FF7575 0%, #F67272 45.19%, #8A5454 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <span className="font-inter font-bold text-[20px] md:text-[24px]" style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #E2A9A9 0%, #E84D4D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Gagal
        </span>
      </div>

      {/* KONTEN TENGAH */}
      <div className="relative z-10 flex flex-col items-center px-4 w-full max-w-[90%] sm:max-w-[600px] animate-shake mt-16">
        
        {/* Ikon Silang (X) */}
        <div className="mb-6 flex items-center justify-center shrink-0 w-[100px] h-[100px] md:w-[120px] md:h-[120px] animate-pop-in" style={{ backgroundColor: 'rgba(255, 76, 76, 0.15)', borderRadius: '50%', border: '4px solid rgba(255, 76, 76, 0.3)' }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#FF4C4C" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-x">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>

        {/* Judul Gagal */}
        <h1 
          className="font-inter font-bold text-center leading-tight mb-3 tracking-[-0.05em] text-[36px] md:text-[48px]"
          style={{ color: '#FF4C4C' }}
        >
          Pembayaran Gagal!
        </h1>

        {/* Subtitle Dinamis */}
        <p 
          className="font-inter font-medium text-center tracking-[-0.02em] mb-12 text-[15px] md:text-[18px] px-4"
          style={{ color: '#565656' }}
        >
          {reason === "timeout" 
            ? "Yahh, waktu pembayaran kamu sudah habis. Silakan coba lakukan pembayaran ulang ya!" 
            : "Terjadi kendala saat memverifikasi QRIS kamu. Pastikan koneksi stabil dan coba lagi."}
        </p>

        {/* TOMBOL BAWAH */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full justify-center"> 
          
          {/* Tombol Batal / Pilih Paket Lain */}
          <button 
            onClick={() => router.push('/pilih-paket')}
            className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm w-full sm:w-[200px]"
            style={{ 
              height: '54px', 
              backgroundColor: '#224C42', 
              border: '3px solid #318570', 
              borderRadius: '30px' 
            }}
          >
            <span className="font-inter font-bold tracking-[-0.05em] text-[18px] md:text-[20px]" style={{ color: '#FFFFFF' }}>
              Ganti Paket
            </span>
          </button>

          {/* Tombol Coba Lagi (Balik ke QRIS) */}
          <Link 
            href={`/qris?paket=${paketDipilih}`}
            className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md w-full sm:w-[200px]"
            style={{ 
              height: '54px', 
              backgroundColor: '#399A83', 
              borderRadius: '30px' 
            }}
          >
            <span className="font-inter font-bold tracking-[-0.05em] text-[18px] md:text-[20px]" style={{ color: '#224C42' }}>
              Coba Lagi
            </span>
          </Link>
          
        </div>
      </div>

      {/* KEYFRAMES CSS */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out forwards;
        }
        @keyframes pop-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes draw-x {
          0% { stroke-dasharray: 100; stroke-dashoffset: 100; }
          100% { stroke-dasharray: 100; stroke-dashoffset: 0; }
        }
        .animate-draw-x {
          animation: draw-x 0.6s ease-out forwards;
          animation-delay: 0.3s;
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

export default function GagalPage() {
  return (
    <Suspense fallback={<div className="bg-[#E3D5D5] min-h-screen"></div>}>
      <GagalContent />
    </Suspense>
  );
}