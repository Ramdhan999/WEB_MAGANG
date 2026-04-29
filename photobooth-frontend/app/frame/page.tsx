"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FrameSelectionPage() {
  const router = useRouter();

  // State untuk filter kategori aktif
  const [activeCategory, setActiveCategory] = useState("semua"); 

  // State untuk melacak gambar yang gagal dimuat
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Kategori menu di atas (Semua pakai frame.png)
  const categories = [
    { id: "semua", name: "Semua", count: "All", file: "frame.png" },
    { id: "strip", name: "Strip", count: "2-4 Foto", file: "frame.png" },
    { id: "grid", name: "Grid 2x2", count: "4 Foto", file: "frame.png" },
    { id: "collage", name: "Collage", count: "3 Foto", file: "frame.png" },
    { id: "duo", name: "Duo", count: "2 Foto", file: "frame.png" },
  ];

  // Database Template Frames
  const templatesData = [
    { id: 't1', title: 'Imlek Lantern', desc: '3 foto vertikal', category: 'strip', type: 'strip-3', bg: 'bg-[#D1392A]' },
    { id: 't2', title: 'Imlek Barongsai', desc: '2 foto vertikal', category: 'strip', type: 'strip-2', bg: 'bg-[#D1392A]' },
    { id: 't3', title: 'Minecraft Pixel', desc: '3 foto vertikal', category: 'strip', type: 'strip-3', bg: 'bg-[#DEB887]' },
    { id: 't4', title: 'Classic Strip', desc: '4 foto vertikal', category: 'strip', type: 'strip-4', bg: 'bg-[#1D2E2D]' },
    { id: 't5', title: 'Classic Grid', desc: '4 foto grid 2x2', category: 'grid', type: 'grid-4', bg: 'bg-[#1D2E2D]' },
    { id: 't6', title: 'Retro Grid', desc: '4 foto grid 2x2', category: 'grid', type: 'grid-4', bg: 'bg-[#2A4B44]' },
    { id: 't7', title: 'Fun Collage', desc: '3 foto asimetris', category: 'collage', type: 'collage-3', bg: 'bg-[#476A53]' },
    { id: 't8', title: 'Bestie Duo', desc: '2 foto kotak', category: 'duo', type: 'duo-2', bg: 'bg-[#D79D81]' },
    { id: 't9', title: 'Vintage Film', desc: '4 foto vertikal', category: 'strip', type: 'strip-4', bg: 'bg-[#3F2B1D]' },
    { id: 't10', title: 'Neon Grid', desc: '4 foto grid 2x2', category: 'grid', type: 'grid-4', bg: 'bg-[#1D173A]' },
  ];

  // Logika Filter
  const filteredTemplates = activeCategory === "semua" 
    ? templatesData 
    : templatesData.filter(t => t.category === activeCategory);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(templatesData[3].id);

  // Helper function untuk handling error gambar
  const handleImageError = (id: string) => {
    setImgErrors(prev => ({...prev, [id]: true}));
  };

  // --- LOGIKA UNTUK CUSTOM SCROLLBAR BEGERAK ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Menghitung seberapa jauh user nge-scroll (0.0 sampai 1.0)
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setScrollProgress(progress);
    }
  };

  // Reset posisi scrollbar tiap ganti kategori filter
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      setScrollProgress(0);
    }
  }, [activeCategory]);

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-8 pb-12 selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* --- 0. PROGRESS BAR ATAS --- */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[1380px]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow max-w-[486px]" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* --- 1. HEADER SECTION --- */}
      <div className="w-full flex flex-col items-center mt-6 mb-4 z-10 px-4">
        <p className="font-hind font-semibold text-[24px] leading-[36px] tracking-[-0.08em] text-[#3E8C7B] mb-2" style={{ textShadow: '0px 5px 4px rgba(0, 0, 0, 0.25)' }}>
          Pilih tampilan fotomu!
        </p>
        <div className="relative w-full max-w-[1200px] flex justify-center items-center h-[60px]">
          <div className="absolute left-0 flex items-center justify-center gap-3 px-5 py-2.5 rounded-[28px] border border-[#85DDA6] bg-[#476A53] shadow-md z-20">
            <div className="w-[31px] h-[31px]" style={{ background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
            <span className="font-inter font-bold text-[24px] leading-[29px]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SELEKSI FRAME
            </span>
          </div>
          <h1 className="font-inter font-bold text-[48px] leading-[58px] tracking-[-0.05em] text-center" style={{ background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Pilih Template Frame!
          </h1>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="w-[123px] h-[7px] bg-[#6AC5C3] rounded-[12px]"></div>
          <div className="w-[26px] h-[26px]" style={{ background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
          <div className="w-[123px] h-[7px] bg-[#6AC5C3] rounded-[12px]"></div>
        </div>
      </div>

      {/* --- 2. CATEGORY FILTERS --- */}
      <div className="w-full max-w-[1200px] flex flex-wrap justify-center gap-[12px] mb-8 z-10 px-4">
        {categories.map((cat, index) => {
          const isActive = cat.id === activeCategory;
          const errorKey = `cat_${index}`;
          
          return (
            <button
              key={index}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center box-border rounded-[23px] h-[37px] pl-[6px] pr-[6px] transition-all duration-300 ${
                isActive 
                  ? 'bg-[#44B2AD] border-[1.5px] border-[#3FD4DF]' 
                  : 'bg-[#224442] border-[1.5px] border-[#54868A] hover:brightness-110'
              }`}
              style={{ width: '138px' }}
            >
              <div className="w-[24px] h-[24px] rounded-full overflow-hidden flex items-center justify-center shrink-0 ml-1">
                {imgErrors[errorKey] ? (
                  <span className="text-[12px]">📄</span>
                ) : (
                  <img 
                    src={`/${cat.file}`} 
                    alt="icon" 
                    className="w-full h-full object-contain"
                    onError={() => handleImageError(errorKey)} 
                  />
                )}
              </div>
              
              <span className={`font-hind font-semibold text-[16px] leading-[24px] tracking-[-0.08em] mx-auto ${isActive ? 'text-[#19DCB2]' : 'text-[#3E8C7B]'}`} style={{ textShadow: '0px 5px 4px rgba(0, 0, 0, 0.25)' }}>
                {cat.name}
              </span>
              
              <div className={`h-[22px] min-w-[45px] px-2 rounded-[16px] flex items-center justify-center shrink-0 ${isActive ? 'bg-[#1FF0E5]' : 'bg-[#298A85]'}`}>
                <span className="font-inter font-semibold text-[11px] leading-[13px] tracking-[-0.03em] whitespace-nowrap" style={{ background: 'linear-gradient(103.58deg, #617670 -43.71%, #2E4942 111.71%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {cat.count}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* --- 3. TEMPLATE GRID AREA (SCROLL VERTIKAL) --- */}
      <div className="w-full flex justify-center z-10 mb-8 px-4 lg:px-8 h-[450px]">
        <div className="flex gap-6 w-full max-w-[1200px] h-full justify-center">
          
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-grow overflow-y-auto custom-vertical-scrollbar pr-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[24px] content-start justify-items-center"
          >
            {filteredTemplates.map((template) => {
               const isSelected = selectedTemplate === template.id;
               
               return (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`box-border cursor-pointer transition-all duration-300 flex flex-col p-[12px] rounded-[23px] ${
                    isSelected
                      ? 'border-[1.5px] border-[#06E6F6] bg-[#338984] shadow-[0_0_25px_rgba(6,230,246,0.3)] transform scale-105 z-10'
                      : 'border-[1.5px] border-[#54868A] bg-[#2E4F4D] hover:brightness-110'
                  }`}
                  style={{ width: '217px', height: '303px' }}
                >
                   <div className={`w-full flex-grow rounded-[12px] overflow-hidden flex flex-col items-center p-2 relative shadow-inner ${template.bg}`}>
                      {/* Desain Template (Strip/Grid) */}
                      {template.type === 'strip-4' && (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-1 bg-[#1A2E2D]">
                          <div className="w-full flex-grow bg-[#2A4B44] rounded-[6px]"></div>
                          <div className="w-full flex-grow bg-[#2A4B44] rounded-[6px]"></div>
                          <div className="w-full flex-grow bg-[#2A4B44] rounded-[6px]"></div>
                          <div className="w-full flex-grow bg-[#2A4B44] rounded-[6px]"></div>
                        </div>
                      )}
                      {template.type === 'strip-3' && (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 border-[2px] border-[#F5C249] p-2">
                           <div className="w-[90%] flex-grow bg-white shadow-sm rounded-sm"></div>
                           <div className="w-[90%] flex-grow bg-white shadow-sm rounded-sm"></div>
                           <div className="w-[90%] flex-grow bg-white shadow-sm rounded-sm"></div>
                        </div>
                      )}
                      {template.type === 'strip-2' && (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-3">
                           <div className="w-full flex-grow bg-white shadow-sm border-[2px] border-[#F5C249] rounded-sm"></div>
                           <div className="w-full flex-grow bg-white shadow-sm border-[2px] border-[#F5C249] rounded-sm"></div>
                        </div>
                      )}
                      {template.type === 'grid-4' && (
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 p-2 bg-[#1A2E2D]">
                          <div className="w-full h-full bg-[#2E4F4D] rounded-[6px] shadow-sm"></div>
                          <div className="w-full h-full bg-[#2E4F4D] rounded-[6px] shadow-sm"></div>
                          <div className="w-full h-full bg-[#2E4F4D] rounded-[6px] shadow-sm"></div>
                          <div className="w-full h-full bg-[#2E4F4D] rounded-[6px] shadow-sm"></div>
                        </div>
                      )}
                      {template.type === 'collage-3' && (
                        <div className="w-full h-full flex flex-col gap-2 p-2 bg-[#1A2E2D]">
                          <div className="w-full h-[55%] bg-[#2E4F4D] rounded-[6px] shadow-sm"></div>
                          <div className="w-full h-[45%] flex gap-2">
                            <div className="w-1/2 h-full bg-[#2E4F4D] rounded-[6px] shadow-sm"></div>
                            <div className="w-1/2 h-full bg-[#2E4F4D] rounded-[6px] shadow-sm"></div>
                          </div>
                        </div>
                      )}
                      {template.type === 'duo-2' && (
                        <div className="w-full h-full flex flex-col gap-2 p-2 bg-[#1A2E2D]">
                          <div className="w-full flex-grow bg-[#2E4F4D] rounded-[6px] shadow-sm"></div>
                          <div className="w-full flex-grow bg-[#2E4F4D] rounded-[6px] shadow-sm"></div>
                        </div>
                      )}
                   </div>

                   <div className="mt-3 flex flex-col items-center text-center">
                      <h3 className="font-hind font-bold text-[18px] text-white tracking-wide leading-tight">{template.title}</h3>
                      <p className="font-hind font-medium text-[12px] text-[#A9E2B5] mt-0.5">{template.desc}</p>
                   </div>
                </div>
               )
            })}

            {filteredTemplates.length === 0 && (
              <div className="col-span-4 flex items-center justify-center h-full pt-10">
                <p className="text-[#A9E2B5] font-hind text-[18px]">Belum ada template di kategori ini.</p>
              </div>
            )}
          </div>

          {/* CUSTOM VERTICAL SCROLLBAR VISUAL */}
          <div className="shrink-0 box-border w-[12px] h-[434px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center">
              <div className="absolute top-[-18px]">
                 <div className="relative w-[14px] h-[7px]">
                    <div className="absolute w-[11.49px] h-[2.2px] bg-[#5EE39F] rounded-[4px]" style={{ transform: 'matrix(0.66, -0.75, 0.66, 0.75, 0, 0)', left: '0' }}></div>
                    <div className="absolute w-[11.49px] h-[2.2px] bg-[#5EE39F] rounded-[4px]" style={{ transform: 'matrix(-0.66, 0.75, -0.66, -0.75, 0, 0)', right: '0' }}></div>
                 </div>
              </div>

              <div 
                className="w-[12px] h-[82px] bg-[#72DDD8] border-[1.5px] border-[#54868A] rounded-[23px] absolute shadow-[0_0_10px_rgba(114,221,216,0.5)] transition-all duration-75 ease-out"
                style={{ top: `${scrollProgress * 352}px` }}
              ></div>

              <div className="absolute bottom-[-18px] rotate-180">
                 <div className="relative w-[14px] h-[7px]">
                    <div className="absolute w-[11.49px] h-[2.2px] bg-[#5EE39F] rounded-[4px]" style={{ transform: 'matrix(0.66, -0.75, 0.66, 0.75, 0, 0)', left: '0' }}></div>
                    <div className="absolute w-[11.49px] h-[2.2px] bg-[#5EE39F] rounded-[4px]" style={{ transform: 'matrix(-0.66, 0.75, -0.66, -0.75, 0, 0)', right: '0' }}></div>
                 </div>
              </div>
          </div>

        </div>
      </div>

      {/* --- 4. BOTTOM ACTION BUTTONS --- */}
      <div className="mt-[20px] flex items-center justify-center gap-6 z-10 w-full px-4">
        
        <button 
          onClick={() => router.back()}
          className="w-[280px] md:w-[317px] h-[70px] md:h-[74px] bg-[#224C42] border-[3px] border-[#318570] rounded-[23px] flex items-center justify-center gap-3 hover:bg-[#1C3D35] transition-colors shadow-md box-border"
        >
          <div className="relative w-[24px] h-[16px] flex items-center justify-center">
             <div className="absolute w-full h-[2.5px] bg-[#122A24] rounded-full"></div>
             <div className="absolute left-0 w-[10px] h-[2.5px] bg-[#122A24] rotate-45 origin-left rounded-full"></div>
             <div className="absolute left-0 w-[10px] h-[2.5px] bg-[#122A24] -rotate-45 origin-left rounded-full"></div>
          </div>
          <span className="font-inter font-bold italic text-[24px] tracking-[-0.06em] text-[#122A24]">
            Kembali
          </span>
        </button>

        <Link 
          href="/print-preview" 
          className="w-[280px] md:w-[317px] h-[70px] md:h-[74px] rounded-[23px] flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(72,197,166,0.3)] hover:scale-105 active:scale-95 box-border px-4"
          style={{ background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)', border: '3px solid #318570' }}
        >
          <span className="font-inter font-bold italic text-[20px] leading-[24px] tracking-[-0.06em] text-[#1D4F42] text-center whitespace-nowrap">
            Atur foto pada template!
          </span>
          <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0 ml-1">
            {imgErrors['arrowNext'] ? (
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            ) : (
              <img 
                src="/image.png" 
                alt="arrow right" 
                className="w-full h-full object-contain opacity-70 rotate-180" 
                onError={() => handleImageError('arrowNext')} 
              />
            )}
          </div>
        </Link>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        
        .custom-vertical-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-vertical-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}