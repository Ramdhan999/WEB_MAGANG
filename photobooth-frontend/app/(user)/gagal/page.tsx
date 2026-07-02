"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePageSound } from "@/hooks/usePageSound";

function GagalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const reason = searchParams.get("reason") || "error";
  const paketDipilih = searchParams.get("paket") || "premium";

   usePageSound("/fase/bayar_gagal.mpeg");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR (Warna Merah Tanda Gagal) */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[45%]" style={{ background: 'linear-gradient(270deg, #FF4C4C 0%, #8A2B2B 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* MODAL GAGAL (Style & Dimensi seragam penuh dengan QRIS dan Kupon) */}
      <div 
        className="relative z-10 flex flex-col items-center px-6 sm:px-10 shadow-[0px_4px_15px_rgba(0,0,0,0.15)] w-full max-w-[560px] py-10 bg-gradient-to-b from-[#6A4747] via-white to-white via-[1%]"
        style={{ borderRadius: '18px' }}
      >
        
        {/* Ikon Box Atas */}
        <div className="mb-4 flex items-center justify-center shrink-0 w-[82px] h-[83px] bg-white border border-[#DD8585] rounded-[9px] shadow-sm">
          <div className="flex items-center justify-center w-[54px] h-[54px] bg-red-100 rounded-full">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF4C4C" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>

        {/* Judul & Subtitle */}
        <h1 className="font-inter font-bold text-center leading-[58px] tracking-[-0.05em] text-[44px] text-[#FF4C4C] mb-2">
          Pembayaran Gagal!
        </h1>
        
        <p className="font-inter font-normal text-center tracking-[-0.05em] text-[16px] text-[#565656] max-w-[420px] mb-12 min-h-[48px]">
          {reason === "timeout" 
            ? "Yahh, waktu pembayaran kamu sudah habis. Silakan coba lakukan pembayaran ulang ya!" 
            : "Terjadi kendala saat memverifikasi QRIS kamu. Pastikan koneksi stabil dan coba lagi."}
        </p>

        {/* TOMBOL AKSI DI DALAM CARD (Menerapkan Desain Gaya QRIS & Kupon) */}
        <div className="flex flex-row gap-4 w-full justify-center mt-auto"> 
          
          {/* Tombol Ganti Paket */}
          <button 
            onClick={() => router.push('/pilih-paket')}
            className="flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white border border-[#000000] w-[220px] h-[53px] rounded-[23px] shadow-sm"
          >
            <span className="font-inter font-extrabold tracking-[-0.02em] text-[18px] text-[#383838]">
              Ganti Paket
            </span>
          </button>

          {/* Tombol Coba Lagi */}
          <Link 
            href={`/qris?paket=${paketDipilih}`}
            className="flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-[#3A9F86] w-[220px] h-[53px] rounded-[23px] shadow-md"
          >
            <span className="font-inter font-extrabold italic tracking-[-0.06em] text-[18px] text-white">
              Coba Lagi
            </span>
          </Link>
          
        </div>
      </div>

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