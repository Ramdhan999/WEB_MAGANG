"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation"; 
import { useState } from "react"; 

export default function TutorialAlurPage() {
  const router = useRouter(); 
  const [isLoading, setIsLoading] = useState(false); 

  const steps = [
    { num: "1", title: "Pilih Paket", desc: "Pilih paket foto Glambot\nsesuai kebutuhan.", img: "/step1.png" },
    { num: "2", title: "Bayar & Verifikasi", desc: "Bayar via QRIS\natau Kartu.", img: "/step2.png" },
    { num: "3", title: "Tutorial", desc: "Tutorial penggunaan\nGlambot arm robot.", img: "/step3.png" },
    { num: "4", title: "Foto", desc: "Sesi ambil foto sesuai keinginan\ndengan batas sesuai paket.", img: "/step4.png" },
    { num: "5", title: "Seleksi Foto", desc: "Pilih foto terbaikmu untuk\ndimasukkan ke dalam frame cetak.", img: "/step5.png" },
    { num: "6", title: "Pilih Frame", desc: "Pilih frame cetak\nyang kamu inginkan.", img: "/step6.png" },
    { num: "7", title: "Filter & Stiker", desc: "Tambah filter atau stiker\nsesuai keinginanmu.", img: "/step7.png" },
    { num: "8", title: "Cetak & Kirim", desc: "Cetak langsung atau kirim\nke perangkat HP milikmu!", img: "/step8.png" },
  ];

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden pt-10 pb-12 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{ backgroundColor: '#E3D5D5' }}
    >
      
      {/* 0. PROGRESS BAR ATAS */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#151515] to-[#252525]"></div>
        <div className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out bg-gradient-to-l from-[#00FFA2] to-[#467664] w-[10%]"></div>
      </div>

      {/* 1. HEADER AREA */}
      <div className="flex flex-col items-center mb-8 z-10 px-4 mt-4">
        
        {/* BADGE "Tutorial" */}
        <div className="mb-4 flex items-center justify-center gap-3 px-6 md:px-8 py-2 md:py-3 bg-[#476A53] border border-[#85DDA6] rounded-full shadow-md">
          {/* Ikon Bintang */}
          <div className="w-[24px] h-[24px] md:w-[31px] md:h-[31px]" style={{ background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          <span 
            className="font-inter font-bold text-[18px] md:text-[24px] bg-clip-text text-transparent"
            style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)' }}
          >
            Tutorial
          </span>
        </div>

        {/* PANDUAN */}
        <h3 
          className="uppercase tracking-[-0.1em] mb-[-5px] md:mb-[-15px] font-hind font-semibold text-[28px] md:text-[40px] bg-clip-text text-transparent text-center"
          style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #527559 19.23%, #155A51 100%)' }}
        >
          PANDUAN
        </h3>
        
        {/* TUTORIAL ALUR PENGGUNAAN */}
        <h1 
          className="italic tracking-[-0.06em] font-inter font-medium text-[42px] md:text-[64px] lg:text-[96px] bg-clip-text text-transparent leading-tight text-center"
          style={{ 
            backgroundImage: 'linear-gradient(90deg, #5D5D5D 0%, #FFFFFF 200%)',
            filter: 'drop-shadow(3px 5px 4px rgba(0, 0, 0, 0.25))' 
          }}
        >
          Tutorial Alur Penggunaan
        </h1>

        {/* GARIS PEMBATAS BAWAH JUDUL */}
        <div className="flex items-center gap-4 mt-4">
          <div className="w-[60px] md:w-[75px] h-[3px] bg-[#6AC5C3] rounded-full"></div>
          <div className="w-[15px] h-[15px]" style={{ background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          <div className="w-[60px] md:w-[75px] h-[3px] bg-[#6AC5C3] rounded-full"></div>
        </div>
      </div>

      {/* 2. GRID 8 KARTU */}
      <div className="w-full max-w-[1020px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-12 z-10 px-6 md:px-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="flex flex-col items-center justify-start text-center py-3 px-2 bg-[#F6F6F6] border-[1.5px] border-[#54868A] rounded-[21px] shadow-sm hover:shadow-lg transition-all hover:scale-105 hover:border-[#6AC5C3] group"
            style={{ height: '200px' }} 
          >
            {/* Angka Step */}
            <span className="mb-1 font-inter font-black text-[24px] text-[#3C855F] leading-none">
              {step.num}
            </span>

            {/* Kotak Ikon */}
            <div className="flex items-center justify-center mb-1 w-[55px] h-[55px] bg-[#528A89] rounded-[8px] transition-transform group-hover:scale-110 overflow-hidden shrink-0">
               <Image 
                 src={step.img} 
                 alt={`Step ${step.num}`} 
                 width={35} 
                 height={35} 
                 className="object-contain"
                 onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-[18px] text-white">📷</span>`;
                 }}
               />
            </div>

            {/* Judul Kartu */}
            <h3 
              className="mb-1 font-inter font-bold text-[16px] bg-clip-text text-transparent min-h-[38px] flex items-center justify-center whitespace-pre-line leading-[1.1]"
              style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #526A57 0%, #206159 100%)' }}
            >
              {step.title}
            </h3>

            {/* Deskripsi Kartu */}
            <p className="whitespace-pre-line font-spartan font-medium text-[15px] md:text-[15px] leading-tight text-[#787878] tracking-[-0.04em]">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 3. BOTTOM BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 z-10 px-4">
        
        {/* Tombol KEMBALI */}
        <Link 
          href="/" 
          className="flex items-center justify-center gap-3 w-full sm:w-[217px] h-[49px] border-[3px] border-[#318570] rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 group"
          style={{ backgroundImage: 'linear-gradient(90deg, #234D42 0%, #35967E 99.99%)' }}
        >
          {/* Ikon Arrow Kembali (Pakai SVG panah) */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E1E1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-inter font-medium italic text-[16px] md:text-[20px] text-[#0E1E1A] tracking-[-0.06em]">
            KEMBALI
          </span>
        </Link>

        {/* Tombol MENGERTI, BERIKUT */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            if (isLoading) return; 
            
            setIsLoading(true);
            
            setTimeout(() => {
              router.push("/pilih-paket");
            }, 3000); 
          }}
          disabled={isLoading} 
          className={`flex items-center justify-center gap-2 w-full sm:w-[240px] md:w-[260px] h-[49px] border-[3px] border-[#318570] rounded-full shadow-md transition-transform group ${isLoading ? 'opacity-80 cursor-wait' : 'hover:scale-105 active:scale-95 cursor-pointer'}`}
          style={{ backgroundImage: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)' }}
        >
          <span className="font-inter font-medium italic text-[14px] md:text-[15px] text-[#1D4F42] tracking-[-0.06em]">
            {isLoading ? 'MEMUAT...' : 'MENGERTI, BERIKUT'}
          </span>
          
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-[#1D4F42]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          )}
        </button>
        
      </div>

      {/* Global Fonts Override */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@600&family=League+Spartan:wght@500&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-spartan { font-family: 'League Spartan', sans-serif; }
      `}</style>
      
    </main>
  );
}