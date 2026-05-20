"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function KuponPage() {
  const router = useRouter();
  const [voucherCode, setVoucherCode] = useState(""); 
  const [error, setError] = useState(false); 

  const validCodes = ["JONASPHOTO", "GLAMBOT2026", "DISKONHEMAT"];

  const handleRedeem = () => {
    const isCorrect = validCodes.includes(voucherCode.toUpperCase());

    if (isCorrect) {
      setError(false);
      router.push("/success"); 
    } else {
      setError(true);
      setVoucherCode(""); 
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[35%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* MODAL KUPON (Style disamakan penuh dengan QRIS) */}
      <div
        className={`relative z-10 flex flex-col items-center px-6 sm:px-10 shadow-[0px_4px_15px_rgba(0,0,0,0.15)] w-full max-w-[560px] py-10 bg-gradient-to-b from-[#1C614E] via-white to-white via-[1%] transition-all duration-500 ${error ? 'animate-shake' : 'animate-fade-in-up'}`}
        style={{ borderRadius: '18px' }}
      >
        
        {/* Ikon Box Atas (Sama dengan QRIS, manggil kupon.png) */}
        <div className="mb-3 flex items-center justify-center shrink-0 w-[82px] h-[83px] bg-white border border-[#FFA218] rounded-[9px] shadow-sm">
          <img src="/kupon.png" alt="Coupon Icon" className="w-[54px] h-[54px] object-contain" />
        </div>

        {/* Judul & Subtitle Notifikasi */}
        <h1 className="font-inter font-bold text-center leading-[58px] tracking-[-0.05em] text-[48px] text-[#424242] mb-1">
          Kode Voucher
        </h1>
        <p 
          className="font-inter font-normal text-center tracking-[-0.05em] text-[16px] mb-8 transition-colors duration-300"
          style={{ color: error ? '#FF4C4C' : '#424242', opacity: error ? 1 : 0.7 }}
        >
          {error ? 'Kode voucher salah atau sudah kadaluwarsa!' : 'Masukkan kode voucher kamu di bawah ini'}
        </p>

        {/* INPUT BOX (FIX: Background putih bersih, tidak gelap) */}
        <input
          type="text"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          placeholder="Masukkan Kode di sini!"
          className="px-6 text-center text-[#383838] placeholder-[#9B9B9B] outline-none border border-[#000000] bg-white w-full max-w-[460px] h-[58px] transition-all mb-12"
          style={{
            borderRadius: '15px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '18px', 
            letterSpacing: '-0.05em'
          }}
        />

        {/* TOMBOL AKSI DI DALAM CARD (Menerapkan Desain Gaya QRIS) */}
        <div className="flex flex-row gap-4 w-full justify-center mt-auto"> 
          
          {/* Tombol Batal */}
          <button 
            onClick={() => router.back()}
            className="flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white border border-[#000000] w-[220px] h-[53px] rounded-[23px] shadow-sm"
          >
            <span className="font-inter font-extrabold tracking-[-0.02em] text-[18px] text-[#383838]">
              Batal
            </span>
          </button>

          {/* Tombol Redeem (Gaya Sudah Bayar di QRIS) */}
          <button 
            onClick={handleRedeem}
            className="flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-[#3A9F86] w-[220px] h-[53px] rounded-[23px] shadow-md"
          >
            <span className="font-inter font-extrabold italic tracking-[-0.06em] text-[18px] text-white">
              Redeem
            </span>
          </button>
          
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}