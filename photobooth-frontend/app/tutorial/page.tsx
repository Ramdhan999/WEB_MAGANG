"use client";

import Link from "next/link";
import Image from "next/image";

export default function TutorialAlurPage() {
  // Data step dengan nama file image yang udah sesuai
  const steps = [
    { num: "1", title: "Pilih Paket", desc: "Pilih paket foto Glambot\nsesuai kebutuhan.", img: "/step1.png" },
    { num: "2", title: "Bayar &\nVerifikasi", desc: "Bayar via QRIS\natau Kartu.", img: "/step2.png" },
    { num: "3", title: "Tutorial", desc: "Tutorial penggunaan\nGlambot arm robot.", img: "/step3.png" },
    { num: "4", title: "Foto", desc: "Sesi ambil foto sesuai\nkeinginan dengan batas\nsesuai paket.", img: "/step4.png" },
    { num: "5", title: "Seleksi Foto", desc: "Pilih foto terbaikmu\nuntuk di masukkan ke\ndalam frame cetak.", img: "/step5.png" },
    { num: "6", title: "Pilih Frame", desc: "Pilih frame cetak\nyang kamu inginkan.", img: "/step6.png" },
    { num: "7", title: "Filter & Stiker", desc: "Tambah filter atau\nstiker sesuai\nkeinginanmu.", img: "/step7.png" },
    { num: "8", title: "Cetak & Kirim", desc: "Cetak langsung atau\nkirim ke perangkat HP\nmilikmu!", img: "/step8.png" },
  ];

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-10 pb-10 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      
      {/* --- 0. PROGRESS BAR ATAS --- */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#151515] to-[#252525]"></div>
        <div className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out bg-gradient-to-l from-[#00FFA2] to-[#467664] w-[10%]"></div>
      </div>

      {/* --- 1. HEADER AREA --- */}
      <div className="flex flex-col items-center mb-8 z-10">
        <div className="mb-4 flex items-center justify-center gap-3 px-8 py-3 bg-[#476A53] border border-[#85DDA6] rounded-full shadow-md">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#75FFC3]">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
          <span className="font-inter font-bold text-[24px] bg-clip-text text-transparent bg-gradient-to-r from-[#A9E2B5] to-[#4DE8D4]">
            Tutorial
          </span>
        </div>

        <h3 className="uppercase tracking-[-0.1em] mb-[-5px] font-hind font-semibold text-[32px] md:text-[40px] bg-clip-text text-transparent bg-gradient-to-r from-[#A9E2B5] to-[#4DE8D4]">
          PANDUAN
        </h3>
        
        <h1 className="italic tracking-[-0.06em] font-inter font-medium text-[64px] md:text-[80px] bg-clip-text text-transparent bg-gradient-to-b from-white to-[#BDBDBD] drop-shadow-lg leading-tight text-center">
          Tutorial Alur Penggunaan
        </h1>

        <div className="flex items-center gap-4 mt-2">
          <div className="w-[120px] h-[4px] bg-[#6AC5C3] rounded-full"></div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#3EFFB8]">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
          <div className="w-[120px] h-[4px] bg-[#6AC5C3] rounded-full"></div>
        </div>
      </div>

      {/* --- 2. GRID 8 KARTU (Layout 4x2 - Rapat & Font Gede) --- */}
      <div className="w-full max-w-[1050px] grid grid-cols-4 gap-6 mb-12 z-10 px-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="flex flex-col items-center text-center p-4 bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[21px] shadow-lg transition-transform hover:scale-105 hover:bg-[#355c5a] hover:border-[#6AC5C3] group"
            style={{ height: '220px' }} // FIX: Tinggi kotak pas (nggak kepanjangan)
          >
            {/* Angka Step (Margin bawah dirapetin) */}
            <span className="mb-1 font-inter font-black text-[22px] text-[#6FFFB4] drop-shadow-[0_0_8px_rgba(111,255,180,0.5)]">
              {step.num}
            </span>

            {/* Kotak Ikon (Pake Image asli dari /public) */}
            <div className="flex items-center justify-center mb-2 w-[52px] h-[52px] bg-[#528A89] rounded-[8px] shadow-inner group-hover:shadow-[0_0_15px_rgba(106,197,195,0.4)] transition-shadow overflow-hidden">
               <Image 
                 src={step.img} 
                 alt={`Step ${step.num}`} 
                 width={40} 
                 height={40} 
                 className="object-contain"
                 // Fallback kalau tiba-tiba gambarnya ga ke-load
                 onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<span class="text-[20px]">📌</span>`;
                 }}
               />
            </div>

            {/* Judul Kartu (Font digedein, margin dirapetin) */}
            <h3 className="mb-1 whitespace-pre-line font-inter font-bold text-[18px] bg-clip-text text-transparent bg-gradient-to-r from-[#A9E2B5] to-[#4DE8D4] leading-[1.1] min-h-[40px] flex items-center justify-center">
              {step.title}
            </h3>

            {/* Deskripsi Kartu (Font digedein) */}
            <p className="whitespace-pre-line font-spartan font-medium text-[14px] leading-[1.15] text-[#ADC8C1] tracking-[-0.02em]">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {/* --- 3. BOTTOM BUTTONS --- */}
      <div className="flex items-center gap-8 z-10">
        
        {/* Tombol KEMBALI */}
        <Link 
          href="/" 
          className="flex items-center justify-center gap-3 w-[217px] h-[49px] bg-gradient-to-l from-[#35967E] to-[#234D42] border-[3px] border-[#318570] rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 group"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E1E1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-inter font-medium italic text-[16px] text-[#0E1E1A] tracking-wide">
            KEMBALI
          </span>
        </Link>

        {/* Tombol LANJUT */}
        <Link 
          href="/pilih-paket" 
          className="flex items-center justify-center gap-3 w-[250px] h-[49px] bg-gradient-to-r from-[#48C5A6] to-[#35967E] border-[3px] border-[#318570] rounded-full shadow-[0_0_15px_rgba(72,197,166,0.3)] transition-transform hover:scale-105 active:scale-95 group"
        >
          <span className="font-inter font-medium italic text-[16px] text-[#1D4F42] tracking-wide">
            MENGERTI, BERIKUT
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
        
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