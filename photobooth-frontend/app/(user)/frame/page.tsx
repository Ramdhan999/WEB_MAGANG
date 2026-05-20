"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FrameSelectionPage() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState("semua"); 
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

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
    <main className="relative flex min-h-screen flex-col items-center justify-center pt-8 pb-12 px-4 select-none overflow-x-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR ATAS */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[75%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow max-w-[486px]" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      <div className="w-full max-w-[1200px] flex flex-col items-center flex-1 justify-center z-10 mt-6">
        
        {/* 1. HEADER SECTION */}
        <div className="w-full flex flex-col items-center mb-6">
          <p className="font-hind font-semibold text-[24px] leading-none tracking-[-0.08em] text-[#3E8C7B] mb-2">
            Pilih tampilan fotomu!
          </p>
          
          <div className="w-full grid grid-cols-1 md:grid-cols-[300px_1fr_300px] items-center">
            {/* SISI KIRI: Badge Seleksi Frame */}
            <div className="flex justify-start">
              <div className="flex items-center gap-3 px-6 py-2.5 bg-[#476A53] border border-[#85DDA6] rounded-full shadow-md shrink-0">
                <div 
                  className="w-[24px] h-[24px]" 
                  style={{ 
                    background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', 
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' 
                  }} 
                />
                <span 
                  className="font-inter font-bold text-[18px] uppercase tracking-tight leading-none pt-0.5"
                  style={{ 
                    background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  SELEKSI FRAME
                </span>
              </div>
            </div>
            
            {/* TENGAH: Judul Utama */}
            <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">
              Pilih Template Frame!
            </h1>

            {/* SISI KANAN: Kosong (Penyeimbang Grid) */}
            <div className="hidden md:block"></div>
          </div>
          
          <div className="flex items-center gap-4 mt-3">
            <div className="w-[123px] h-[7px] bg-[#6AC5C3] rounded-[12px]"></div>
            <div 
              className="w-[26px] h-[26px]" 
              style={{ 
                background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              }}
            ></div>
            <div className="w-[123px] h-[7px] bg-[#6AC5C3] rounded-[12px]"></div>
          </div>
        </div>

        {/* 2. CATEGORY FILTERS (Lebih lega dan nggak mepet) */}
        <div className="w-full flex flex-wrap justify-center gap-3 mb-6">
          {categories.map((cat, index) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={index}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center justify-between box-border rounded-[23px] h-[42px] px-3 transition-all duration-300 bg-white shadow-sm border-[1.5px] ${
                  isActive ? 'border-[#BDAE00] scale-105' : 'border-[#54868A] hover:border-[#BDAE00]'
                }`}
                style={{ minWidth: '148px' }}
              >
                <div className="w-[26px] h-[26px] rounded-full overflow-hidden flex items-center justify-center shrink-0">
                  <span className="text-[14px]">{isActive ? '🌟' : '🖼️'}</span>
                </div>
                <span className={`font-hind font-semibold text-[16px] leading-none tracking-[-0.08em] mx-2 ${isActive ? 'text-[#19DCB2]' : 'text-[#3E8C7B]'}`}>
                  {cat.name}
                </span>
                <div className={`h-[24px] min-w-[52px] px-2 rounded-[16px] flex items-center justify-center shrink-0 ${isActive ? 'bg-[#00B7A5]' : 'bg-[#858585]'}`}>
                  <span className="font-inter font-semibold text-[12px] text-white pt-0.5">
                    {cat.count}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* 3. TEMPLATE GRID AREA DENGAN SCROLLBAR */}
        <div className="w-full flex justify-center mb-6 h-[450px]">
          <div className="flex gap-6 w-full max-w-[1000px] h-full justify-center">
            
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              // Tambahan pt-4 pb-4 biar frame aman gak kepotong pas nge-zoom
              className="flex-grow overflow-y-auto custom-vertical-scrollbar pr-2 pt-4 pb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 content-start justify-items-center"
            >
              {filteredTemplates.map((template) => {
                 const isSelected = selectedTemplate === template.id;
                 return (
                  <div 
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`box-border cursor-pointer transition-all duration-300 flex flex-col p-[12px] bg-white rounded-[23px] shadow-sm border-[1.5px] ${
                      isSelected
                        ? 'border-[#F6AA06] transform scale-105 z-10 shadow-[0_4px_15px_rgba(246,170,6,0.3)]'
                        : 'border-[#54868A] hover:border-[#F6AA06]'
                    }`}
                    style={{ width: '217px', height: '303px' }}
                  >
                     <div className="w-full flex-grow rounded-[12px] overflow-hidden flex flex-col items-center justify-center p-2 relative shadow-inner bg-white">
                        {imgErrors[template.id] ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#F9F9F9] rounded-[8px]">
                             <span className="text-[30px] opacity-20">🖼️</span>
                             <span className="text-[10px] text-[#888] mt-2 italic text-center px-1">Gambar {template.image} belum di public/</span>
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

                     <div className="mt-3 flex flex-col items-center text-center leading-none">
                        <h3 className="font-hind font-bold text-[18px] text-[#3E8C7B] tracking-wide mb-1">{template.title}</h3>
                        <p className="font-hind font-medium text-[13px] text-[#54868A] tracking-tight">{template.desc}</p>
                     </div>
                  </div>
                 )
              })}
              
              {filteredTemplates.length === 0 && (
                <div className="col-span-4 flex items-center justify-center h-full pt-10">
                  <p className="text-[#54868A] font-hind text-[18px]">Belum ada template di kategori ini.</p>
                </div>
              )}
            </div>

            {/* CUSTOM VERTICAL SCROLLBAR */}
            <div className="shrink-0 box-border w-[12px] h-[418px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center shadow-inner mt-4">
                <div 
                  className="w-[12px] h-[82px] bg-[#72DDD8] border-[1.5px] border-[#54868A] rounded-[23px] absolute shadow-[0_0_10px_rgba(114,221,216,0.5)] transition-all duration-75 ease-out"
                  style={{ top: `${scrollProgress * 332}px` }}
                ></div>
            </div>

          </div>
        </div>

        {/* 4. BOTTOM ACTION FOOTER AREA */}
        <div className="w-full grid grid-cols-3 items-center px-2 mt-auto">
          
          {/* Tombol KEMBALI */}
          <div className="flex justify-start">
            <button 
              onClick={() => router.push("/kamera")} 
              className="font-inter font-medium italic text-[24px] tracking-[-0.06em] text-[#0E1E1A] hover:opacity-70 transition-opacity leading-none"
            >
              ← KEMBALI
            </button>
          </div>

          {/* Tombol Lanjut Kunci Di Tengah (Desain sama persis halaman lain) */}
          <div className="flex items-center justify-center">
            <Link 
              href={selectedTemplate ? `/print-preview?frame=${selectedTemplate}` : '#'} 
              onClick={(e) => { if (!selectedTemplate) { e.preventDefault(); alert("Pilih frame dulu bro!"); } }}
              className={`flex items-center justify-center gap-3 w-full sm:w-[350px] h-[53px] rounded-[23px] shadow-md transition-all duration-300 group ${
                selectedTemplate ? 'bg-[#3A9F86] border-3 border-[#E3D5D5] hover:scale-105 active:scale-95 cursor-pointer' : 'bg-gray-400 border-3 border-gray-300 opacity-60 grayscale cursor-not-allowed'
              }`}
            >
              <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em]">
                Atur Foto Pada Template!
              </span>
              <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </div>
            </Link>
          </div>

          {/* Penyeimbang Grid */}
          <div className="hidden sm:block"></div>

        </div>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .custom-vertical-scrollbar::-webkit-scrollbar { display: none; }
        .custom-vertical-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}