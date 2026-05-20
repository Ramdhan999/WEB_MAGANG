"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PilihPaketPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const packages = [
    {
      id: "solo",
      title: "SOLO",
      price: "Rp. 35,000",
      tagBg: "#FF8623",
      avatarBg: "linear-gradient(147.96deg, #FEA685 39.28%, #FDBB9E 113.17%)",
      avatarImg: "/paket1.png",
      details: ["Sesi 5 menit", "Foto bebas", "1 Cetak (4R)", "Semua File Digital", "Maks. 1 Orang"]
    },
    {
      id: "duo",
      title: "DUO",
      price: "Rp. 45,000",
      tagBg: "#B288FD",
      avatarBg: "linear-gradient(147.96deg, #BA96FD 39.28%, #CBAFFE 113.17%)",
      avatarImg: "/paket2.png",
      details: ["Sesi 5 minutes", "Foto bebas", "2 Cetak (4R)", "Semua File Digital", "Maks. 2 Orang"]
    },
    {
      id: "group",
      title: "GROUP",
      price: "Rp. 55,000",
      tagBg: "#60E8B5",
      isPopular: true,
      avatarBg: "linear-gradient(147.96deg, #6FEABC 39.28%, #94F0CC 113.17%)",
      avatarImg: "/paket3.png",
      details: ["Sesi 7 menit", "Foto bebas", "2 Cetak (4R)", "Semua File Digital", "Maks. 5 Orang"]
    },
    {
      id: "premium",
      title: "PREMIUM",
      price: "Rp. 75,000",
      tagBg: "#F3C372",
      avatarBg: "linear-gradient(147.96deg, #F6CA7E 39.28%, #FCD79A 113.17%)",
      avatarImg: "/paket4.png",
      details: ["Sesi 10 menit", "Foto bebas", "4 Cetak (4R)", "Semua File Digital", "Maks. 5 Orang"]
    }
  ];

  const handleConfirmPackage = (id: string) => {
    router.push(`/pembayaran/${id}`);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-4 pb-12 px-4 md:px-8" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[15%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* HEADER AREA */}
      <div className="w-full max-w-[1225px] flex flex-col items-center mt-12 mb-8 z-10 text-center relative px-2">
        <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">
          Pilih Yang Sesuai Untuk Anda
        </p>
        <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">
          Pilih Paket Foto
        </h1>
        <p className="font-inter font-semibold text-[20px] text-[#6F6F6F] mt-4 max-w-[603px] leading-[24px]">
          Semua paket sudah termasuk semua digital copy & filter premium. Foto sepuasnya, pilih terbaik untuk dicetak.
        </p>
      </div>

      {/* CARDS GRID */}
      <div className="w-full max-w-[1440px] flex flex-wrap justify-center gap-6 mb-6 z-10">
        {packages.map((pkg) => {
          const isActive = selectedId === pkg.id;
          
          return (
            <div 
              key={pkg.id}
              /* KLIK 1: Memilih kartu untuk merubah status aktif visual */
              onClick={() => setSelectedId(pkg.id)}
              className={`flex flex-col bg-white rounded-[17px] pt-6 pb-5 px-5 relative cursor-pointer select-none transition-all duration-300 w-[312px] h-[435px] ${isActive ? 'shadow-[6px_9px_20px_rgba(0,0,0,0.35)] scale-[1.02]' : 'shadow-[6px_9px_9.6px_rgba(0,0,0,0.25)] hover:scale-[1.02]'}`}
              style={{ border: isActive ? '3px solid #398679' : '1.5px solid transparent' }}
            >
              {/* Ribbon Terpopuler */}
              {pkg.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[143px] h-[18px] bg-[#398679] rounded-b-[7px] flex items-center justify-center gap-1 z-30 shadow-sm">
                  <span className="text-yellow-300 text-[9px]">★</span>
                  <span className="font-inter font-extrabold italic text-[11px] text-white tracking-[-0.06em]">TERPOPULER!</span>
                </div>
              )}

              {/* Checkmark Bulat Aktif */}
              <div className={`absolute top-3 right-3 z-30 flex items-center justify-center h-[26px] w-[26px] rounded-full bg-[#3A9F86] shadow-sm transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </div>

              {/* Badge Kategori Paket */}
              <div className="flex items-center justify-center h-[23px] w-[64px] mx-auto rounded-[23px] border border-[#AC8947] shadow-sm shrink-0 mt-1 mb-3" style={{ backgroundColor: pkg.tagBg }}>
                <span className="font-inter font-bold text-[12px] text-[#27241D] tracking-[-0.05em] text-center">{pkg.title}</span>
              </div>

              {/* Avatar Lingkaran */}
              <div className="w-[55px] h-[55px] rounded-full mx-auto flex items-center justify-center overflow-hidden mb-3 shrink-0 shadow-inner" style={{ background: pkg.avatarBg }}>
                <img src={pkg.avatarImg} className="w-[38px] h-[38px] object-contain" alt="avatar" />
              </div>

              {/* Detail Fitur List */}
              <div className="flex flex-col w-full flex-1 justify-start">
                {pkg.details.map((detail, idx) => (
                  <div key={idx} className="w-full">
                    <div className="flex items-center gap-3 py-1.5 px-1">
                      <div className="w-[22px] h-[21px] relative flex-shrink-0 flex items-center justify-center">
                        <img 
                          src={`/icon${idx + 1}.png`} 
                          className="w-full h-full object-contain" 
                          alt="feature-icon" 
                        />
                      </div>
                      <span className="font-inter font-medium text-[12px] text-[#395350] leading-none">{detail}</span>
                    </div>
                    {idx < 4 && <div className="w-full h-[1px] bg-[#54868A]/50"></div>}
                  </div>
                ))}
              </div>

              {/* Section Harga & Tombol */}
              <div className="text-center w-full mt-auto pt-2">
                <h2 className="font-inter font-bold text-[28px] text-[#17684E] tracking-[-0.09em] leading-none mb-2">
                  {pkg.price}
                </h2>
                
                {/* KLIK 2: Tombol internal konfirmasi perpindahan halaman */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation(); // Mencegah bentrok trigger klik div luar kartu
                    if (isActive) {
                      handleConfirmPackage(pkg.id);
                    } else {
                      // Jika kartu belum aktif, klik tombol otomatis mengaktifkan kartunya dulu
                      setSelectedId(pkg.id);
                    }
                  }}
                  className={`w-full h-[45px] rounded-[23px] border flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-[#509E91] border-[#398679] hover:opacity-90 active:scale-95' 
                      : 'bg-white border-[#9B9B9B] hover:bg-gray-50'
                  }`}
                >
                  <span className={`font-inter font-semibold text-[20px] tracking-[-0.06em] ${isActive ? 'text-white' : 'text-[#153C32]'}`}>
                    Pilih Paket
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* CARD PERINGATAN / INFO BOX */}
      <div className="w-full max-w-[1189px] h-[78px] bg-[#E7EDEB] border border-[#C7DDD7] rounded-[23px] flex items-center justify-center gap-4 px-6 mb-3 z-10 shadow-sm">
        <span className="text-2xl">📌</span>
        <p className="font-inter font-extrabold italic text-[16px] md:text-[20px] text-[#16665E] tracking-[-0.06em] text-center leading-tight">
          Setiap anggota grup bisa dapat cetakan sendiri. <span className="font-medium text-gray-600 not-italic">Cetakan personal tambahan tersedia opsional di akhir sesi - bayar belakangan setelah lihat hasil</span>
        </p>
      </div>

      {/* FOOTER AREA (FIX POSISI SEJAJAR 100% SESUAI FIGMA) */}
      <div className="w-full max-w-[1440px] flex flex-col items-center z-10 relative mt-0 px-6 md:px-4">
        <div className="w-full flex justify-start mt-16">
          <button 
            onClick={() => router.push("/tutorial")} 
            className="font-inter font-medium italic text-[24px] tracking-[-0.06em] text-[#0E1E1A] hover:opacity-70 transition-opacity"
          >
            ← KEMBALI
          </button>
        </div>
      </div>

    </main>
  );
}