"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function QrisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const paketDipilih = searchParams.get("paket") || "premium";
  const [timeLeft, setTimeLeft] = useState(300);

  const priceData: Record<string, string> = {
    solo: "Rp. 35,000",
    duo: "Rp. 45,000",
    group: "Rp. 55,000",
    premium: "Rp. 75,000",
  };

  const currentPrice = priceData[paketDipilih] || "Rp. 75,000";

  // --- INI BAGIAN YANG DIUBAH (Logika 0 Detik) ---
  useEffect(() => {
    if (timeLeft <= 0) {
      router.push(`/gagal?reason=timeout&paket=${paketDipilih}`);
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router, paketDipilih]);
  // ----------------------------------------------

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden pt-12 pb-12 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{ backgroundColor: '#E3D5D5' }} 
    >
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[35%]" style={{ backgroundImage: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* MODAL QRIS */}
      <div 
        className="relative z-10 flex flex-col items-center px-4 md:px-8 shadow-xl mt-6 transition-all w-full max-w-[90%] sm:max-w-[600px]"
        style={{
          minHeight: '740px',
          backgroundColor: '#F7F7F7', 
          border: '1.5px solid #54868A',
          borderRadius: '18px',
          paddingTop: '24px',
          paddingBottom: '32px'
        }}
      >
        {/* Garis atas hijau */}
        <div className="w-full max-w-[560px] h-[6px] bg-[#6AC5C3] rounded-[2px] mb-6" />
        
        {/* Ikon QR Kamera */}
        <div className="mb-4 flex items-center justify-center shrink-0 w-[50px] h-[50px] md:w-[60px] md:h-[60px]" style={{ backgroundColor: '#B3D2D1', borderRadius: '9px' }}>
          <img src="/qris.png" alt="QR Icon" className="w-[30px] h-[30px] md:w-[40px] md:h-[40px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">📷</span>'; }} />
        </div>

        {/* Judul Modal */}
        <h1 
          className="font-inter font-bold text-center leading-tight mb-1 tracking-[-0.05em] text-[32px] md:text-[42px]"
          style={{ color: '#424242' }}
        >
          Silahkan Scan QRIS
        </h1>

        {/* Subtitle 1 */}
        <p 
          className="font-inter font-normal text-center tracking-[-0.05em] mb-4 text-[15px] md:text-[16px]"
          style={{ color: '#424242' }}
        >
          Scan dengan Aplikasi E-Wallet kamu!
        </p>

        {/* KOTAK QR CODE UTAMA */}
        <div 
          className="flex items-center justify-center mb-5 shadow-sm shrink-0 w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]" 
          style={{ backgroundColor: '#B3D2D1', borderRadius: '9px' }}
        >
          <img 
            src="/qris1.png" 
            alt="QR Code" 
            className="w-[90%] h-[90%] object-contain mix-blend-multiply" 
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-gray-600">Gambar QRIS</span>'; }}
          />
        </div>

        {/* Harga */}
        <div className="mb-1 flex items-center justify-center min-h-[40px] md:min-h-[50px]">
          <h2 
            className="font-inria font-bold italic text-center tracking-[-0.06em] text-[32px] md:text-[42px] bg-clip-text text-transparent leading-[1.2]"
            style={{
              backgroundImage: 'linear-gradient(90deg, #D79300 0%, #FFFFFF 200%)',
              filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))'
            }}
          >
            {currentPrice}
          </h2>
        </div>

        {/* Tulisan Glambot Studio */}
        <p 
          className="font-inter font-medium text-center tracking-[-0.05em] mb-5 text-[14px] md:text-[16px] bg-clip-text text-transparent"
          style={{ 
            backgroundImage: 'linear-gradient(90deg, #FFFFFF 0%, #979797 30%)',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' 
          }}
        >
          Glambot Studio - Jonas Photo
        </p>

        {/* Timer Countdown */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/icon1.png" alt="Clock" className="w-[24px] h-[24px] md:w-[32px] md:h-[32px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span>⏱️</span>'; }} />
          <span 
            className="font-inter font-medium tracking-[-0.06em] text-[24px] md:text-[28px]"
            style={{ color: '#FFAE00', textShadow: '1px 1px 3px rgba(0, 0, 0, 0.15)' }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex-grow"></div>

        {/* TOMBOL BAWAH */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 mt-auto w-full justify-center px-4"> 
          
          {/* Tombol Kembali */}
          <button 
            onClick={() => router.push(`/pembayaran/${paketDipilih}`)}
            className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm w-full sm:w-[160px] md:w-[200px]"
            style={{ 
              height: '50px', 
              backgroundColor: '#224C42', 
              border: '3px solid #318570', 
              borderRadius: '30px' 
            }}
          >
            <span className="font-inter font-bold tracking-[-0.05em] text-[18px] md:text-[22px]" style={{ color: '#FFFFFF' }}>
              Kembali
            </span>
          </button>

          {/* Tombol Sudah Bayar */}
          <Link 
            href="/success"
            className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md w-full sm:w-[160px] md:w-[200px]"
            style={{ 
              height: '50px', 
              backgroundColor: '#399A83', 
              borderRadius: '30px' 
            }}
          >
            <span className="font-inter font-bold tracking-[-0.05em] text-[18px] md:text-[22px]" style={{ color: '#224C42' }}>
              Sudah Bayar
            </span>
          </Link>
          
        </div>
      </div>

      {/* Global Fonts Override */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inria+Serif:ital,wght@1,700&display=swap');
        .font-inria { font-family: 'Inria Serif', serif; }
      `}</style>
    </main>
  );
}

export default function QrisPage() {
  return (
    <Suspense fallback={<div className="bg-[#E3D5D5] min-h-screen"></div>}>
      <QrisContent />
    </Suspense>
  );
}