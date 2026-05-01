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
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-x-hidden text-white"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[1622px]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'scaleX(-1)' }}></div>
      </div>

      {/* --- MODAL QRIS --- */}
      <div 
        className="relative z-10 flex flex-col items-center p-8 shadow-2xl mt-4"
        style={{
          width: '644px',
          height: '840px', // Naikin height biar tombol masuk ke dalem
          background: '#2E4F4D',
          border: '1.5px solid #54868A',
          borderRadius: '18px',
          paddingBottom: '40px' // Tambahin padding bawah
        }}
      >
        <div className="mb-6 w-[612px] h-[6px] bg-[#6AC5C3] rounded-[2px]" />
        
        <div className="mb-4 flex items-center justify-center" style={{ width: '65px', height: '66px', background: '#B3D2D1', borderRadius: '9px' }}>
          <img src="/qris.png" alt="QR Icon" className="w-[45px] h-[45px] object-contain" />
        </div>

        <h1 
          className="italic mb-1"
          style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '48px', lineHeight: '58px', letterSpacing: '-0.05em',
            background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}
        >
          Silahkan Scan QRIS
        </h1>
        <p className="mb-6 text-[16px] opacity-60 uppercase tracking-widest">PAKET {paketDipilih}</p>

        <div className="mb-6 flex items-center justify-center p-4 bg-white rounded-[9px]" style={{ width: '340px', height: '340px' }}>
          <img src="/qris1.png" alt="QR Code" style={{ width: '310px', height: '310px', objectFit: 'contain' }} />
        </div>

        <div className="mb-1 flex items-center justify-center min-h-[60px]">
          <h2 
            className="italic leading-[1.2]"
            style={{
              fontFamily: "'Inria Serif', serif", fontWeight: 700, fontSize: '40px', letterSpacing: '-0.06em',
              background: 'linear-gradient(90deg, #FFDE97 0%, #FFFFFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)'
            }}
          >
            {currentPrice}
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-8">
          <img src="/icon1.png" alt="Clock" className="w-[30px] h-[30px]" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '28px', color: '#FFAE00' }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* --- TOMBOL DI DALAM MODAL --- */}
        <div className="flex gap-6 mt-auto"> {/* mt-auto biar dia nempel ke bawah padding modal */}
          <button 
            onClick={() => router.push(`/pembayaran/${paketDipilih}`)}
            className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            style={{ 
              width: '180px', 
              height: '50px', 
              background: 'rgba(34, 76, 66, 0.5)', 
              border: '2px solid #318570', 
              borderRadius: '30px' 
            }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '24px', color: '#318C77' }}>
              Kembali
            </span>
          </button>

          <Link 
            href="/success"
            className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg"
            style={{ 
              width: '200px', 
              height: '50px', 
              background: '#399A83', 
              borderRadius: '30px', 
              textDecoration: 'none' 
            }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '24px', color: '#153C32' }}>
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
    <Suspense fallback={<div className="bg-[#243F42] min-h-screen"></div>}>
      <QrisContent />
    </Suspense>
  );
}