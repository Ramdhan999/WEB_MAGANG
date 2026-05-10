"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const frameId = searchParams.get('frame') || 't4';

  const [photoSlots, setPhotoSlots] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("ORIGINAL");
  const [intensity, setIntensity] = useState(100);
  const [stickers, setStickers] = useState<any[]>([]);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    // AMBIL DATA DARI LOCAL STORAGE
    const savedSlots = localStorage.getItem("arranged_slots");
    const savedFilter = localStorage.getItem("applied_filter");
    const savedIntensity = localStorage.getItem("filter_intensity");
    const savedStickers = localStorage.getItem("applied_stickers");

    if (savedSlots) setPhotoSlots(JSON.parse(savedSlots));
    
    // Pastikan filter name sama persis (Uppercase)
    if (savedFilter) {
      setActiveFilter(savedFilter.toUpperCase());
    }
    
    if (savedIntensity) {
      setIntensity(Number(savedIntensity));
    }

    if (savedStickers) setStickers(JSON.parse(savedStickers));
  }, []);

  const frameConfigs: Record<string, { image: string; overlayStyle: any }> = {
    't1': { image: '/IMLEK 1.png', overlayStyle: { top: '18%', height: '62%', left: '11%', right: '11%', display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: '20px' } },
    't2': { image: '/IMLEK 2.png', overlayStyle: { top: '14%', height: '70%', left: '11%', right: '11%', display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '15px' } },
    't3': { image: '/IMLEK 3.png', overlayStyle: { top: '12%', height: '74%', left: '10%', right: '10%', display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '12px' } },
    't4': { image: '/PIXEL 1.png', overlayStyle: { top: '11.5%', height: '73.5%', left: '11%', right: '11%', display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '14px' } },
  };

  const currentFrame = frameConfigs[frameId] || frameConfigs['t4'];

  // FUNGSI FILTER YANG DISESUAIKAN DENGAN HALAMAN EDIT
  const getFilterCSS = () => {
    if (activeFilter === "ORIGINAL" || !activeFilter) return "none";
    const int = intensity / 100;
    switch (activeFilter) {
      case "NOIR": return `grayscale(${100 * int}%) contrast(${100 + (20 * int)}%)`;
      case "VINTAGE": return `sepia(${60 * int}%) contrast(${100 - (10 * int)}%)`;
      case "COOL": return `hue-rotate(${30 * int}deg) saturate(${100 + (20 * int)}%)`;
      case "WARM": return `sepia(${30 * int}%) saturate(${100 + (40 * int)}%)`;
      case "VIVID": return `saturate(${100 + (80 * int)}%)`;
      case "DRAMA": return `contrast(${100 + (50 * int)}%) saturate(${100 - (20 * int)}%)`;
      case "SOFT": return `brightness(${100 + (10 * int)}%) contrast(${100 - (15 * int)}%) blur(${1 * int}px)`;
      case "FILM": return `sepia(${20 * int}%) contrast(${100 + (10 * int)}%) brightness(${100 - (5 * int)}%)`;
      default: return "none";
    }
  };

  const handleNewSession = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-4 pb-12 overflow-x-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* 0. PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-[100] flex">
        <div className="h-full w-full" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
      </div>

      {/* 1. HEADER */}
      <div className="w-full flex flex-col items-center mt-12 mb-8 z-10 px-4 text-center">
        <p className="font-hind font-semibold text-[24px] text-[#3E8C7B] drop-shadow-sm leading-none uppercase" style={{ textShadow: '0px 5px 4px rgba(0, 0, 0, 0.25)' }}>foto kamu siap</p>
        <h1 className="font-inter font-bold text-[48px] text-[#434343] tracking-[-0.05em] leading-[58px]">Hasil Foto</h1>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-12 items-start justify-center px-6 mb-32 relative z-10">
        
        {/* === SISI KIRI: HASIL AKHIR === */}
        <div className="flex flex-col items-center flex-shrink-0">
           <div className="w-[290px] h-[710px] bg-white border-[1.5px] border-[#54868A] rounded-[17px] flex items-center justify-center shadow-2xl p-4">
              <div className="w-[245px] h-[680px] bg-[#545151] border-[1.5px] border-[#54868A] rounded-[11px] flex items-center justify-center relative overflow-hidden">
                <div className="relative w-full h-full">
                  
                  {/* FOTO LAYER (Z-10) */}
                  <div className="absolute inset-0 z-10" style={currentFrame.overlayStyle}>
                    {photoSlots.map((slot: any) => (
                      <div key={slot.id} className="w-full h-full bg-white rounded-[4px] overflow-hidden flex items-center justify-center border border-gray-100">
                        {slot.photo ? (
                          <img 
                            src={slot.photo} 
                            className="w-full h-full object-cover transition-all duration-300" 
                            style={{ filter: getFilterCSS() }} // FILTER DI FOTO LANGSUNG
                            alt="Result" 
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {/* FRAME LAYER (Z-20) */}
                  <img src={currentFrame.image} className="absolute inset-0 w-full h-full object-stretch z-20 pointer-events-none" alt="Frame" />

                  {/* STIKER LAYER (Z-30) */}
                  <div className="absolute inset-0 z-30 pointer-events-none">
                    {stickers.map((stk: any) => (
                      <div key={stk.id} style={{ position: 'absolute', left: `${stk.x}%`, top: `${stk.y}%`, transform: `translate(-50%, -50%) rotate(${stk.rotation}deg)`, width: `${stk.size}px`, height: `${stk.size}px` }} className="flex items-center justify-center">
                        <span style={{ fontSize: `${stk.size * 0.8}px` }}>{stk.emoji}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* === SISI KANAN: ACTIONS === */}
        <div className="flex flex-col gap-8 w-full lg:w-[856px]">
          
          {/* HEADER KANAN */}
          <div className="w-full h-[95px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] flex items-center justify-between px-8 shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-[65px] h-[65px] bg-[#C4C1C1] border-[1.5px] border-[#54868A] rounded-[23px] flex items-center justify-center overflow-hidden p-3">
                   <img src="/live.png" className="w-full h-full object-contain" alt="live" />
                </div>
                <div className="flex flex-col">
                   <h2 className="font-inter font-bold text-[36px] text-[#434343] leading-tight">Live Preview Photo</h2>
                   <p className="font-inter font-normal text-[20px] text-[#434343]">Foto pilihan kamu</p>
                </div>
             </div>
             <span className="font-inter font-bold text-[36px] text-[#434343]">{photoSlots.filter(s => s.photo).length}/10</span>
          </div>

          {/* AREA MOCKUP */}
          <div className="w-full h-[350px] bg-[#CAC6C6] rounded-[10px] flex items-center justify-center shadow-inner overflow-hidden border border-[#54868A]/20">
             <img src="/placeholder-live.png" className="w-full h-full object-cover opacity-60" alt="Live Mockup" />
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <button className="h-[95px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] flex items-center p-3 gap-4 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left">
                <div className="w-[75px] h-[75px] bg-[#2E706D] border border-[#54868A] rounded-[23px] flex items-center justify-center shrink-0 overflow-hidden p-3">
                   <img src="/print.png" className="w-full h-full object-contain" alt="print" />
                </div>
                <div className="flex-1">
                   <h3 className="font-inter font-bold text-[32px] text-[#545454] tracking-[-0.05em] leading-none mb-1">Cetak Photo</h3>
                   <p className="font-hind font-semibold text-[18px] text-[#3E8C7B] tracking-[-0.08em] leading-none">Print di mesin studio.</p>
                </div>
                <span className="text-2xl opacity-40">→</span>
             </button>

             <button className="h-[95px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] flex items-center p-3 gap-4 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left">
                <div className="w-[75px] h-[75px] bg-[#2E706D] border border-[#54868A] rounded-[23px] flex items-center justify-center shrink-0 overflow-hidden p-3">
                   <img src="/expor.png" className="w-full h-full object-contain" alt="export" />
                </div>
                <div className="flex-1">
                   <h3 className="font-inter font-bold text-[32px] text-[#545454] tracking-[-0.05em] leading-none mb-1">Kirim Digital</h3>
                   <p className="font-hind font-semibold text-[20px] text-[#3E8C7B] tracking-[-0.08em] leading-none">WhatsApp & QR galeri</p>
                </div>
                <span className="text-2xl opacity-40">→</span>
             </button>
          </div>
        </div>
      </div>

      {/* 3. FOOTER BAR */}
      <div className="fixed bottom-0 left-0 w-full h-[115px] bg-white border-t border-[#54868A]/30 z-[60] flex items-center justify-center shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
         <div className="w-full max-w-[1400px] flex items-center justify-between px-10">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#FCDD98] to-[#F6CB7B] rounded-full flex items-center justify-center border border-[#8B6604]">
                     <span className="text-[#8B6604] font-bold text-xl">★</span>
                  </div>
                  <span className="font-inter font-bold italic text-[24px] text-[#545454] tracking-[-0.05em]">Rating Sesi</span>
               </div>
               <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className={`text-[40px] transition-all ${rating >= star ? 'text-[#FDB93A] scale-110' : 'text-[#CDCDCD]'}`}>★</button>
                  ))}
               </div>
               <input type="text" placeholder="Komentar (opsional)" className="w-[400px] h-[50px] bg-[#CAC6C6] rounded-[10px] px-4 font-hind text-[18px] text-[#434343] focus:outline-none" />
               <button className="w-[120px] h-[50px] bg-[#967C46] rounded-[13px] text-white font-inter font-bold text-[24px] hover:bg-[#856a38] shadow-md transition-all active:scale-95">Kirim</button>
            </div>

            <button onClick={handleNewSession} className="flex items-center gap-4 px-6 h-[60px] bg-[#CDCDCD] rounded-[13px] hover:bg-gray-300 transition-all active:scale-95 group">
               <div className="w-10 h-10 flex items-center justify-center opacity-50 group-hover:rotate-180 transition-transform duration-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#545454" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
               </div>
               <span className="font-inter font-bold text-[24px] text-[#545454] tracking-[-0.05em]">Sesi Baru</span>
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

export default function ResultPage() {
  return <Suspense><ResultContent /></Suspense>;
}