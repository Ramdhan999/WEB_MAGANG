"use client";

import { useState } from "react";
import Link from "next/link";

export default function PilihPaketPage() {
  // State buat deteksi mouse hover
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // State buat nyimpen paket yang lagi dipilih (default: premium)
  const [selectedId, setSelectedId] = useState<string>("premium");

  // Data array buat 4 paket
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
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-16 pb-16 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* --- 0. PROGRESS BAR ATAS (25%) --- */}
      <div className="absolute top-0 left-0 w-full h-[12px]">
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)' }}></div>
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
          style={{ width: '25%', background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}
        ></div>
      </div>

      {/* --- 1. BADGE "Pilih Paket" --- */}
      <div 
        className="mb-4 flex items-center justify-center gap-3 shadow-md"
        style={{ width: '224px', height: '56px', background: '#476A53', border: '1px solid #85DDA6', borderRadius: '28px' }}
      >
        <div style={{ width: '24px', height: '24px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <span 
          style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '24px',
            background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}
        >
          Pilih Paket
        </span>
      </div>

      {/* --- 2. HEADER TEXT --- */}
      <div className="flex flex-col items-center mb-8">
        <h3 
          className="tracking-[-0.08em] mb-[-5px]"
          style={{
            fontFamily: "'Hind Vadodara', sans-serif", fontWeight: 600, fontSize: '24px',
            background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}
        >
          Pilih yang sesuai untuk anda
        </h3>
        <h1 
          className="italic tracking-[-0.06em]"
          style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '75px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textShadow: '3px 5px 4px rgba(0, 0, 0, 0.4)'
          }}
        >
          Tutorial Alur Penggunaan
        </h1>
      </div>

      {/* --- 3. 4 CARDS GRID PAKET --- */}
      <div className="flex flex-wrap justify-center gap-[15px] px-4 w-full mb-6 mt-8">
        {packages.map((pkg) => {
          // LOGIKA AKTIF: Kotak nyala kalau di-hover ATAU kalau lagi di-klik (selected)
          const isActive = hoveredId === pkg.id || selectedId === pkg.id;

          return (
            <div 
              key={pkg.id} 
              className="relative mt-[20px] group"
              onMouseEnter={() => setHoveredId(pkg.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setSelectedId(pkg.id)} // Mengunci pilihan saat diklik
            > 
              
              {/* Tag TERPOPULER */}
              {pkg.isPopular && (
                <div 
                  className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 z-20 flex items-center justify-center shadow-md animate-pulse"
                  style={{ width: '100px', height: '23px', background: 'linear-gradient(90deg, #DABD80 84.62%, #746544 100%)', border: '1px solid #AC8947', borderRadius: '23px' }}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#655B3C', letterSpacing: '-0.05em' }}>TERPOPULER!</span>
                </div>
              )}

              {/* Checkmark Centang Ijo (MUNCUL KALAU AKTIF) dengan efek pop */}
              <div 
                className={`absolute top-[-15px] right-[-15px] z-20 flex items-center justify-center h-[45px] w-[45px] rounded-full bg-[#75FFC3] border-[3px] border-[#2E4F4D] shadow-[0_0_15px_rgba(117,255,195,0.6)] transition-all duration-300 ease-out ${isActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-4'}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E4F4D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </div>

              {/* BOX KARTU DENGAN EFEK GLOW */}
              <div 
                className={`flex flex-col items-center pt-8 pb-6 relative z-10 transition-all duration-500 ease-out cursor-pointer ${isActive ? 'shadow-[0_0_30px_rgba(42,232,246,0.3)]' : 'shadow-lg hover:shadow-xl'}`}
                style={{
                  width: '240px', height: '435px',
                  // BERUBAH WARNA PAS AKTIF
                  background: isActive ? '#427C7A' : '#2E4F4D',
                  border: isActive ? '1.5px solid #2AE8F6' : '1.5px solid #54868A',
                  borderRadius: '17px', boxSizing: 'border-box',
                  transform: isActive ? 'translateY(-12px)' : 'translateY(0)' // Kotak naik dikit
                }}
              >
                
                <img src={pkg.img} alt={pkg.title} style={{ width: '82px', height: '82px', objectFit: 'contain', marginBottom: '12px' }} className="transition-transform duration-500 group-hover:scale-110" />

                <div 
                  className="flex items-center justify-center mb-6 shadow-sm"
                  style={{ width: '71px', height: '23px', background: pkg.tagBg, border: '1px solid #AC8947', borderRadius: '23px' }}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#27241D', letterSpacing: '-0.05em' }}>
                    {pkg.title}
                  </span>
                </div>

                <div className="flex flex-col w-full px-6 mb-4">
                  <div style={{ width: '100%', height: '1.5px', background: '#54868A', marginBottom: '8px' }}></div>
                  
                  {pkg.details.map((detail, idx) => (
                    <div key={idx} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-[8px] mt-[2px]">
                        <img src={`/icon${idx + 1}.png`} alt="icon" style={{ width: '19px', height: '19px' }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', color: isActive ? '#AEE6E1' : '#7EC1BA', transition: 'color 0.3s' }}>
                          {detail}
                        </span>
                      </div>
                      {idx < 4 && <div style={{ width: '100%', height: '1.5px', background: '#54868A', marginBottom: '8px' }}></div>}
                    </div>
                  ))}
                </div>

                <div className="flex-grow"></div>

                <h2 
                  className="italic mb-4"
                  style={{
                    fontFamily: "'Inria Serif', serif", fontWeight: 700, fontSize: '32px', letterSpacing: '-0.06em',
                    background: 'linear-gradient(90deg, #FFC74F 0%, #FFEEC8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  {pkg.price}
                </h2>

                {/* TOMBOL BAWAH DALAM KOTAK */}
                <button 
                  className="flex items-center justify-center transition-all duration-300 shadow-md"
                  style={{
                    width: '217px', height: '49px', borderRadius: '23px', boxSizing: 'border-box',
                    // BERUBAH WARNA PAS AKTIF
                    background: isActive ? '#4BC4BD' : '#3B6F6C',
                    border: isActive ? '3px solid #497171' : '3px solid #438889',
                  }}
                >
                  <span 
                    className="italic transition-colors duration-300"
                    style={{
                      fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '24px', letterSpacing: '-0.06em',
                      // BERUBAH WARNA TEKS PAS AKTIF
                      color: isActive ? '#153C32' : '#8BB8B1'
                    }}
                  >
                    {isActive ? "Terpilih" : "Pilih Paket"}
                  </span>
                </button>

              </div>
            </div>
          );
        })}
      </div>

      {/* --- 4. BOTTOM BUTTONS --- */}
      <div className="flex items-center gap-6 mt-12">
        {/* Tombol KEMBALI */}
        <Link 
          href="/tutorial" 
          className="flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
          style={{
            width: '217px', height: '49px', background: 'linear-gradient(90deg, #234D42 71.63%, #35967E 100%)',
            border: '3px solid #318570', borderRadius: '23px', textDecoration: 'none'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#102A24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span className="italic" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '20px', color: '#102A24', letterSpacing: '-0.06em' }}>
            KEMBALI
          </span>
        </Link>

        {/* Tombol PEMBAYARAN (Link Dinamis sesuai paket yang diklik) */}
        <Link 
          href={`/pembayaran/${selectedId}`} 
          className="flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(72,197,166,0.3)]"
          style={{
            width: '217px', height: '49px', background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)',
            border: '3px solid #318570', borderRadius: '23px', textDecoration: 'none'
          }}
        >
          <span className="italic" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '20px', color: '#1D4F42', letterSpacing: '-0.06em' }}>
            PEMBAYARAN
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>

    </main>
  );
}