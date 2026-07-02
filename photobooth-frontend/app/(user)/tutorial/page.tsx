"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePageSound } from "@/hooks/usePageSound"; 

export default function TutorialAlurPage() {
  const router = useRouter(); 
  const [isLoading, setIsLoading] = useState(false); 

   usePageSound("/fase/tutorial_alur.mpeg");

  const mainStages = [
    {
      num: "01",
      title: "Mulai & Bayar",
      subtitle: "Paket sesuai kebutuhan, verifikasi otomatis.",
      bgImg: "/bg1.png",
      iconImg: "/step1.png",
      accentBg: "linear-gradient(180deg, #E59F4C 0%, #7F582A 100%)",
      subSteps: [
        { label: "Mulai & Bayar", desc: "Solo, Duo, Group, Premium" },
        { label: "Scan QRIS / Voucher", desc: "Bayar cepat, status langsung ok" }
      ]
    },
    {
      num: "02",
      title: "Ambil Foto",
      subtitle: "Robot bantu kamera, kamu tinggal pose.",
      bgImg: "/bg2.png",
      iconImg: "/step2.png",
      accentBg: "linear-gradient(180deg, #7077C2 0%, #35385C 100%)",
      subSteps: [
        // { label: "Tutorial Robot", desc: "Pelajari gestur tangan" },
        { label: "Sesi Foto Bebas", desc: "Jepret sepuasnya, retake aman" }
      ]
    },
    {
      num: "03",
      title: "Kurasi & Edit",
      subtitle: "Pilih terbaik, lalu atur frame favorit.",
      bgImg: "/bg3.png",
      iconImg: "/step3.png",
      accentBg: "linear-gradient(180deg, #8FCFC1 0%, #496962 100%)",
      subSteps: [
        { label: "Seleksi Foto", desc: "Pilih sampai 10 foto terbaik" },
        { label: "Frame, Slot, Filter", desc: "Strip, Grid, Collage, Sticker" }
      ]
    },
    {
      num: "04",
      title: "Cetak & Kirim",
      subtitle: "Hasil cetak siap, softcopy masuk HP.",
      bgImg: "/bg4.png",
      iconImg: "/step4.png",
      accentBg: "linear-gradient(180deg, #5F89BB 0%, #2B3E55 100%)",
      subSteps: [
        { label: "Cetak 4R Instan", desc: "Print langsung di studio" },
        { label: "Kirim Digital", desc: "WhatsApp, QR Galeri, atau ZIP" }
      ]
    }
  ];

  // LOGIKA BARU: Kita tambahin nomor urut yang beneran ngitung berurutan di sini
  let globalCounter = 1;
  const stagesWithNumbers = mainStages.map(stage => {
    return {
      ...stage,
      subSteps: stage.subSteps.map(sub => {
        return {
          ...sub,
          stepNumber: globalCounter++ // Ngitung urut, nggak peduli index stage-nya
        };
      })
    };
  });

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-4 pb-12 px-4 md:px-8 selection:bg-[#75FFC3] selection:text-[#2E4F4D]" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[5%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* HEADER AREA */}
      <div className="w-full max-w-[1225px] flex flex-col items-center mt-12 mb-16 z-10 text-center relative px-2">
        <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">
          Panduan Singkat
        </p>
        <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">
          Tutorial Alur Penggunaan
        </h1>
        <p className="font-inter font-semibold text-[20px] text-[#6F6F6F] mt-4 max-w-[603px] leading-[24px]">
          4 tahap mudah dipahami - pilih paket, ambil foto, edit, lalu cetak & kirim ke HP.
        </p>
      </div>

      {/* GRID KARTU TAHAPAN */}
      <div className="w-full max-w-[1440px] flex flex-wrap justify-center gap-6 mb-10 z-10">
        {/* LOGIKA BARU: pakai stagesWithNumbers yang udah dikasih stepNumber */}
        {stagesWithNumbers.map((stage, index) => (
          <div 
            key={index}
            className="flex flex-col bg-[#FDFAF4] border-[1.5px] border-[#E3D5D5] rounded-[21px] p-5 shadow-[5px_8px_29.6px_rgba(0,0,0,0.25)] hover:scale-[1.03] transition-all duration-300 relative overflow-hidden w-[339px] h-[404px]"
          >
            {/* Banner Atas Kartu */}
            <div className="w-full h-[108px] rounded-[21px] overflow-hidden relative mb-3 flex-shrink-0 bg-[#C4C1C1]">
              <img src={stage.bgImg} className="w-full h-full object-cover" alt={stage.title} />
              
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-[4px] border border-[#287728]/20">
                <span className="font-inter font-black italic text-[8px] text-[#287B77] tracking-[0.29em]">TAHAP {stage.num}</span>
              </div>

              <div className="absolute top-2 right-2 w-[43px] h-[43px] bg-white border-[1.5px] border-[#E3D5D5] rounded-[14px] shadow-sm flex items-center justify-center p-1 z-30">
                <img src={stage.iconImg} className="w-full h-full object-contain" alt="step-logo" />
              </div>

              <div className="absolute top-1 right-1 w-4 h-4 bg-[#3A9F86] rounded-full flex items-center justify-center text-[9px] text-white shadow-sm border border-white z-40">
                ✓
              </div>
            </div>

            {/* INFO JUDUL KARTU */}
            <div className="mb-2 text-center px-2 flex flex-col items-center justify-center">
              <h3 className="font-inter font-bold text-[32px] text-[#453F3F] tracking-tight leading-[39px] mb-1">{stage.title}</h3>
              <p className="font-inter font-semibold text-[15px] text-[#6F6F6F] leading-[18px] max-w-[270px]">{stage.subtitle}</p>
            </div>

            <div className="w-full h-[1px] bg-gray-200 mb-3"></div>

            {/* List Sub-Langkah */}
            <div className="flex flex-col gap-3 flex-1 justify-center">
              {stage.subSteps.map((sub, subIdx) => (
                <div key={subIdx} className="flex items-center gap-3">
                  <div 
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0 border border-black/10 shadow-sm"
                    style={{ background: stage.accentBg }}
                  >
                    {/* LOGIKA BARU: Tinggal panggil sub.stepNumber, nggak pake rumus ribet lagi */}
                    <span className="font-inter font-semibold text-[24px] leading-[29px] text-white">
                      {sub.stepNumber}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-inter font-bold text-[20px] text-[#453F3F] leading-[24px]">{sub.label}</h4>
                    <p className="font-inter font-semibold text-[14px] text-[#6F6F6F] leading-[17px] mt-0.5">{sub.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="w-full max-w-[1440px] flex flex-col items-center mt-4 z-10 relative">
        <button 
          onClick={() => router.push("/pilih-paket")} 
          className="flex items-center justify-center gap-3 w-full sm:w-[265px] h-[53px] bg-[#3A9F86] border-3 border-[#E3D5D5] rounded-[23px] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em]">
            Lanjut
          </span>
          <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
        </button>

        <div className="w-full flex justify-start px-4 md:px-0 mt-16">
          <button 
            onClick={() => router.push("/")} 
            className="font-inter font-medium italic text-[24px] tracking-[-0.06em] text-[#0E1E1A] hover:opacity-70 transition-opacity"
          >
            ← KEMBALI
          </button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}