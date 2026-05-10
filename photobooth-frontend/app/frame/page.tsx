"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FrameSelectionPage() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState("semua"); 
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  
  // Awalnya gak ada yang kepilih biar adil
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Kategori udah disesuaikan angkanya sama template real lu
  const categories = [
    { id: "semua", name: "Semua", count: "4", file: "image.png" },
    { id: "strip", name: "Strip", count: "3", file: "image.png" },
    { id: "grid", name: "Grid 2x2", count: "1", file: "image.png" },
    { id: "collage", name: "Collage", count: "0", file: "image.png" },
    { id: "duo", name: "Duo", count: "0", file: "image.png" },
  ];

  const templatesData = [
    { id: 't1', title: 'Imlek Edition 1', desc: 'Frame Strip', category: 'strip', image: '/IMLEK 1.png' },
    { id: 't2', title: 'Imlek Edition 2', desc: 'Frame Strip', category: 'strip', image: '/IMLEK 2.png' },
    { id: 't3', title: 'Imlek Edition 3', desc: 'Frame Strip', category: 'strip', image: '/IMLEK 3.png' },
    { id: 't4', title: 'Pixel Minecraft', desc: 'Frame Grid', category: 'grid', image: '/PIXEL 1.png' },
  ];

  const filteredTemplates = activeCategory === "semua" 
    ? templatesData 
    : templatesData.filter(t => t.category === activeCategory);

  const handleImageError = (id: string) => {
    setImgErrors(prev => ({...prev, [id]: true}));
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setScrollProgress(progress);
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      setScrollProgress(0);
    }
  }, [activeCategory]);

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden pt-8 pb-12 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{ backgroundColor: '#E3D5D5' }}
    >
      {/* PROGRESS BAR ATAS */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[75%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow max-w-[486px]" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* 1. HEADER SECTION */}
      <div className="w-full flex flex-col items-center mt-6 mb-8 z-10 px-4">
        {/* Teks kecil di atas */}
        <p className="font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em] text-[#3E8C7B] mb-2">
          Pilih tampilan fotomu!
        </p>
        
        {/* Kontainer Utama Judul dengan Grid 3 Kolom biar Center-nya Presisi */}
        <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-[300px_1fr_300px] items-center">
          
          {/* SISI KIRI: Badge Seleksi Frame */}
          <div className="flex justify-start">
            <div className="flex items-center gap-3 px-6 py-2.5 bg-[#476A53] border border-[#85DDA6] rounded-full shadow-md">
              {/* Ikon Bintang Poligon Lu */}
              <div 
                className="w-[24px] h-[24px] md:w-[31px] md:h-[31px]" 
                style={{ 
                  background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', 
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' 
                }} 
              />
              <span 
                className="font-inter font-bold text-[18px] md:text-[24px] uppercase tracking-tight"
                style={{ 
                  background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                SELEKSI FRAME
              </span>
            </div>
          </div>
          
          {/* TENGAH: Judul Utama (Bener-bener Center) */}
          <h1 className="font-inter font-bold text-[36px] md:text-[48px] tracking-[-0.05em] text-[#6F6F6F] text-center whitespace-nowrap">
            Pilih Template Frame!
          </h1>

          {/* SISI KANAN: Kosong (Buat penyeimbang Grid) */}
          <div className="hidden md:block"></div>
        </div>
        
        {/* Garis & Bintang Bawah */}
        <div className="flex items-center gap-4 mt-4">
          <div className="w-[100px] md:w-[123px] h-[7px] bg-[#6AC5C3] rounded-[12px]"></div>
          <div 
            className="w-[22px] h-[22px] md:w-[26px] md:h-[26px]" 
            style={{ 
              background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)',
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
            }}
          ></div>
          <div className="w-[100px] md:w-[123px] h-[7px] bg-[#6AC5C3] rounded-[12px]"></div>
        </div>
      </div>

      {/* 2. CATEGORY FILTERS */}
      <div className="w-full max-w-[1000px] flex flex-wrap justify-center gap-[12px] mb-8 z-10 px-4">
        {categories.map((cat, index) => {
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={index}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center justify-between box-border rounded-[23px] h-[37px] pl-[6px] pr-[6px] transition-all duration-300 bg-[#FFFFFF] shadow-sm border-[1.5px] ${
                isActive ? 'border-[#BDAE00] scale-105' : 'border-[#54868A] hover:border-[#BDAE00]'
              }`}
              style={{ width: '138px' }}
            >
              <div className="w-[24px] h-[24px] rounded-full overflow-hidden flex items-center justify-center shrink-0">
                <span className="text-[12px]">{isActive ? '🌟' : '🖼️'}</span>
              </div>
              <span className={`font-hind font-semibold text-[16px] leading-[24px] tracking-[-0.08em] ${isActive ? 'text-[#19DCB2]' : 'text-[#3E8C7B]'}`}>
                {cat.name}
              </span>
              <div className={`h-[22px] min-w-[52px] px-2 rounded-[16px] flex items-center justify-center shrink-0 ${isActive ? 'bg-[#00B7A5]' : 'bg-[#858585]'}`}>
                <span className="font-inter font-semibold text-[11px] text-white">
                  {cat.count}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 3. TEMPLATE GRID AREA */}
      <div className="w-full flex justify-center z-10 mb-8 px-4 lg:px-8 h-[450px]">
        <div className="flex gap-6 w-full max-w-[1000px] h-full justify-center">
          
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-grow overflow-y-auto custom-vertical-scrollbar pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 content-start justify-items-center"
          >
            {filteredTemplates.map((template) => {
               const isSelected = selectedTemplate === template.id;
               return (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`box-border cursor-pointer transition-all duration-300 flex flex-col p-[12px] bg-[#FFFFFF] rounded-[23px] shadow-sm border-[1.5px] ${
                    isSelected
                      ? 'border-[#F6AA06] transform scale-105 z-10 shadow-[0_4px_15px_rgba(246,170,6,0.3)]'
                      : 'border-[#54868A] hover:border-[#F6AA06]'
                  }`}
                  style={{ width: '217px', height: '303px' }}
                >
                   {/* AREA GAMBAR TEMPLATE (PUTIH BERSIH) */}
                   <div className="w-full flex-grow rounded-[12px] overflow-hidden flex flex-col items-center justify-center p-2 relative shadow-inner bg-[#FFFFFF]">
                      {imgErrors[template.id] ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#F9F9F9] rounded-[8px]">
                           <span className="text-[30px] opacity-20">🖼️</span>
                           <span className="text-[10px] text-[#888] mt-2 italic text-center">Gambar {template.image} belum di public/</span>
                        </div>
                      ) : (
                        <img 
                          src={template.image} 
                          alt={template.title} 
                          className="w-full h-full object-contain"
                          onError={() => handleImageError(template.id)}
                        />
                      )}
                   </div>

                   <div className="mt-3 flex flex-col items-center text-center">
                      <h3 className="font-hind font-bold text-[18px] text-[#3E8C7B] tracking-wide leading-tight">{template.title}</h3>
                      <p className="font-hind font-medium text-[12px] text-[#54868A] mt-0.5">{template.desc}</p>
                   </div>
                </div>
               )
            })}
            
            {/* Teks kalau kategorinya kosong (misal pas user klik Duo atau Collage) */}
            {filteredTemplates.length === 0 && (
              <div className="col-span-4 flex items-center justify-center h-full pt-10">
                <p className="text-[#54868A] font-hind text-[18px]">Belum ada template di kategori ini.</p>
              </div>
            )}
          </div>

          {/* CUSTOM VERTICAL SCROLLBAR */}
          <div className="shrink-0 box-border w-[12px] h-[434px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center">
              <div 
                className="w-[12px] h-[82px] bg-[#72DDD8] border-[1.5px] border-[#54868A] rounded-[23px] absolute shadow-[0_0_10px_rgba(114,221,216,0.5)] transition-all duration-75 ease-out"
                style={{ top: `${scrollProgress * 348}px` }}
              ></div>
          </div>

        </div>
      </div>

      {/* 4. BOTTOM ACTION BUTTONS */}
      <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 z-10 w-full px-4">
        <Link 
          href="/kamera" 
          className="flex items-center justify-center gap-3 w-full sm:w-[217px] h-[49px] border-[3px] border-[#318570] rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 group"
          style={{ backgroundImage: 'linear-gradient(90deg, #234D42 0%, #35967E 100%)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E1E1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-inter font-medium italic text-[16px] md:text-[20px] text-[#0E1E1A] tracking-[-0.06em]">
            KEMBALI
          </span>
        </Link>

        <Link 
          href={selectedTemplate ? `/print-preview?frame=${selectedTemplate}` : '#'} 
          onClick={(e) => { if (!selectedTemplate) { e.preventDefault(); alert("Pilih frame dulu bro!"); } }}
          className={`flex items-center justify-center gap-3 w-full sm:w-[350px] h-[49px] border-[3px] border-[#318570] rounded-full shadow-md transition-all duration-300 group ${
            selectedTemplate ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'
          }`}
          style={{ background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)' }}
        >
          <span className="font-inter font-medium italic text-[16px] md:text-[20px] text-[#1D4F42] tracking-[-0.06em] whitespace-nowrap">
            ATUR FOTO PADA TEMPLATE!
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .custom-vertical-scrollbar::-webkit-scrollbar { display: none; }
        .custom-vertical-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}