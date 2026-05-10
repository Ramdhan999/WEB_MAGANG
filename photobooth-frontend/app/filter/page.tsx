"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PlacedSticker {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  emoji: string;
}

function FilterStickerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const frameId = searchParams.get('frame') || 't4';

  const [selectedFilter, setSelectedFilter] = useState("ORIGINAL");
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [isBefore, setIsBefore] = useState(false);
  const [stickerCategory, setStickerCategory] = useState("Ekspresi");
  
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [photoSlots, setPhotoSlots] = useState<any[]>([]); // Balikin ke format awal lu
  const [scrollProgress, setScrollProgress] = useState(0);

  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ id: number; type: "move" | "resize" | "rotate"; startX: number; startY: number; startSize: number; startLeft: number; startTop: number; startRotation: number; } | null>(null);

  const frameConfigs: Record<string, { image: string; slots: number; overlayStyle: any }> = {
    't1': { image: '/IMLEK 1.png', slots: 2, overlayStyle: { top: '18%', height: '62%', left: '11%', right: '11%', display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: '20px' } },
    't2': { image: '/IMLEK 2.png', slots: 3, overlayStyle: { top: '14%', height: '70%', left: '11%', right: '11%', display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '15px' } },
    't3': { image: '/IMLEK 3.png', slots: 3, overlayStyle: { top: '12%', height: '74%', left: '10%', right: '10%', display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '12px' } },
    't4': { image: '/PIXEL 1.png', slots: 3, overlayStyle: { top: '11.5%', height: '73.5%', left: '11%', right: '11%', display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '14px' } },
  };

  const currentFrame = frameConfigs[frameId] || frameConfigs['t4'];

  useEffect(() => {
    try {
      const savedData = localStorage.getItem("arranged_slots");
      if (savedData) {
        setPhotoSlots(JSON.parse(savedData));
      } else {
        setPhotoSlots(Array.from({ length: currentFrame.slots }).map((_, i) => ({
          id: i + 1, photo: null
        })));
      }
    } catch (e) {
      console.error("Gagal load foto:", e);
    }
  }, [currentFrame.slots]);

  const filters = ["ORIGINAL", "NOIR", "VINTAGE", "VIVID", "WARM", "COOL", "DRAMA", "SOFT", "FILM"];
  
  const stickerCategories = [
    { name: "Ekspresi", icon: "🤩" },
    { name: "Love", icon: "❤️" },
    { name: "Alam", icon: "🏞️" },
    { name: "Party", icon: "🎉" },
    { name: "Teks", icon: "🔠" }
  ];

  const stickersMap: Record<string, string[]> = {
    "Ekspresi": ["😊", "😎", "😂", "😍", "🤔", "😴", "🥳", "😭", "🥺", "😡", "🤫", "🤯"],
    "Love": ["❤️", "💖", "💕", "💔", "💌", "💘", "💝", "💞", "🫶", "💋"],
    "Alam": ["🌸", "🍀", "🌻", "🍁", "🍄", "🌎", "🌙", "⭐", "🌈", "⚡"],
    "Party": ["🎉", "🎈", "🎊", "🎁", "🍾", "🥂", "🎂", "🎇", "🪩", "✨"],
    "Teks": ["OMG", "WOW", "YAY", "COOL", "LOL", "SWAG", "LIT", "BFF", "BEST", "VIBE"]
  };

  const addSticker = (emoji: string) => {
    const newSticker = { id: Date.now(), x: 50, y: 50, size: 60, rotation: 0, emoji };
    setPlacedStickers([...placedStickers, newSticker]);
  };

  const removeSticker = (id: number) => {
    setPlacedStickers(placedStickers.filter(s => s.id !== id));
  };

  const applyPreset = (preset: string) => {
    if (preset === 'FAMILY') {
      setSelectedFilter('WARM'); setFilterIntensity(80); addSticker("👨‍👩‍👧‍👦");
    } else if (preset === 'PARTY') {
      setSelectedFilter('VIVID'); setFilterIntensity(100); addSticker("🎉");
    } else if (preset === 'VINTAGE') {
      setSelectedFilter('VINTAGE'); setFilterIntensity(90); addSticker("📻");
    } else if (preset === 'CINEMA') {
      setSelectedFilter('DRAMA'); setFilterIntensity(95); addSticker("🎬");
    }
  };

  const handleLihatHasil = () => {
    localStorage.setItem("applied_filter", selectedFilter);
    localStorage.setItem("filter_intensity", filterIntensity.toString());
    localStorage.setItem("applied_stickers", JSON.stringify(placedStickers));
    router.push("/result");
  };

  const getFilterCSS = () => {
    if (isBefore || selectedFilter === "ORIGINAL") return "none";
    const int = filterIntensity / 100;
    switch (selectedFilter) {
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

  const onStartAction = (e: React.MouseEvent, s: PlacedSticker, type: "move" | "resize" | "rotate") => {
    e.stopPropagation(); e.preventDefault();
    dragInfo.current = { id: s.id, type, startX: e.clientX, startY: e.clientY, startSize: s.size, startLeft: s.x, startTop: s.y, startRotation: s.rotation };
  };

  const onGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!dragInfo.current || !frameRef.current) return;
    const info = dragInfo.current;
    const frameRect = frameRef.current.getBoundingClientRect();

    if (info.type === "move") {
      const dx = ((e.clientX - info.startX) / frameRect.width) * 100;
      const dy = ((e.clientY - info.startY) / frameRect.height) * 100;
      setPlacedStickers(prev => prev.map(s => s.id === info.id ? { ...s, x: info.startLeft + dx, y: info.startTop + dy } : s));
    } else if (info.type === "resize") {
      const dx = e.clientX - info.startX;
      const dy = e.clientY - info.startY;
      const newSize = Math.max(30, Math.min(150, info.startSize + Math.max(dx, dy)));
      setPlacedStickers(prev => prev.map(s => s.id === info.id ? { ...s, size: newSize } : s));
    } else if (info.type === "rotate") {
      const stickerEl = document.getElementById(`sticker-${info.id}`);
      if (stickerEl) {
        const rect = stickerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        setPlacedStickers(prev => prev.map(s => s.id === info.id ? { ...s, rotation: angle * (180 / Math.PI) + 90 } : s));
      }
    }
  }, []);

  const onGlobalMouseUp = useCallback(() => { dragInfo.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onGlobalMouseMove);
    window.addEventListener("mouseup", onGlobalMouseUp);
    return () => { window.removeEventListener("mousemove", onGlobalMouseMove); window.removeEventListener("mouseup", onGlobalMouseUp); };
  }, [onGlobalMouseMove, onGlobalMouseUp]);

  return (
    <main className="relative flex h-screen flex-col items-center pt-4 overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* 0. PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex flex-shrink-0">
        <div className="h-full w-[95%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* 1. HEADER (DIEM) */}
      <div className="w-full flex justify-center items-center mt-6 mb-10 z-10 px-4 relative flex-shrink-0">
        <div className="flex flex-col items-center">
           <p className="font-hind font-semibold text-[20px] text-[#3E8C7B] tracking-[-0.08em]" style={{ textShadow: '0px 5px 4px rgba(0, 0, 0, 0.25)' }}>Sentuhan Akhir</p>
           <h1 className="font-inter font-bold text-[40px] md:text-[48px] text-[#434343] text-center tracking-[-0.05em] leading-[58px]">Filter & Stiker</h1>
        </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="w-full max-w-[1500px] flex-1 flex flex-row gap-12 justify-center px-4 md:px-8 overflow-hidden pb-4">
        
        {/* === SISI KIRI: PREVIEW FRAME (DIEM) === */}
        <div className="flex flex-col items-center flex-shrink-0 h-full z-30 w-[320px]">
          <div className="w-[200px] h-[44px] bg-[#393B3A] border-[1px] border-[#ACFFC1] rounded-[19.5px] flex relative shadow-sm mb-4 self-center overflow-hidden">
            <div className="absolute top-1/2 -translate-y-1/2 h-[34px] w-[95px] bg-[#FFA600] rounded-[14px] transition-all duration-300 pointer-events-none" style={{ left: isBefore ? '5px' : '98px' }} />
            <button onClick={() => setIsBefore(true)} className={`flex-1 flex items-center justify-center z-10 font-inter font-bold italic text-[14px] transition-colors ${isBefore ? 'text-[#343030]' : 'text-[#6A6868]'}`}>SEBELUM</button>
            <button onClick={() => setIsBefore(false)} className={`flex-1 flex items-center justify-center z-10 font-inter font-bold italic text-[14px] transition-colors ${!isBefore ? 'text-[#343030]' : 'text-[#6A6868]'}`}>SESUDAH</button>
          </div>

          <div className="relative">
            {/* FRAME DIKECILIN DIKIT (270x650) BIAR GAK KEPOTONG */}
            <div className="w-[270px] h-[650px] bg-white border-[1.5px] border-[#54868A] rounded-[17px] flex items-center justify-center shadow-md p-4">
              <div className="w-[230px] h-[620px] bg-[#545151] border-[1.5px] border-[#54868A] rounded-[11px] flex items-center justify-center relative overflow-hidden">
                <div ref={frameRef} className="relative w-full h-full">
                  <div className="absolute inset-0 z-10 transition-all duration-300" style={{ filter: getFilterCSS(), ...currentFrame.overlayStyle }}>
                    {photoSlots.map((slot, index) => (
                      <div key={index} className="w-full h-full bg-[#979797] rounded-[6px] overflow-hidden flex items-center justify-center border-[1.5px] border-[#54868A]">
                        {slot.photo ? <img src={slot.photo} className="w-full h-full object-cover" alt="Slot" /> : <span className="text-[#264E45] font-hind font-bold text-[36px] opacity-30">{index + 1}</span>}
                      </div>
                    ))}
                  </div>
                  <img src={currentFrame.image} className="absolute inset-0 w-full h-full object-stretch z-20 pointer-events-none" alt="Frame" />
                  <div className="absolute inset-0 z-30 pointer-events-none">
                    {!isBefore && placedStickers.map(s => (
                      <div key={s.id} id={`sticker-${s.id}`} className="absolute pointer-events-auto select-none group" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}px`, height: `${s.size}px`, transform: `translate(-50%, -50%) rotate(${s.rotation}deg)` }}>
                        <div className="w-full h-full border-2 border-transparent group-hover:border-[#00FFA2] flex items-center justify-center cursor-grab active:cursor-grabbing" onMouseDown={(e) => onStartAction(e, s, "move")}>
                          {s.emoji.length > 2 ? <span style={{ fontSize: `${s.size * 0.4}px`, fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{s.emoji}</span> : <span style={{ fontSize: `${s.size * 0.8}px` }}>{s.emoji}</span>}
                        </div>
                        <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 w-6 h-6 bg-[#00FFA2] rounded-full cursor-alias opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md" onMouseDown={(e) => onStartAction(e, s, "rotate")}><span className="text-[12px] text-black">⟳</span></div>
                        <div className="absolute bottom-[-5px] right-[-5px] w-5 h-5 bg-[#00FFA2] rounded-sm cursor-nwse-resize opacity-0 group-hover:opacity-100 shadow-md" onMouseDown={(e) => onStartAction(e, s, "resize")} />
                        <button onClick={(e) => {e.stopPropagation(); removeSticker(s.id)}} className="absolute top-[-15px] left-[-15px] w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[12px] text-white opacity-0 group-hover:opacity-100 shadow-md">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === SISI KANAN: WORKSPACE KONTROL (SCROLLABLE AREA) === */}
        <div className="flex flex-col gap-6 w-[856px] flex-shrink-0 h-full overflow-y-auto no-scrollbar pb-10 pr-2 relative z-40 pointer-events-auto">
          
          {/* BOX 1: FILTER */}
          <div className="w-full h-[367px] flex-shrink-0 bg-white border-[1.5px] border-[#54868A] rounded-[17px] p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center px-2 mb-4">
               <h2 className="font-inter font-bold text-[25px] tracking-[-0.05em] text-[#434343] leading-none uppercase">Filter</h2>
               <span className="font-hind font-semibold text-[18px] tracking-[-0.08em] text-[#3E8C7B]">9 Pilihan</span>
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 px-2">
              {filters.map(f => {
                const isActive = selectedFilter === f;
                return (
                  <button key={f} onClick={() => setSelectedFilter(f)} className={`w-full h-[40px] rounded-[20px] border-[1.5px] font-inter font-bold italic text-[16px] tracking-[-0.02em] transition-all flex items-center justify-center shadow-sm ${isActive ? "bg-[#499F84] text-white border-[#54868A]" : "bg-white text-[#585858] border-[#54868A] hover:bg-[#F5F5F5]"}`}>
                    {isActive && f === "ORIGINAL" && <span className="mr-2 text-white">★</span>}
                    {f}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col gap-2 mt-auto px-2 pb-2">
              <div className="flex justify-between items-end">
                <span className="font-inter font-bold text-[23px] text-[#434343] tracking-[-0.05em]">Intensitas Filter</span>
                <span className="font-inter font-bold text-[18px] text-[#BF7D32] tracking-[-0.05em]">{filterIntensity} %</span>
              </div>
              <div className="relative w-full h-[40px] flex items-center mt-2">
                <div className="absolute w-full h-[20px] rounded-[80px] top-1/2 -translate-y-1/2" style={{ background: 'linear-gradient(90deg, #442C18 0%, #FF9100 100%)' }}></div>
                <div className="absolute w-[40px] h-[40px] bg-[#F3AF6F] border-[2px] border-black rounded-full pointer-events-none z-10 shadow-md top-0" style={{ left: `calc(${filterIntensity}% - 20px)` }}></div>
                <input type="range" min="0" max="100" value={filterIntensity} onChange={(e) => setFilterIntensity(Number(e.target.value))} className="w-full h-full absolute opacity-0 cursor-pointer z-20 m-0 p-0" />
              </div>
            </div>
          </div>

          {/* BOX 2: STIKER */}
          <div className="w-full h-[351px] flex-shrink-0 bg-white border-[1.5px] border-[#54868A] rounded-[17px] p-6 flex flex-col shadow-sm">
             <div className="flex justify-between items-center px-2 mb-4">
               <h2 className="font-inter font-bold text-[25px] tracking-[-0.05em] text-[#434343] leading-none uppercase">STIKER</h2>
               <span className="font-hind font-semibold text-[18px] tracking-[-0.08em] text-[#3E8C7B]">{placedStickers.length} stiker terpasang.</span>
            </div>
            <div className="flex gap-4 px-2 mb-4">
              {stickerCategories.map(cat => {
                const isActive = stickerCategory === cat.name;
                return (
                  <button key={cat.name} onClick={() => setStickerCategory(cat.name)} className={`w-[120px] h-[36px] rounded-[20px] border-[1.5px] border-[#54868A] font-inter font-bold italic text-[14px] tracking-[-0.02em] transition-all flex items-center justify-center gap-2 shadow-sm ${isActive ? "bg-[#499F84] text-white" : "bg-white text-[#585858] hover:bg-gray-50"}`}>
                    <span>{cat.icon}</span> {cat.name}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-1 overflow-hidden px-2 gap-4">
              <div ref={scrollRef} onScroll={() => setScrollProgress(scrollRef.current ? scrollRef.current.scrollTop / (scrollRef.current.scrollHeight - scrollRef.current.clientHeight) : 0)} className="flex-1 grid grid-cols-5 gap-4 overflow-y-auto no-scrollbar content-start pb-2">
                {stickersMap[stickerCategory].map((s, i) => (
                  <button key={i} onClick={() => addSticker(s)} className="w-[120px] h-[120px] bg-white border-[1.5px] border-[#54868A] rounded-[20px] text-5xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center">{s}</button>
                ))}
              </div>
              <div className="w-[14px] h-full bg-[#7A7A7A] rounded-[69px] relative flex justify-center py-1 flex-shrink-0">
                <div className="w-[14px] h-[80px] bg-[#51B4AF] rounded-[69px] absolute transition-all duration-75" style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 80}px)` }} />
              </div>
            </div>
          </div>

          {/* BOX 3: PRESET COMBO */}
          <div className="w-full h-[453px] flex-shrink-0 bg-white border-[1.5px] border-[#54868A] rounded-[17px] p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center px-2 mb-6">
                <h2 className="font-inter font-bold text-[25px] tracking-[-0.05em] text-[#434343] leading-none uppercase">PRESET COMBO</h2>
                <span className="font-hind font-semibold text-[18px] tracking-[-0.08em] text-[#3E8C7B]">4 option ready</span>
            </div>
            <div className="grid grid-cols-2 gap-4 px-2 flex-1">
              <button onClick={() => applyPreset('FAMILY')} className="w-full h-[155px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-3 flex flex-col cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform shadow-sm group text-left">
                <div className="w-full h-[66px] rounded-[16px] mb-3 opacity-90 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #FED2A3 0%, #FDB68A 100%)' }}></div>
                <div className="px-2 flex flex-col justify-center">
                    <h4 className="font-inter font-bold text-[20px] tracking-[-0.05em] text-[#434343] leading-none flex items-center gap-2"><span className="text-lg">👨‍👩‍👧‍👦</span> FAMILY</h4>
                    <p className="font-inter font-normal text-[14px] tracking-[-0.05em] text-[#434343] mt-1">Warm + Soft + Love stickers</p>
                </div>
              </button>
              <button onClick={() => applyPreset('PARTY')} className="w-full h-[155px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-3 flex flex-col cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform shadow-sm group text-left">
                <div className="w-full h-[66px] rounded-[16px] mb-3 opacity-90 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #F8B2DA 0%, #BE8FF8 100%)' }}></div>
                <div className="px-2 flex flex-col justify-center">
                    <h4 className="font-inter font-bold text-[20px] tracking-[-0.05em] text-[#434343] leading-none flex items-center gap-2"><span className="text-lg">🎉</span> PARTY</h4>
                    <p className="font-inter font-normal text-[14px] tracking-[-0.05em] text-[#434343] mt-1">Vivid + Party stickers</p>
                </div>
              </button>
              <button onClick={() => applyPreset('CINEMA')} className="w-full h-[155px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-3 flex flex-col cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform shadow-sm group text-left">
                <div className="w-full h-[66px] rounded-[16px] mb-3 opacity-90 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #556A69 0%, #293933 100%)' }}></div>
                <div className="px-2 flex flex-col justify-center">
                    <h4 className="font-inter font-bold text-[20px] tracking-[-0.05em] text-[#434343] leading-none flex items-center gap-2"><span className="text-lg">🎬</span> CINEMA</h4>
                    <p className="font-inter font-normal text-[14px] tracking-[-0.05em] text-[#434343] mt-1">Drama + Vignette</p>
                </div>
              </button>
              <button onClick={() => applyPreset('VINTAGE')} className="w-full h-[155px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-3 flex flex-col cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform shadow-sm group text-left">
                <div className="w-full h-[66px] rounded-[16px] mb-3 opacity-90 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #CF9F5E 0%, #957445 100%)' }}></div>
                <div className="px-2 flex flex-col justify-center">
                    <h4 className="font-inter font-bold text-[20px] tracking-[-0.05em] text-[#434343] leading-none flex items-center gap-2"><span className="text-lg">📻</span> VINTAGE</h4>
                    <p className="font-inter font-normal text-[14px] tracking-[-0.05em] text-[#434343] mt-1">Sepia + Film grain</p>
                </div>
              </button>
            </div>
          </div>

          <div className="w-full flex justify-end mt-4 mb-20 flex-shrink-0">
            <button 
              onClick={handleLihatHasil}
              className="w-[250px] h-[49px] rounded-[23px] border-[3px] border-[#318570] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg"
              style={{ background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)' }}
            >
              <span className="font-inter font-medium italic text-[16px] md:text-[20px] text-[#1D4F42] tracking-[-0.06em] whitespace-nowrap">Lihat Hasil</span>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l5 7-5 7" /></svg>
            </button>
          </div>
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

export default function FilterStickerPage() {
  return <Suspense><FilterStickerContent /></Suspense>;
}