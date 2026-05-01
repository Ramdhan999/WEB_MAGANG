"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// Dummy data foto hasil jepretan sebelumnya
const initialPhotos = Array.from({ length: 10 }).map((_, i) => ({
  id: `photo-${i + 1}`,
  bg: `hsl(${i * 45}, 60%, 45%)`, 
}));

const templatesData = [
  { 
    id: 't4', 
    title: 'Classic Strip', 
    slots: 4, 
    bg: 'bg-[#1A2E2D]', 
    frameClass: 'w-[180px] h-[500px] flex flex-col gap-2 p-2' 
  },
];

export default function PrintReviewPage() {
  const router = useRouter();
  const [photos] = useState(initialPhotos);
  const [activeTemplate] = useState(templatesData[0]);
  
  const [slots, setSlots] = useState<any[]>([]);
  const [draggedPhoto, setDraggedPhoto] = useState<any>(null);
  const [scrollPos, setScrollPos] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Inisialisasi slot kosong sesuai template
  useEffect(() => {
    setSlots(Array.from({ length: activeTemplate.slots }).map((_, i) => ({ 
      id: `slot-${i + 1}`, 
      photo: null 
    })));
  }, [activeTemplate]);

  const handleDragStart = (e: React.DragEvent, photo: any) => {
    if (slots.some(s => s.photo?.id === photo.id)) {
      e.preventDefault();
      return;
    }
    setDraggedPhoto(photo);
  };

  const handleDrop = (slotId: string) => {
    if (!draggedPhoto) return;
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, photo: draggedPhoto } : s));
    setDraggedPhoto(null);
  };

  const removePhoto = (slotId: string) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, photo: null } : s));
  };

  const saveAndNext = () => {
    // Simpan susunan foto ke localStorage untuk halaman Filter & Result
    localStorage.setItem("arranged_slots", JSON.stringify(slots));
    router.push("/filter"); 
  };

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-8 pb-12" 
      style={{ background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)' }}
    >
      {/* Progress Bar (90%) */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[90%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* --- HEADER --- */}
      <div className="w-full flex flex-col items-center mt-4 mb-8 z-10 px-4">
        <div className="flex items-center justify-center gap-3 mb-6 shadow-lg bg-[#476A53] border border-[#85DDA6] rounded-[28px] w-[272px] h-[56px]">
          <div className="w-[31px] h-[31px] bg-white" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)' }}></div>
          <span className="font-inter font-bold text-[24px]" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Atur Frame</span>
        </div>
        <h1 className="font-inter font-bold text-[48px] tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Pilih Foto untuk Slot</h1>
      </div>

      {/* --- MAIN AREA --- */}
      <div className="w-full max-w-[1300px] flex gap-10 justify-center z-10 px-4">
        
        {/* KIRI: PREVIEW FRAME */}
        <div className="flex flex-col gap-3">
          <h2 className="font-hind font-semibold text-[22px] text-[#3E8C7B] ml-2">PREVIEW FRAME</h2>
          <div className="w-[511px] h-[580px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[24px] flex items-center justify-center p-4 shadow-xl overflow-hidden">
            <div className={`${activeTemplate.bg} ${activeTemplate.frameClass} rounded-[12px] shadow-2xl overflow-hidden`}>
              {slots.map((slot, i) => (
                <div 
                  key={slot.id} 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={() => handleDrop(slot.id)} 
                  className={`w-full h-full bg-[#223736] border-[2px] rounded-[8px] flex items-center justify-center relative overflow-hidden transition-all ${!slot.photo ? 'border-dashed border-[#85DDA6]' : 'border-transparent'}`}
                >
                  {slot.photo ? (
                    <>
                      <div className="w-full h-full" style={{ backgroundColor: slot.photo.bg }}></div>
                      <button onClick={() => removePhoto(slot.id)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center z-30">
                        <span className="text-white font-bold text-[12px]">✕</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[32px] font-bold text-[#3E8C7B] opacity-40">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KANAN: DAFTAR FOTO */}
        <div className="flex flex-col gap-3">
          <h2 className="font-hind font-semibold text-[22px] text-[#3E8C7B] ml-2">FOTO TERPILIH</h2>
          <div className="flex gap-4 h-[580px]">
            <div 
              ref={scrollRef} 
              onScroll={() => setScrollPos(scrollRef.current ? scrollRef.current.scrollTop / (scrollRef.current.scrollHeight - scrollRef.current.clientHeight) : 0)} 
              className="grid grid-cols-3 gap-4 overflow-y-auto pr-4 content-start no-scrollbar"
            >
              {photos.map((p) => {
                const used = slots.some(s => s.photo?.id === p.id);
                return (
                  <div 
                    key={p.id} 
                    draggable={!used} 
                    onDragStart={(e) => handleDragStart(e, p)} 
                    className={`w-[160px] h-[110px] bg-[#2E4F4D] border border-[#54868A] rounded-[18px] relative overflow-hidden transition-all ${used ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:border-[#85DDA6]'}`}
                  >
                    <div className="w-full h-full" style={{ backgroundColor: p.bg }}></div>
                    {used && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-[#00FFA2] rounded-full flex items-center justify-center shadow-lg">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Custom Scrollbar */}
            <div className="w-[12px] h-full bg-[#2E4F4D] border border-[#54868A] rounded-[23px] relative flex justify-center">
              <div className="w-[10px] h-[80px] bg-[#72DDD8] rounded-[23px] absolute transition-all duration-75" style={{ top: `${scrollPos * (580 - 80)}px` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BUTTONS --- */}
      <div className="mt-12 flex gap-8 z-10">
        <button 
          onClick={() => router.back()} 
          className="w-[317px] h-[74px] bg-[#224C42] border-[3px] border-[#318570] rounded-[23px] flex items-center justify-center gap-4 hover:bg-[#1C3D35] active:scale-95 transition-all group"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#122A24" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H9M12 17l-5-5 5-5" />
          </svg>
          <span className="font-inter font-bold italic text-[24px] text-[#122A24]">Kembali</span>
        </button>

        <button 
          onClick={saveAndNext} 
          className="w-[317px] h-[74px] rounded-[23px] flex items-center justify-center gap-4 shadow-xl hover:scale-105 active:scale-95 transition-all" 
          style={{ background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)', border: '3px solid #318570' }}
        >
          <span className="font-inter font-bold italic text-[24px] text-[#1D4F42]">Filter & Stiker</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l5 7-5 7" />
          </svg>
        </button>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}