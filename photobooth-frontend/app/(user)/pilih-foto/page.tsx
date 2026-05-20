"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PilihFotoPage() {
  const router = useRouter();
  
  // Dummy data 12 foto (Nanti ini diganti URL foto asli dari hasil kamera)
  const initialPhotos = Array.from({ length: 12 }).map((_, i) => ({
    id: `photo-${i + 1}`,
    url: `/dummy-photo-${i + 1}.jpg`, 
    isSelected: false,
    order: 0
  }));

  const [photos, setPhotos] = useState(initialPhotos);
  const maxSelection = 10;

  // Menghitung jumlah foto yang dipilih
  const selectedPhotos = photos.filter((p) => p.isSelected);
  const selectedCount = selectedPhotos.length;

  // Fungsi Toggle Pilih Foto
  const togglePhotoSelection = (id: string) => {
    setPhotos((prevPhotos) => {
      const isCurrentlySelected = prevPhotos.find(p => p.id === id)?.isSelected;
      
      // Jika mau pilih tapi sudah penuh, jangan kasih (kecuali un-check)
      if (!isCurrentlySelected && selectedCount >= maxSelection) return prevPhotos;

      return prevPhotos.map((photo) => {
        if (photo.id === id) {
          const newSelectedStatus = !photo.isSelected;
          return { 
            ...photo, 
            isSelected: newSelectedStatus,
            // Kasih nomor urut berdasarkan urutan klik
            order: newSelectedStatus ? selectedCount + 1 : 0 
          };
        }
        return photo;
      });
    });
  };

  // Fungsi Hapus Semua Pilihan
  const clearSelection = () => {
    setPhotos((prev) => prev.map((p) => ({ ...p, isSelected: false, order: 0 })));
  };

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-10 pb-12 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* --- 0. PROGRESS BAR ATAS --- */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)' }}>
        <div 
          className="h-full shadow-[0_0_15px_rgba(0,255,162,0.3)]" style={{ width: '1220px', maxWidth: '90%', background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)'}}>
        </div>
      </div>

      {/* --- 1. HEADER TITLE & BADGE --- */}
      <div className="flex flex-col items-center mb-6 z-10 w-full max-w-[1000px]">
        
        {/* Badge SELEKSI FOTO */}
        <div className="flex items-center justify-center gap-3 px-6 py-2.5 mb-6 rounded-[28px] border border-[#85DDA6] bg-[#476A53] shadow-md">
          <div className="w-[31px] h-[31px] flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
          <span className="font-inter font-bold text-[24px] leading-[29px]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SELEKSI FOTO
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[48px] font-bold font-inter leading-[58px] tracking-[-0.05em] mb-1" style={{ background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Pilih foto terbaik kamu!
        </h1>
        
        {/* Star Icon */}
        <div className="w-[26px] h-[26px] mb-2" style={{ background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
        
        {/* Subtitle */}
        <p className="text-center font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em] text-[#3E8C7B]" style={{ textShadow: '0px 5px 4px rgba(0, 0, 0, 0.25)' }}>
          Tap foto untuk memilih atau membatalkan pilihan. Pilih hingga <br/>
          <span className="text-[#FFAE00]">10 foto terbaik</span> yang akan digunakan untuk frame dan cetak.
        </p>
      </div>

      {/* --- 2. TOOLBAR SELEKSI --- */}
      <div className="w-full max-w-[929px] h-[79px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[23px] flex items-center justify-between px-6 mb-6 shadow-lg z-10">
        
        {/* Sisi Kiri: Counter & Status */}
        <div className="flex items-center gap-5">
          {/* Kotak Counter (0/10) */}
          <div className="w-[130px] h-[47px] rounded-[23px] border-[1.5px] border-[#279167] flex items-center justify-center shadow-inner" style={{ background: 'linear-gradient(270.24deg, #235547 87.18%, #4DBB9C 99.03%)' }}>
            <span className="font-inria text-[36px] leading-[43px] tracking-[-0.06em]" style={{ background: 'linear-gradient(180deg, #FFAE00 0%, #EDEDED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)' }}>
              {selectedCount}/{maxSelection}
            </span>
          </div>
          
          {/* Status Text */}
          <div className="flex items-center gap-3">
            <div className="w-[26px] h-[26px]" style={{ background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
            <span className="font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {selectedCount} foto di pilih - {selectedCount < maxSelection ? 'Maksimum belum tercapai.' : 'Maksimum tercapai.'}
            </span>
          </div>
        </div>

        {/* Sisi Kanan: Hapus Pilihan */}
        <button 
          onClick={clearSelection}
          disabled={selectedCount === 0}
          className={`flex items-center gap-3 px-5 py-2 rounded-full border border-transparent transition-all duration-300 ${
            selectedCount > 0 
            ? 'hover:bg-[#254540] cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {/* Ikon Silang (Custom Line) */}
          <div className="relative w-[21px] h-[21px] flex items-center justify-center">
            <div className="absolute w-[2px] h-[21px] bg-[#3BA2A4] rounded-[3px] rotate-45"></div>
            <div className="absolute w-[21px] h-[2px] bg-[#3BA2A4] rounded-[3px] rotate-45"></div>
          </div>
          <span className="font-hind font-semibold text-[20px] leading-[30px] tracking-[-0.08em] text-[#67BBB3]">
            Hapus Pilihan.
          </span>
        </button>
      </div>

      {/* --- 3. GRID GALLERY FOTO & SCROLLBAR --- */}
      <div className="w-full max-w-[960px] flex gap-5 z-10 h-[434px] justify-center items-start">
        
        {/* Kontainer Grid dengan Custom Scrollbar Figma */}
        <div className="w-[929px] grid grid-cols-4 gap-[15px] overflow-y-auto custom-scrollbar pr-3 content-start">
          
          {photos.map((photo) => (
            <div 
              key={photo.id}
              onClick={() => togglePhotoSelection(photo.id)}
              className={`relative w-full aspect-[217/141] rounded-[23px] cursor-pointer transition-all duration-300 ${
                photo.isSelected 
                ? 'border-[3px] border-[#00FFA2] shadow-[0_0_20px_rgba(0,255,162,0.4)] scale-[0.98]' 
                : 'border-[1.5px] border-[#54868A] bg-[#2E4F4D] hover:brightness-110'
              }`}
            >
              {/* Tempat Fotonya (Nanti ganti jadi tag <Image>) */}
              <div className="w-full h-full bg-transparent rounded-[20px]"></div>

              {/* Overlay Terpilih (Centang & Urutan) */}
              {photo.isSelected && (
                <div className="absolute inset-0 bg-[#00FFA2]/10 flex items-center justify-center rounded-[20px] animate-fade-in border-[2px] border-[#00FFA2]/50">
                  <div className="absolute top-2 right-2 w-7 h-7 bg-[#00FFA2] rounded-full flex items-center justify-center shadow-lg">
                     <span className="text-[#0F1E1B] font-bold text-[14px]">{photo.order}</span>
                  </div>
                  <div className="w-12 h-12 bg-[#00FFA2] rounded-full flex items-center justify-center shadow-[0_0_15px_#00FFA2]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F1E1B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
          
        </div>
      </div>

      {/* --- 4. TOMBOL BAWAH --- */}
      <div className="mt-8 flex items-center gap-6 z-10">
        
        {/* Tombol Kembali */}
        <button 
          onClick={() => router.back()}
          className="w-[220px] h-[74px] bg-[#224C42] border-[3px] border-[#318570] rounded-[23px] flex items-center justify-center gap-2 hover:bg-[#1C3D35] transition-colors shadow-md"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#122A24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-inter font-bold italic text-[24px] leading-[29px] tracking-[-0.06em] text-[#122A24]">
            Kembali
          </span>
        </button>

        {/* Tombol Lanjut */}
        <Link 
          href="/frame" // Nanti rute ke halaman frame
          className={`w-[317px] h-[74px] rounded-[23px] border-[3px] flex items-center justify-center gap-2 transition-all duration-300 ${
            selectedCount > 0 
            ? 'bg-gradient-to-r from-[#48C5A6] to-[#35967E] border-[#318570] shadow-[0_0_20px_rgba(72,197,166,0.3)] hover:scale-105 active:scale-95 cursor-pointer' 
            : 'bg-[#2E4F4D] border-[#54868A] opacity-50 cursor-not-allowed'
          }`}
          onClick={(e) => { if (selectedCount === 0) e.preventDefault(); }}
        >
          <span className={`font-inter font-bold italic text-[24px] leading-[29px] tracking-[-0.06em] ${selectedCount > 0 ? 'text-[#1D4F42]' : 'text-[#A9E2B5]'}`}>
            Lanjut edit {selectedCount > 0 ? selectedCount : maxSelection} foto
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedCount > 0 ? "#1D4F42" : "#A9E2B5"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
      </div>

      {/* --- CSS GLOBAL UNTUK SCROLLBAR SESUAI FIGMA --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,700;1,700&family=Inria+Serif:wght@400;700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-inria { font-family: 'Inria Serif', serif; }
        
        /* SCROLLBAR CUSTOM (Mewakili Rectangle 163 & 164 Figma) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2E4F4D;
          border: 1.5px solid #54868A;
          border-radius: 23px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #72DDD8;
          border: 1.5px solid #54868A;
          border-radius: 23px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #5C9385;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </main>
  );
}