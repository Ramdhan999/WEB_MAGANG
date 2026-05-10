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
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{ backgroundColor: '#E3D5D5' }} 
    >
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[35%]" style={{ backgroundImage: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* MODAL BOX */}
      <div
        className={`relative flex flex-col items-center justify-start shadow-xl transition-all duration-500 w-full max-w-[560px] ${error ? 'animate-shake' : 'animate-fade-in-up'}`}
        style={{
          minHeight: '520px',
          backgroundColor: '#F7F7F7', 
          border: error ? '1.5px solid #FF4C4C' : '1.5px solid #54868A',
          borderRadius: '18px',
          paddingTop: '20px',
          paddingBottom: '30px'
        }}
      >
        {/* Garis Atas */}
        <div
          className="w-full max-w-[90%] h-[6px] mb-6"
          style={{
            backgroundColor: error ? '#FF4C4C' : '#6AC5C3',
            borderRadius: '2px', 
          }}
        />

        {/* Ikon Kupon */}
        <div
          className="flex items-center justify-center shadow-inner shrink-0 w-[100px] h-[100px] md:w-[120px] md:h-[116px]"
          style={{
            backgroundColor: error ? 'rgba(255, 76, 76, 0.1)' : '#B3D2D1',
            borderRadius: '9px',
          }}
        >
          <img
            src="/voucher.png" 
            alt="Ikon Kupon"
            className="w-[70px] h-[70px] md:w-[85px] md:h-[85px] object-contain mix-blend-multiply"
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl">🎟️</span>'; }}
          />
        </div>

        {/* HEADER & NOTIFIKASI */}
        <div className="mt-4 flex flex-col items-center text-center px-6 w-full">
          <h1
            className="font-inter font-bold text-center leading-tight mb-1 text-[32px] md:text-[42px]"
            style={{ letterSpacing: '-0.05em', color: '#424242' }}
          >
            Kode Voucher
          </h1>
          
          {/* Pesan Notifikasi */}
          <p
            className="font-inter font-medium tracking-[-0.02em] text-[15px] md:text-[16px] transition-colors duration-300"
            style={{
              color: error ? '#FF4C4C' : '#424242',
              opacity: error ? 1 : 0.7,
            }}
          >
            {error ? 'Kode voucher salah atau sudah kadaluwarsa!' : 'Masukkan kode voucher kamu di bawah ini'}
          </p>
        </div>

        {/* INPUT BOX */}
        <input
          type="text"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          placeholder="Masukkan Kode di sini!"
          className="mt-6 px-6 text-center text-white placeholder-[#435450] outline-none transition-all w-[85%] md:w-[460px] h-[65px] md:h-[75px]"
          style={{
            backgroundColor: '#213433', 
            border: error ? '1.5px solid #FF4C4C' : '1.5px solid #41D2BA',
            borderRadius: '15px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '18px', 
            letterSpacing: '-0.05em'
          }}
        />

        <div className="flex-grow"></div>

        {/* TOMBOL AKSI */}
        <div className="mt-8 flex flex-col sm:flex-row w-full justify-center gap-3 md:gap-[20px] px-8">
          
          {/* TOMBOL BATAL */}
          <button 
            onClick={() => router.back()} 
            className="group cursor-pointer border-none bg-transparent p-0 outline-none w-full sm:w-auto"
          >
            <div
              className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm w-full sm:w-[160px] md:w-[200px]"
              style={{
                height: '50px',
                backgroundColor: '#224C42',
                border: '3px solid #318570',
                borderRadius: '30px',
              }}
            >
              <span className="font-inter font-bold tracking-[-0.05em] text-[18px] md:text-[22px]" style={{ color: '#FFFFFF' }}>
                Batal
              </span>
            </div>
          </button>

          {/* TOMBOL REDEEM */}
          <button 
            onClick={handleRedeem}
            className="group cursor-pointer border-none bg-transparent p-0 outline-none w-full sm:w-auto"
          >
            <div
              className={`flex items-center justify-center shadow-md transition-all duration-300 group-active:scale-95 w-full sm:w-[160px] md:w-[200px] ${error ? 'bg-[#703A3A] opacity-50' : 'bg-[#399A83] group-hover:bg-[#45B298] group-hover:scale-105'}`}
              style={{
                height: '50px',
                backgroundColor: '#399A83',
                borderRadius: '30px',
              }}
            >
              <span className="font-inter font-bold tracking-[-0.05em] text-[18px] md:text-[23px]" style={{ color: '#224C42' }}>
                Redeem
              </span>
            </div>
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