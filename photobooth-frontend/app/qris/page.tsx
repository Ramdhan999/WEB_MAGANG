"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function QrisPage() {
  const params = useParams();
  const paketDipilih = params.paket as string;
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
      {/* --- 0. BACKGROUND FOTO KELUARGA (Sesuai Halaman Sebelumnya) --- */}
      <div className="absolute inset-0 z-0 h-[639px] w-full opacity-[0.36] overflow-hidden">
        <img 
          src="/bg-keluarga.png" 
          alt="Family Background" 
          className="h-full w-full object-cover" 
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(217,217,217,0.6)_44.52%,rgba(115,115,115,0)_100%)]"></div>
      </div>

      {/* --- PROGRESS BAR (Step 5 dari 12 = 42%) --- */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20">
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)' }}></div>
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
          style={{ width: '42%', background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}
        ></div>
      </div>

      {/* --- MODAL QRIS (Rectangle 102) --- */}
      <div 
        className="relative z-10 flex flex-col items-center p-8 shadow-2xl mt-10"
        style={{
          width: '644px',
          height: '804px',
          background: '#2E4F4D',
          border: '1.5px solid #54868A',
          borderRadius: '18px',
          boxSizing: 'border-box'
        }}
      >
        {/* Garis Atas Tipis (Rectangle 103) */}
        <div className="mb-6 w-[612px] h-[6px] bg-[#6AC5C3] rounded-[2px]" />
        
        {/* Icon QR Atas (Sesuai Permintaan: qris.png) */}
        <div className="mb-4 flex items-center justify-center" style={{ width: '65px', height: '66px', background: '#B3D2D1', borderRadius: '9px' }}>
          <img src="/qris.png" alt="QR Icon" className="w-[45px] h-[45px] object-contain" />
        </div>

        {/* Text Header */}
        <h1 
          className="italic mb-1"
          style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '48px', lineHeight: '58px', letterSpacing: '-0.05em',
            background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}
        >
          Silahkan Scan QRIS
        </h1>
        <p className="mb-8 text-[16px] opacity-60">Scan dengan Aplikasi E-Wallet kamu!</p>

        {/* QR CODE BOX (Rectangle 105) - Background Putih Tengahnya */}
        <div 
          className="mb-6 flex items-center justify-center p-4 bg-white rounded-[9px]" 
          style={{ width: '358px', height: '358px' }}
        >
          <img src="/qris1.png" alt="QR Code" style={{ width: '334px', height: '334px', objectFit: 'contain' }} />
        </div>

        {/* Nominal Harga (Fix Gak Kepotong) */}
        <div className="mb-1 flex items-center justify-center min-h-[70px]">
          <h2 
            className="italic leading-[1.2]"
            style={{
              fontFamily: "'Inria Serif', serif", fontWeight: 700, fontSize: '48px', letterSpacing: '-0.06em',
              background: 'linear-gradient(90deg, #FFDE97 0%, #FFFFFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)'
            }}
          >
            {currentPrice}
          </h2>
        </div>
        <p className="mb-4 text-sm opacity-60">Glambot Studio - Jonas Photo</p>

        {/* TIMER (Warna FFAE00) */}
        <div className="flex items-center gap-2 mb-10">
          <img src="/icon1.png" alt="Clock" className="w-[36px] h-[36px]" />
          <span 
            style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '32px', color: '#FFAE00',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)'
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* --- TOMBOL (Dikasih Jarak/Gap) --- */}
        <div className="flex gap-10"> {/* FIX: Jarak diperlebar pake gap-10 */}
          {/* Tombol Kembali */}
          <Link 
            href={`/pembayaran/${paketDipilih}`}
            className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            style={{ 
              width: '220px', 
              height: '54px', 
              background: 'rgba(34, 76, 66, 0.5)', 
              border: '2px solid #318570', 
              borderRadius: '30px',
              textDecoration: 'none'
            }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '32px', color: '#318C77' }}>
              Kembali
            </span>
          </Link>

          {/* Tombol Sudah Bayar */}
          <Link 
            href="/success"
            className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg"
            style={{ 
              width: '220px', 
              height: '54px', 
              background: '#399A83', 
              borderRadius: '30px',
              textDecoration: 'none'
            }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '32px', color: '#153C32' }}>
              Sudah Bayar
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}