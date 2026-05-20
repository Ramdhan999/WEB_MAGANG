"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

  useEffect(() => {
    if (timeLeft <= 0) {
      router.push(`/gagal?reason=timeout&paket=${paketDipilih}`);
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router, paketDipilih]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[35%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* MODAL QRIS */}
      <div 
        className="relative z-10 flex flex-col items-center px-6 sm:px-10 shadow-[0px_4px_15px_rgba(0,0,0,0.15)] w-full max-w-[560px] py-10 bg-gradient-to-b from-[#1C614E] via-white to-white via-[1%]"
        style={{ borderRadius: '18px' }}
      >
        
        {/* Ikon Box Atas */}
        <div className="mb-3 flex items-center justify-center shrink-0 w-[82px] h-[83px] bg-white border border-[#FFA218] rounded-[9px] shadow-sm">
          <img src="/scan.png" alt="Scan Icon" className="w-[54px] h-[54px] object-contain" />
        </div>

        {/* Judul & Subtitle */}
        <h1 className="font-inter font-bold text-center leading-[48px] tracking-[-0.05em] text-[38px] text-[#424242] mb-1">
          Silahkan Scan QRIS
        </h1>
        <p className="font-inter font-normal text-center tracking-[-0.05em] text-[15px] text-[#424242] mb-5">
          Scan dengan Aplikasi E-Wallet kamu!
        </p>

        {/* KOTAK QR CODE UTAMA */}
        <div className="flex items-center justify-center mb-4 shrink-0 w-[310px] h-[310px] bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.2)] rounded-[9px]">
          <img src="/qris1.png" alt="QR Code" className="w-[290px] h-[290px] object-contain" />
        </div>

        {/* Area Informasi Harga */}
        <h2 
          className="font-inter font-bold text-center tracking-[-0.06em] text-[42px] text-[#17684E] leading-tight mb-0.5"
          style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)' }}
        >
          {currentPrice}
        </h2>
        <p className="font-inter font-normal text-center tracking-[-0.05em] text-[14px] text-[#7A7979] mb-4">
          Glambot Studio - Jonas Photo
        </p>

        {/* Timer Countdown (FIX: Ditambahkan icon1.png di samping teks berlaku) */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/icon1.png" alt="Clock Icon" className="w-[24px] h-[24px] object-contain mr-1" />
          <span className="font-inter font-normal tracking-[-0.05em] text-[22px] text-[#7A7979]">
            Berlaku
          </span>
          <span 
            className="font-inter font-bold tracking-[-0.06em] text-[32px] text-[#FFAE00]"
            style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)' }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* TOMBOL AKSI DI DALAM CARD */}
        <div className="flex flex-row gap-4 w-full justify-center mt-2"> 
          
          {/* Tombol Batal */}
          <button 
            onClick={() => router.push(`/pembayaran/${paketDipilih}`)}
            className="flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white border border-[#000000] w-[220px] h-[53px] rounded-[23px] shadow-sm"
          >
            <span className="font-inter font-extrabold tracking-[-0.02em] text-[18px] text-[#383838]">
              Batal
            </span>
          </button>

          {/* Tombol Sudah Bayar */}
          <Link 
            href="/success"
            className="flex items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 bg-[#3A9F86] w-[220px] h-[53px] rounded-[23px] shadow-md"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <span className="font-inter font-extrabold italic tracking-[-0.06em] text-[18px] text-white">
              Sudah Bayar
            </span>
          </Link>
          
        </div>
      </div>

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