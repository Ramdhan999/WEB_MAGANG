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
      // Reset tulisan kodenya jadi kosong otomatis pas salah
      setVoucherCode(""); 
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      <div
        className={`relative flex flex-col items-center justify-start shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 ${error ? 'animate-shake' : 'animate-fade-in-up'}`}
        style={{
          width: '644px',
          height: '596px',
          background: '#2E4F4D',
          border: error ? '1.5px solid #FF4C4C' : '1.5px solid #54868A',
          borderRadius: '18px',
          boxSizing: 'border-box'
        }}
      >
        <div
          className="absolute top-0"
          style={{
            width: '612px',
            height: '6px',
            background: error ? '#FF4C4C' : '#6AC5C3',
            borderRadius: '0 0 6px 6px', 
          }}
        />

        {/* Ikon Kupon */}
        <div
          className="mt-[45px] flex items-center justify-center shadow-inner"
          style={{
            width: '146px',
            height: '142px',
            background: error ? 'rgba(255, 76, 76, 0.2)' : '#B3D2D1',
            borderRadius: '9px',
          }}
        >
          <img
            src="/kupon.png"
            alt="Ikon Kupon"
            style={{ width: '120px', height: '120px', objectFit: 'contain' }}
          />
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          {/* Header Title - Fix Kotak Persegi */}
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '48px',
              lineHeight: '58px',
              letterSpacing: '-0.05em',
              color: error ? '#FF9E9E' : '#FFFFFF', // Pakai solid color pas error biar nggak ada kotak glitch
              background: error ? 'none' : 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)',
              WebkitBackgroundClip: error ? 'none' : 'text',
              WebkitTextFillColor: error ? '#FF9E9E' : 'transparent',
              margin: 0
            }}
          >
            {error ? 'Kode Salah!' : 'Kode Voucher'}
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '19px',
              letterSpacing: '-0.05em',
              color: error ? '#FF4C4C' : '#FFFFFF',
              opacity: error ? 1 : 0.6,
              marginTop: '4px'
            }}
          >
            {error ? 'Kode voucher tidak ditemukan atau sudah kadaluwarsa.' : 'Masukkan kode voucher kamu!'}
          </p>
        </div>

        <input
          type="text"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          placeholder="Masukkan Kode di sini!"
          className="mt-8 px-6 text-center text-white placeholder-[#435450] outline-none transition-all"
          style={{
            width: '577px',
            height: '89px',
            background: '#213433',
            border: error ? '1.5px solid #FF4C4C' : '1.5px solid #41D2BA',
            borderRadius: '18px',
            boxSizing: 'border-box',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '24px',
            letterSpacing: '-0.05em',
          }}
        />

        <div className="mt-[45px] flex w-full justify-center gap-[24px]">
          <button 
            onClick={() => router.back()} 
            className="group cursor-pointer border-none bg-transparent p-0 outline-none"
          >
            <div
              className="flex items-center justify-center transition-all duration-300 group-hover:bg-[#2A5C50] group-hover:scale-105"
              style={{
                width: '220px',
                height: '62px',
                background: '#224C42',
                border: '3px solid #318570',
                borderRadius: '30px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '32px',
                color: '#318C77',
              }}
            >
              Batal
            </div>
          </button>

          <button 
            onClick={handleRedeem}
            className="group cursor-pointer border-none bg-transparent p-0 outline-none"
          >
            <div
              className={`flex items-center justify-center shadow-lg transition-all duration-300 group-active:scale-95 ${error ? 'bg-[#703A3A] opacity-50' : 'bg-[#399A83] group-hover:bg-[#45B298] group-hover:scale-105'}`}
              style={{
                width: '220px',
                height: '62px',
                borderRadius: '30px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '32px',
                color: '#224C42',
              }}
            >
              Redeem
            </div>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </main>
  );
}