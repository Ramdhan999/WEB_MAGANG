"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function PembayaranPage() {
  const params = useParams();
  const paketDipilih = (params?.paket as string) || "premium";

  const packageData: Record<string, any> = {
    solo: { title: "Glambot Solo", price: "Rp. 35,000", img: "/paket1.png" },
    duo: { title: "Glambot Duo", price: "Rp. 45,000", img: "/paket2.png" },
    group: { title: "Glambot Group", price: "Rp. 55,000", img: "/paket3.png" },
    premium: { title: "Glambot Premium", price: "Rp. 75,000", img: "/paket4.png" },
  };

  const currentPackage = packageData[paketDipilih] || packageData.premium;

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden pt-10 pb-12 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{ backgroundColor: '#E3D5D5' }}
    >
      {/* 0. PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[25%]" style={{ backgroundImage: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* 1. HEADER AREA */}
      <div className="flex flex-col items-center mb-6 z-10 w-full px-4 text-center mt-4">
        
        {/* BADGE "Pembayaran" */}
        <div 
          className="mb-4 flex items-center justify-center gap-3 px-6 md:px-8 py-2 md:py-3 shadow-md rounded-full shrink-0"
          style={{ backgroundColor: '#476A53', border: '1px solid #85DDA6' }}
        >
          <div className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]" style={{ backgroundImage: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          <span 
            className="font-inter font-bold text-[18px] md:text-[24px] bg-clip-text text-transparent" 
            style={{ backgroundImage: 'linear-gradient(90deg, #A9E2B5 0%, #4DE8D4 100%)' }}
          >
            Pembayaran
          </span>
        </div>

        {/* JUDUL UTAMA */}
        <h1 
          className="font-inter font-medium italic tracking-[-0.06em] text-[48px] md:text-[75px] bg-clip-text text-transparent leading-tight mb-2"
          style={{ 
            backgroundImage: 'linear-gradient(90deg, #5D5D5D 0%, #FFFFFF 200%)',
            filter: 'drop-shadow(3px 5px 4px rgba(0, 0, 0, 0.25))' 
          }}
        >
          Pembayaran
        </h1>

        {/* Garis Pembatas dengan Bintang Tengah */}
        <div className="flex items-center justify-center gap-4 w-full max-w-[644px] mb-8 mt-2">
          <div style={{ height: '3px', flexGrow: 1, backgroundColor: '#6AC5C3', borderRadius: '10px' }}></div>
          <div style={{ width: '15px', height: '15px', backgroundImage: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
          <div style={{ height: '3px', flexGrow: 1, backgroundColor: '#6AC5C3', borderRadius: '10px' }}></div>
        </div>
      </div>

      {/* 2. KOTAK PAKET TERPILIH */}
      <div 
        className="flex items-center gap-4 md:gap-6 px-4 md:px-6 mb-10 shadow-sm transition-transform duration-500 hover:scale-105 z-10 w-full max-w-[90%] sm:max-w-[644px]"
        style={{ minHeight: '110px', backgroundColor: '#DFDFDF', border: '1.5px solid #54868A', borderRadius: '18px' }}
      >
        <div className="flex items-center justify-center shadow-inner shrink-0 w-[60px] h-[60px] md:w-[78px] md:h-[76px]" style={{ backgroundColor: '#B3D2D1', borderRadius: '9px' }}>
          <img src={currentPackage.img} alt="Package" className="w-[45px] h-[45px] md:w-[56px] md:h-[56px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">📦</span>'; }}/>
        </div>
        <div className="flex flex-col justify-center py-2">
          <h2 className="text-[22px] md:text-[30px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '-0.05em', backgroundImage: 'linear-gradient(90deg, #F8E19B 0%, #DFB948 15%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: '1.2' }}>
            {currentPackage.title}
          </h2>
          <h3 className="mt-1 text-[26px] md:text-[32px]" style={{ fontFamily: "'Inria Serif', serif", fontStyle: 'italic', fontWeight: 700, letterSpacing: '-0.06em', color: '#D79300', textShadow: '2px 2px 4px rgba(0,0,0,0.25)', lineHeight: '1.1' }}>
            {currentPackage.price}
          </h3>
        </div>
      </div>

      <h3 
        className="font-inter font-bold italic text-[20px] md:text-[24px] mb-4 tracking-[-0.05em] z-10 w-full max-w-[90%] sm:max-w-[644px] text-center md:text-center"
        style={{ color: '#6B6B6B' }}
      >
        Pilih Metode Pembayaran:
      </h3>

      {/* 3. METODE PEMBAYARAN: QRIS */}
      <Link 
        href={`/qris?paket=${paketDipilih}`} 
        className="group flex items-center justify-between px-4 md:px-6 mb-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md z-10 w-full max-w-[90%] sm:max-w-[644px]" 
        style={{ minHeight: '108px', backgroundColor: '#DFDFDF', border: '1.5px solid #54868A', borderRadius: '18px' }}
      >
        <div className="flex items-center gap-4 md:gap-6 py-3">
          <div className="flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 w-[60px] h-[60px] md:w-[78px] md:h-[76px]" style={{ backgroundColor: '#B3D2D1', borderRadius: '9px' }}>
            <img src="/qris.png" alt="QRIS" className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">📱</span>'; }} />
          </div>
          <div className="flex flex-col">
            <h2 className="transition-colors group-hover:text-[#476A53] text-[20px] md:text-[25px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '-0.05em', color: '#343434', lineHeight: '1.1' }}>
              Scan QR Code
            </h2>
            <p className="mt-1 text-[15px] md:text-[16px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, letterSpacing: '-0.05em', color: '#343434' }}>
              GoPay - OVO - Dana - DLL
            </p>
          </div>
        </div>
        {/* Ikon Panah Kanan */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300 group-hover:translate-x-2 group-hover:stroke-[#476A53] shrink-0 md:w-[32px] md:h-[32px]">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Link>

      {/* 4. METODE PEMBAYARAN: VOUCHER */}
      <Link 
        href={`/kupon?paket=${paketDipilih}`} 
        className="group flex items-center justify-between px-4 md:px-6 mb-12 transition-all duration-300 hover:-translate-y-1 hover:shadow-md z-10 w-full max-w-[90%] sm:max-w-[644px]" 
        style={{ minHeight: '108px', backgroundColor: '#DFDFDF', border: '1.5px solid #54868A', borderRadius: '18px' }}
      >
        <div className="flex items-center gap-4 md:gap-6 py-3">
          <div className="flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 w-[60px] h-[60px] md:w-[78px] md:h-[76px]" style={{ backgroundColor: '#B3D2D1', borderRadius: '9px' }}>
            <img src="/voucher.png" alt="Voucher" className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">🎟️</span>'; }}/>
          </div>
          <div className="flex flex-col">
            <h2 className="transition-colors group-hover:text-[#476A53] text-[20px] md:text-[25px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '-0.05em', color: '#343434', lineHeight: '1.1' }}>
              Kode Voucher
            </h2>
            <p className="mt-1 text-[15px] md:text-[16px]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, letterSpacing: '-0.05em', color: '#343434' }}>
              Masukkan kode voucher.
            </p>
          </div>
        </div>
        {/* Ikon Panah Kanan */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300 group-hover:translate-x-2 group-hover:stroke-[#476A53] shrink-0 md:w-[32px] md:h-[32px]">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Link>

      {/* 5. TOMBOL GANTI PAKET */}
      <Link 
        href="/pilih-paket" 
        className="flex items-center justify-center gap-2 md:gap-3 px-4 h-[48px] border-[3px] border-[#318570] rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95 group z-10 w-[180px] md:w-[210px]"
        style={{ backgroundColor: '#3BBF9F'}}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#132E27" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1 shrink-0">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span 
          className="italic font-inter font-medium text-[20px] text-[#1D4F42] tracking-[-0.06em]"
          style={{ color: '#132E27' }}
        >
          GANTI PAKET
        </span>
      </Link>

      {/* Global Fonts Override */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@600&family=Inria+Serif:ital,wght@1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inria { font-family: 'Inria Serif', serif; }
      `}</style>

    </main>
  );
}