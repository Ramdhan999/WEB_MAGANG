"use client";

import { useState } from "react";
import Link from "next/link";

export default function PilihPaketPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const packages = [
    {
      id: "solo", title: "SOLO", img: "/paket1.png", tagBg: "#C59D48", isPopular: false, price: "Rp. 35,000",
      details: ["Sesi 5 menit", "Foto bebas", "1 Cetak (4R)", "Semua File Digital", "Maks. 1 Orang"]
    },
    {
      id: "duo", title: "DUO", img: "/paket2.png", tagBg: "#C59D48", isPopular: false, price: "Rp. 45,000",
      details: ["Sesi 5 menit", "Foto bebas", "2 Cetak (4R)", "Semua File Digital", "Maks. 2 Orang"]
    },
    {
      id: "group", title: "GROUP", img: "/paket3.png", tagBg: "#C59D48", isPopular: true, price: "Rp. 55,000",
      details: ["Sesi 7 menit", "Foto bebas", "2 Cetak (4R)", "Semua File Digital", "Maks. 5 Orang"]
    },
    {
      id: "premium", title: "PREMIUM", img: "/paket4.png", tagBg: "linear-gradient(90deg, #B4934E 0%, #FFDF9B 100%)", isPopular: false, price: "Rp. 75,000",
      details: ["Sesi 10 menit", "Foto bebas", "4 Cetak (4R)", "Semua File Digital", "Maks. 5 Orang"]
    }
  ];

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden pt-10 pb-12 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{ backgroundColor: '#E3D5D5' }}
    >
      {/* 0. PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[15%]" style={{ backgroundImage: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* 1. HEADER AREA */}
      <div className="flex flex-col items-center mb-6 z-10 w-full px-4 text-center mt-4">
        
        {/* BADGE ATAS */}
        <div 
          className="mb-4 flex items-center justify-center gap-3 px-6 md:px-8 py-2 md:py-3 shadow-md rounded-full"
          style={{ backgroundColor: '#476A53', border: '1px solid #85DDA6' }}
        >
          <div className="w-[20px] h-[20px] md:w-[31px] md:h-[31px]" style={{ backgroundImage: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          <span 
            className="font-inter font-bold text-[18px] md:text-[24px] bg-clip-text text-transparent" 
            style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)' }}
          >
            Pilih Paket
          </span>
        </div>

        {/* SUBTITLE */}
        <h3 
          className="font-hind font-semibold text-[18px] md:text-[24px] tracking-tight mb-1 md:mb-[-10px] bg-clip-text text-transparent"
          style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)' }}
        >
          Pilih yang sesuai untuk anda
        </h3>

        {/* JUDUL UTAMA */}
        <h1 
          className="font-inter font-medium italic tracking-[-0.06em] text-[48px] md:text-[75px] bg-clip-text text-transparent leading-tight"
          style={{ 
            backgroundImage: 'linear-gradient(90deg, #5D5D5D 0%, #FFFFFF 200%)',
            filter: 'drop-shadow(3px 5px 4px rgba(0, 0, 0, 0.25))' 
          }}
        >
          Pilih Paket
        </h1>
      </div>

      {/* 2. CARDS GRID */}
      <div className="w-full max-w-[1050px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 md:px-4 mb-10 z-10">
        {packages.map((pkg) => {
          const isActive = selectedId === pkg.id;
          
          return (
            <div 
              key={pkg.id} 
              className="relative mt-[20px] group cursor-pointer flex justify-center"
              onClick={() => setSelectedId(pkg.id)}
            > 
              {/* KOTAK KARTU UTAMA */}
              <div 
                className={`flex flex-col items-center pt-8 pb-6 relative z-10 w-full max-w-[250px] transition-all duration-300 ease-out ${isActive ? 'shadow-xl scale-105' : 'shadow-sm hover:shadow-lg hover:scale-105'}`}
                style={{
                  height: '500px',
                  backgroundColor: '#E8E8E8',
                  border: isActive ? '2.5px solid #D0A600' : '1.5px solid #54868A',
                  borderRadius: '17px', boxSizing: 'border-box'
                }}
              >
                {pkg.isPopular && (
                  <div 
                    className="absolute top-[-11px] left-1/2 transform -translate-x-1/2 z-30 flex items-center justify-center shadow-md animate-pulse"
                    style={{ width: '80px', height: '20px', backgroundImage: 'linear-gradient(90deg, #DABD80 84.62%, #746544 100%)', border: '1px solid #AC8947', borderRadius: '23px' }}
                  >
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '9px', color: '#655B3C', letterSpacing: '-0.05em' }}>TERPOPULER!</span>
                  </div>
                )}

                {/* CEKLIS AKTIF */}
                <div className={`absolute top-[-10px] right-[-10px] z-30 flex items-center justify-center h-[30px] w-[30px] rounded-full bg-[#75FFC3] border-[3px] border-[#E8E8E8] shadow-md transition-all duration-300 ease-out ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E4F4D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                </div>

                <img src={pkg.img} alt={pkg.title} style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '14px' }} className="transition-transform duration-500 group-hover:scale-110" />

                <div className="flex items-center justify-center mb-5 shadow-sm" style={{ width: '65px', height: '22px', background: pkg.tagBg, border: '1px solid #AC8947', borderRadius: '23px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', color: '#27241D', letterSpacing: '-0.05em' }}>{pkg.title}</span>
                </div>

                <div className="flex flex-col w-full px-5 mb-4">
                  <div style={{ width: '100%', height: '1.5px', backgroundColor: '#54868A', marginBottom: '10px' }}></div>
                  
                  {pkg.details.map((detail, idx) => (
                    <div key={idx} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-[10px] mt-[4px]">
                        <img src={`/icon${idx + 1}.png`} alt="icon" style={{ width: '14px', height: '14px' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[10px]">✔️</span>'; }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '11px', color: '#395350' }}>{detail}</span>
                      </div>
                      
                      {idx < 4 && <div style={{ width: '100%', height: '1.5px', backgroundColor: '#54868A', marginBottom: '10px' }}></div>}
                    </div>
                  ))}
                </div>
                
                <div className="flex-grow"></div>
                
                <h2 
                  className="italic mb-3 mt-1 font-inria font-bold text-[24px] md:text-[28px] tracking-[-0.06em]" 
                  style={{ color: '#D59100', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)' }}
                >
                  {pkg.price}
                </h2>
                
                <button 
                  className="flex items-center justify-center transition-all duration-300 shadow-sm" 
                  style={{ 
                    width: '160px', height: '38px', borderRadius: '23px', 
                    backgroundColor: isActive ? '#21EBE1' : '#3B6F6C', 
                    border: '3px solid #438889' 
                  }}
                >
                  <span 
                    className="italic font-inter font-medium text-[16px] tracking-[-0.06em]" 
                    style={{ color: isActive ? '#102A24' : '#E8E8E8' }}
                  >
                    Pilih Paket
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/*  3. BOTTOM BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 z-10 px-4 w-full mt-4">
        {/* Tombol KEMBALI */}
        <Link 
          href="/tutorial" 
          className="flex items-center justify-center gap-2 w-full sm:w-[217px] h-[49px] border-[3px] border-[#318570] rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 group"
          style={{ backgroundImage: 'linear-gradient(90deg, #234D42 0%, #35967E 100%)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#102A24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="italic font-inter font-medium text-[20px] text-[#102A24] tracking-[-0.06em]">
            KEMBALI
          </span>
        </Link>

        {/* Tombol PEMBAYARAN */}
        <Link 
          href={selectedId ? `/pembayaran/${selectedId}` : "#"} 
          onClick={(e) => {
            if (!selectedId) {
              e.preventDefault();
              alert("Silakan pilih salah satu paket foto terlebih dahulu!");
            }
          }}
          className="flex items-center justify-center gap-2 w-full sm:w-[217px] h-[49px] border-[3px] border-[#318570] rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 group"
          style={{ backgroundImage: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)' }}
        >
          <span className="italic font-inter font-medium text-[20px] text-[#1D4F42] tracking-[-0.06em]">
            PEMBAYARAN
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Global Fonts Override */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@600&family=Inria+Serif:ital,wght@1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inria { font-family: 'Inria Serif', serif; }
      `}</style>
    </main>
  );
}