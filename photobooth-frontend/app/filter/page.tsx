"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PlacedSticker {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  emoji: string;
}

export default function FilterStickerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"filter" | "sticker">("filter");
  const [selectedFilter, setSelectedFilter] = useState("Original");
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [photoSlots, setPhotoSlots] = useState<any[]>([]);

  const frameRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{
    id: number;
    type: "move" | "resize" | "rotate";
    startX: number;
    startY: number;
    startSize: number;
    startLeft: number;
    startTop: number;
    startRotation: number;
  } | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("arranged_slots");
    if (savedData) {
      setPhotoSlots(JSON.parse(savedData));
    }
  }, []);

  const filters = ["Original", "Noir", "Vintage", "Vivid", "Warm", "Cool", "Drama", "Soft", "Film"];
  const stickers = ["😊", "😎", "❤️", "⭐", "🔥", "✨", "🎉", "🍀"];

  const addSticker = (emoji: string) => {
    const newSticker = { id: Date.now(), x: 50, y: 50, size: 60, rotation: 0, emoji };
    setPlacedStickers([...placedStickers, newSticker]);
  };

  const removeSticker = (id: number) => {
    setPlacedStickers(placedStickers.filter(s => s.id !== id));
  };

  // Logic Simpan Data sebelum pindah halaman
  const handleLihatHasil = () => {
    localStorage.setItem("applied_filter", selectedFilter);
    localStorage.setItem("applied_stickers", JSON.stringify(placedStickers));
    router.push("/result");
  };

  const getFilterCSS = () => {
    switch (selectedFilter) {
      case "Noir": return "grayscale(100%) contrast(120%)";
      case "Vintage": return "sepia(60%) contrast(90%)";
      case "Vivid": return "saturate(180%)";
      case "Warm": return "sepia(30%) saturate(140%)";
      case "Cool": return "hue-rotate(30deg) saturate(120%)";
      default: return "none";
    }
  };

  const onStartAction = (e: React.MouseEvent, s: PlacedSticker, type: "move" | "resize" | "rotate") => {
    e.stopPropagation();
    e.preventDefault();
    dragInfo.current = {
      id: s.id, type, startX: e.clientX, startY: e.clientY,
      startSize: s.size, startLeft: s.x, startTop: s.y, startRotation: s.rotation
    };
  };

  const onGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!dragInfo.current || !frameRef.current) return;
    const info = dragInfo.current;
    const frameRect = frameRef.current.getBoundingClientRect();

    if (info.type === "move") {
      const dx = ((e.clientX - info.startX) / frameRect.width) * 100;
      const dy = ((e.clientY - info.startY) / frameRect.height) * 100;
      setPlacedStickers(prev => prev.map(s => s.id === info.id ? {
        ...s, 
        x: info.startLeft + dx,
        y: info.startTop + dy
      } : s));
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
    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      window.removeEventListener("mouseup", onGlobalMouseUp);
    };
  }, [onGlobalMouseMove, onGlobalMouseUp]);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden text-white pt-8 pb-12" style={{ background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)' }}>
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[95%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* HEADER */}
      <div className="flex flex-col items-center mt-4 z-10 px-4">
        <div style={{ width: '272px', height: '56px', background: '#476A53', border: '1px solid #85DDA6', borderRadius: '28px' }} className="flex items-center justify-center gap-3 mb-2 shadow-lg">
          <div style={{ width: '31px', height: '31px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
          <span className="font-inter font-bold text-[24px]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Filter & Stiker</span>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-6 mt-4 mb-6">
          <button onClick={() => setActiveTab("filter")} className={`flex items-center justify-center gap-3 w-[180px] h-[54px] rounded-[23px] border-[1.5px] transition-all ${activeTab === "filter" ? "bg-[#33817D] border-[#90C8CC] shadow-[0_0_15px_#33817D]" : "bg-[#224442] border-[#54868A]"}`}>
            <span className="text-xl">🎨</span>
            <span className={`font-hind font-semibold text-[20px] ${activeTab === "filter" ? "text-[#2BD7B2]" : "text-[#3E8C7B]"}`}>FILTER</span>
          </button>
          <button onClick={() => setActiveTab("sticker")} className={`flex items-center justify-center gap-3 w-[180px] h-[54px] rounded-[23px] border-[1.5px] transition-all ${activeTab === "sticker" ? "bg-[#33817D] border-[#90C8CC] shadow-[0_0_15px_#33817D]" : "bg-[#224442] border-[#54868A]"}`}>
            <span className="text-xl">✨</span>
            <span className={`font-hind font-semibold text-[20px] ${activeTab === "sticker" ? "text-[#2BD7B2]" : "text-[#3E8C7B]"}`}>STIKER</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA */}
      <div className="relative w-full flex items-center justify-center gap-12 mt-2 z-10 px-10">
        
        {/* Tombol Kembali */}
        <button onClick={() => router.back()} style={{ width: '280px', height: '70px', background: '#224C42', border: '3px solid #318570', borderRadius: '23px' }} className="flex items-center justify-center gap-4 hover:brightness-110 active:scale-95 transition-all">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#122A24" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H9M12 17l-5-5 5-5" /></svg>
           <span className="font-inter font-bold italic text-[24px] text-[#122A24]">Kembali</span>
        </button>

        {/* AREA FRAME PREVIEW */}
        {/* div ini sekarang punya overflow-hidden */}
        <div 
          ref={frameRef} 
          style={{ width: '220px', height: '580px', background: '#1A2E2D', border: '4px solid #1A2E2D', borderRadius: '12px' }} 
          className="relative flex flex-col gap-2 p-2 shadow-2xl overflow-hidden transition-all"
        >
          {/* Layer Foto dengan Filter */}
          <div className="w-full h-full flex flex-col gap-2 transition-all" style={{ filter: getFilterCSS() }}>
            {photoSlots.map((slot, i) => (
              <div key={i} className="flex-grow rounded-sm shadow-inner" style={{ backgroundColor: slot.photo ? slot.photo.bg : '#223736' }}></div>
            ))}
          </div>

          {/* Layer Stiker di DALAM container overflow-hidden */}
          <div className="absolute inset-0 pointer-events-none">
            {placedStickers.map(s => (
              <div 
                key={s.id} 
                id={`sticker-${s.id}`} 
                className="absolute pointer-events-auto select-none group" 
                style={{ 
                  left: `${s.x}%`, 
                  top: `${s.y}%`, 
                  width: `${s.size}px`, 
                  height: `${s.size}px`, 
                  transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`, 
                  zIndex: 100 
                }}
              >
                <div className="w-full h-full border-2 border-transparent group-hover:border-[#00FFA2] flex items-center justify-center cursor-grab active:cursor-grabbing" onMouseDown={(e) => onStartAction(e, s, "move")}>
                  <span style={{ fontSize: `${s.size * 0.8}px` }}>{s.emoji}</span>
                </div>
                {/* Controls */}
                <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 w-5 h-5 bg-[#00FFA2] rounded-full cursor-alias opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md" onMouseDown={(e) => onStartAction(e, s, "rotate")}>
                  <span className="text-[10px] text-black">⟳</span>
                </div>
                <div className="absolute bottom-[-5px] right-[-5px] w-4 h-4 bg-[#00FFA2] rounded-sm cursor-nwse-resize opacity-0 group-hover:opacity-100 shadow-md" onMouseDown={(e) => onStartAction(e, s, "resize")} />
                <button onClick={(e) => {e.stopPropagation(); removeSticker(s.id)}} className="absolute top-[-15px] left-[-15px] w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 shadow-md">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Tombol Lihat Hasil */}
        <button 
          onClick={handleLihatHasil}
          style={{ width: '280px', height: '70px', background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)', border: '3px solid #318570', borderRadius: '23px' }} 
          className="flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <span className="font-inter font-bold italic text-[24px] text-[#1D4F42]">Lihat Hasil</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l5 7-5 7" /></svg>
        </button>
      </div>

      {/* Menu Bawah */}
      <div className="mt-12 z-10 w-full max-w-[1100px] flex flex-col items-center">
        {activeTab === "filter" ? (
          <div className="flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            {filters.map(f => (
              <button key={f} onClick={() => setSelectedFilter(f)} style={{ width: '130px', height: '45px', background: selectedFilter === f ? '#33817D' : '#224442', border: '1.5px solid #54868A', borderRadius: '23px' }} className="font-hind font-semibold text-[16px] text-white/90">{f}</button>
            ))}
          </div>
        ) : (
          <div className="flex gap-6 p-4 bg-[#233534] rounded-[23px] border border-[#54868A] shadow-inner animate-in fade-in slide-in-from-bottom-4">
            {stickers.map((s, i) => (
              <button key={i} onClick={() => addSticker(s)} className="text-4xl hover:scale-110 active:scale-90 transition-transform">{s}</button>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@600&family=Inter:ital,wght@0,700;1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
    </main>
  );
}