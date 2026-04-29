"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Dummy data 10 foto yang dipilih
const initialPhotos = Array.from({ length: 10 }).map((_, i) => ({
  id: `photo-${i + 1}`,
  bg: `hsl(${i * 45}, 60%, 40%)`, 
}));

const templatesData = [
  { id: 't4', title: 'Classic Strip', slots: 4, type: 'strip', bg: 'bg-[#1A2E2D]', frameClass: 'w-[160px] h-[480px] flex flex-col gap-2 p-2' },
  { id: 't1', title: 'Imlek Lantern', slots: 3, type: 'strip', bg: 'bg-[#C1301F]', frameClass: 'w-[160px] h-[480px] flex flex-col gap-3 p-3' },
  { id: 't5', title: 'Retro Grid 2x2', slots: 4, type: 'grid', bg: 'bg-[#2A4B44]', frameClass: 'w-[320px] h-[450px] grid grid-cols-2 grid-rows-2 gap-3 p-3' },
];

export default function PrintReviewPage() {
  const router = useRouter();
  const [photos] = useState(initialPhotos);
  const [activeTemplateId] = useState<string>(templatesData[0].id);
  const activeTemplate = templatesData.find(t => t.id === activeTemplateId) || templatesData[0];
  
  const [slots, setSlots] = useState<any[]>([]);
  const [draggedPhoto, setDraggedPhoto] = useState<any>(null);

  useEffect(() => {
    setSlots(Array.from({ length: activeTemplate.slots }).map((_, i) => ({ id: `slot-${i + 1}`, photo: null })));
  }, [activeTemplate]);

  // FUNGSI SIMPAN: Biar datanya kebawa ke halaman sebelah
  const saveAndNext = () => {
    localStorage.setItem("arranged_slots", JSON.stringify(slots));
    router.push("/filter");
  };

  const isPhotoUsed = (photoId: string) => slots.some(s => s.photo?.id === photoId);
  const filledSlotsCount = slots.filter(slot => slot.photo !== null).length;

  const handleDragStart = (e: React.DragEvent, photo: any) => {
    if (isPhotoUsed(photo.id)) {
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-8 pb-12" style={{ background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)' }}>
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[90%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'scaleX(-1)' }}></div>
      </div>

      {/* --- HEADER SECTION (CSS LOCK) --- */}
      <div className="w-full flex flex-col items-center mt-4 mb-8 z-10 px-4">
        <div style={{ width: '272px', height: '56px', background: '#476A53', border: '1px solid #85DDA6', borderRadius: '28px' }} className="flex items-center justify-center gap-3 mb-6 shadow-lg">
          <div style={{ width: '31px', height: '31px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
          <span style={{ width: '201px', height: '29px', fontFamily: 'Inter', fontWeight: 700, fontSize: '24px', lineHeight: '29px', textAlign: 'center', background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Atur Frame</span>
        </div>
        <p style={{ width: '232px', height: '35px', fontFamily: 'Hind Vadodara', fontWeight: 600, fontSize: '24px', lineHeight: '36px', textAlign: 'center', letterSpacing: '-0.08em', color: '#3E8C7B', textShadow: '0px 5px 4px rgba(0, 0, 0, 0.25)' }}>Atur posisi fotomu!</p>
        <h1 style={{ width: '607px', height: '64px', fontFamily: 'Inter', fontWeight: 700, fontSize: '48px', lineHeight: '58px', textAlign: 'center', letterSpacing: '-0.05em', background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} className="mb-4">Pilih Foto untuk Slot Frame</h1>
        <div className="flex items-center gap-4">
          <div style={{ width: '123px', height: '7px', background: '#6AC5C3', borderRadius: '12px' }}></div>
          <div style={{ width: '26px', height: '26px', background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
          <div style={{ width: '123px', height: '7px', background: '#6AC5C3', borderRadius: '12px' }}></div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="w-full max-w-[1300px] flex gap-10 justify-center z-10 px-4">
        {/* Preview Frame */}
        <div className="flex flex-col gap-2">
          <h2 className="font-hind font-semibold text-[22px] text-[#3E8C7B]">PREVIEW FRAME</h2>
          <div className="w-[511px] h-[520px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[24px] flex items-center justify-center p-4 shadow-xl">
            <div className={`${activeTemplate.bg} ${activeTemplate.frameClass} rounded-[12px] shadow-2xl`}>
              {slots.map((slot, i) => (
                <div key={slot.id} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(slot.id)} className={`w-full h-full bg-[#223736] border-[2px] rounded-[8px] flex items-center justify-center relative overflow-hidden transition-all ${!slot.photo ? 'border-dashed border-[#85DDA6]' : 'border-transparent'}`}>
                  {slot.photo ? (
                    <>
                      <div className="w-full h-full" style={{ backgroundColor: slot.photo.bg }}></div>
                      <button onClick={() => removePhoto(slot.id)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center z-30 shadow-lg">
                        <span className="text-white font-bold text-[14px]">✕</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[32px] font-bold text-[#3E8C7B] opacity-40">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="w-[511px] h-[64px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[24px] flex items-center justify-center font-hind text-[20px] text-[#3E8C7B]">
            {filledSlotsCount} / {activeTemplate.slots} Slot foto terisi
          </div>
        </div>

        {/* Daftar Foto */}
        <div className="flex flex-col gap-2 relative">
          <h2 className="font-hind font-semibold text-[22px] text-[#3E8C7B]">FOTO TERPILIH</h2>
          <div className="flex gap-4 h-[520px]">
            <div ref={scrollRef} onScroll={() => setScrollPos(scrollRef.current ? scrollRef.current.scrollTop / (scrollRef.current.scrollHeight - scrollRef.current.clientHeight) : 0)} className="grid grid-cols-3 gap-4 overflow-y-auto pr-4 content-start custom-scroll-hidden">
              {photos.map((p) => {
                const used = isPhotoUsed(p.id);
                return (
                  <div key={p.id} draggable={!used} onDragStart={(e) => handleDragStart(e, p)} className={`w-[180px] h-[120px] bg-[#2E4F4D] border border-[#54868A] rounded-[18px] relative overflow-hidden transition-all ${used ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:border-[#85DDA6]'}`}>
                    <div className="w-full h-full" style={{ backgroundColor: p.bg }}></div>
                    {used && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                         <div className="w-10 h-10 bg-[#00FFA2] rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="w-[12px] h-full bg-[#2E4F4D] border border-[#54868A] rounded-[23px] relative flex justify-center">
              <div className="w-[12px] h-[96px] bg-[#72DDD8] rounded-[23px] absolute transition-all duration-75" style={{ top: `${scrollPos * (520 - 96)}px` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex gap-8 z-10">
        <button onClick={() => router.back()} className="w-[317px] h-[74px] bg-[#224C42] border-[3px] border-[#318570] rounded-[23px] flex items-center justify-center gap-4 hover:bg-[#1C3D35] transition-all">
          <span className="font-inter font-bold italic text-[24px] text-[#122A24]">Kembali</span>
        </button>

        {/* Pindah ke Filter & Stiker sambil bawa data */}
        <button onClick={saveAndNext} className="w-[317px] h-[74px] rounded-[23px] flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(72,197,166,0.3)]" style={{ background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)', border: '3px solid #318570' }}>
          <span className="font-inter font-bold italic text-[24px] text-[#1D4F42]">Filter & Stiker</span>
        </button>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@600&family=Inter:ital,wght@0,700;1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .custom-scroll-hidden::-webkit-scrollbar { display: none; }
        .custom-scroll-hidden { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}