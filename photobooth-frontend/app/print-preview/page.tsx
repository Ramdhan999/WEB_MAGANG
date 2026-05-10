"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PrintReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const frameId = searchParams.get('frame') || 't4';

  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [slots, setSlots] = useState<{ id: number; photo: string | null }[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const frameConfigs: Record<string, { image: string; slots: number; overlayStyle: any }> = {
    't1': { image: '/IMLEK 1.png', slots: 2, overlayStyle: { top: '18%', height: '62%', left: '11%', right: '11%', display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: '20px' } },
    't2': { image: '/IMLEK 2.png', slots: 3, overlayStyle: { top: '14%', height: '70%', left: '11%', right: '11%', display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '15px' } },
    't3': { image: '/IMLEK 3.png', slots: 3, overlayStyle: { top: '12%', height: '74%', left: '10%', right: '10%', display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '12px' } },
    't4': { image: '/PIXEL 1.png', slots: 3, overlayStyle: { top: '11.5%', height: '73.5%', left: '11%', right: '11%', display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '14px' } },
  };

  const currentFrame = frameConfigs[frameId] || frameConfigs['t4'];

  useEffect(() => {
    const savedPhotos = JSON.parse(localStorage.getItem('user_captured_photos') || '[]');
    if (savedPhotos.length > 0) {
      setCapturedPhotos(savedPhotos.filter((p: string | null) => p !== null));
    } else {
      setCapturedPhotos(Array.from({ length: 16 }).map((_, i) => `https://picsum.photos/seed/${i + 800}/1200/800`));
    }
  }, []);

  // FIX: Coba load data dari storage dulu biar ga reset pas di-klik KEMBALI
  useEffect(() => {
    const savedSlots = localStorage.getItem("arranged_slots");
    if (savedSlots) {
      const parsed = JSON.parse(savedSlots);
      if (parsed.length === currentFrame.slots) {
        setSlots(parsed);
        return;
      }
    }
    setSlots(Array.from({ length: currentFrame.slots }).map((_, i) => ({ id: i + 1, photo: null })));
  }, [currentFrame.slots]);

  const handlePhotoClick = (photoUrl: string) => {
    if (slots.some(s => s.photo === photoUrl)) return;
    const firstEmptyIndex = slots.findIndex(s => s.photo === null);
    if (firstEmptyIndex !== -1) {
      const updatedSlots = [...slots];
      updatedSlots[firstEmptyIndex].photo = photoUrl;
      setSlots(updatedSlots);
    }
  };

  const removePhotoFromSlot = (slotId: number) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, photo: null } : s));
  };

  const isComplete = slots.every(s => s.photo !== null);

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-4 pb-10 overflow-x-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[85%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      <div className="w-full flex justify-center items-center mt-6 mb-10 z-10 px-4 relative min-h-[100px]">
        <div className="flex flex-col items-center">
           <p className="font-hind font-semibold text-[24px] text-[#3E8C7B] drop-shadow-sm">Atur posisi fotomu!</p>
           <h1 className="font-inter font-bold text-[36px] md:text-[48px] text-[#737373] text-center tracking-tight">Pilih {currentFrame.slots} Foto untuk Slot Frame</h1>
        </div>
      </div>

      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-12 items-start justify-center px-6">
        
        {/* PREVIEW FRAME */}
        <div className="flex flex-col gap-4 items-center">
          <h2 className="font-hind font-semibold text-[24px] tracking-[-0.08em] text-[#3E8C7B] uppercase self-start ml-4 drop-shadow-md">Preview Frame</h2>
          <div className="w-[420px] h-[620px] bg-white border-[1.5px] border-[#54868A] rounded-[24px] flex items-center justify-center relative shadow-sm p-4">
            <div className="relative w-[180px] h-[520px]">
              <div className="absolute inset-0 z-10" style={currentFrame.overlayStyle}>
                {slots.map((slot) => (
                  <div key={slot.id} onClick={() => removePhotoFromSlot(slot.id)} className="w-full h-full bg-[#545151] overflow-hidden cursor-pointer relative group border border-[#54868A]/20">
                    {slot.photo && <img src={slot.photo} className="w-full h-full object-cover" alt="Selected" />}
                    {!slot.photo && <span className="absolute inset-0 flex items-center justify-center text-[#264E45] font-bold opacity-30 text-3xl drop-shadow-md">{slot.id}</span>}
                    {slot.photo && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">HAPUS</div>}
                  </div>
                ))}
              </div>
              <img src={currentFrame.image} className="absolute inset-0 w-full h-full object-stretch z-20 pointer-events-none" alt="Frame" />
            </div>
          </div>
          <div className="w-[420px] h-[55px] bg-white border-[1.5px] border-[#CCAE19] rounded-full flex items-center justify-center shadow-sm">
            <span className="font-hind font-normal text-[22px] tracking-[-0.08em] text-[#FDAD00] drop-shadow-sm">{slots.filter(s => s.photo).length} / {currentFrame.slots} Slot foto terisi</span>
          </div>
        </div>

        {/* FOTO TERPILIH */}
        <div className="flex flex-col gap-4">
          <h2 className="font-hind font-semibold text-[24px] tracking-[-0.08em] text-[#3E8C7B] uppercase self-start ml-4 drop-shadow-md uppercase">({capturedPhotos.length}) Foto</h2>
          <div className="flex gap-4">
            <div className="w-[625px] h-[470px] bg-[#A9A6A6] border-[1.5px] border-[#54868A] rounded-[23px] p-6 relative shadow-inner">
              <div ref={scrollRef} onScroll={() => setScrollProgress(scrollRef.current ? scrollRef.current.scrollTop / (scrollRef.current.scrollHeight - scrollRef.current.clientHeight) : 0)} className="grid grid-cols-4 gap-4 h-full overflow-y-auto pr-2 no-scrollbar content-start">
                {capturedPhotos.map((photo, i) => {
                  const isUsed = slots.some(s => s.photo !== null && s.photo === photo);
                  return (
                    <div key={i} className="relative group aspect-[4/3]">
                      <div onClick={() => handlePhotoClick(photo)} className={`w-full h-full rounded-[15px] border-[1.5px] border-[#54868A] overflow-hidden bg-white transition-all ${isUsed ? 'opacity-50 scale-90' : 'cursor-pointer hover:scale-105 active:scale-95 shadow-sm'}`}>
                        <img src={photo} className="w-full h-full object-cover" alt="Captured" />
                        {isUsed && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-[#FBB400] rounded-full flex items-center justify-center border-2 border-white shadow-lg"><span className="text-white text-lg font-bold">✓</span></div>
                          </div>
                        )}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setPreviewPhoto(photo); }} className="absolute top-1 right-1 bg-white/90 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-30">🔍</button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="w-[12px] h-[439px] bg-[#202020] border-[1.5px] border-[#54868A] rounded-full relative flex justify-center mt-4">
              <div className="w-[12px] h-[96px] bg-[#006E68] border-[1.5px] border-[#54868A] rounded-full absolute transition-all duration-75" style={{ top: `${scrollProgress * (439 - 96)}px` }} />
            </div>
          </div>
          
           <div className="flex gap-10 mt-2 mb-4 self-start ml-4 font-hind font-semibold text-[18px] text-[#3E8C7B] tracking-[-0.08em]">
              <div className="flex items-center gap-3"><div className="w-7 h-7 bg-[#FBB400] rounded-full shadow-sm"></div><span>SUDAH TERPILIH</span></div>
              <div className="flex items-center gap-3"><div className="w-7 h-7 bg-[#5F5F5F] rounded-full shadow-sm"></div><span>BELUM TERPILIH</span></div>
           </div>

          <div className="w-full flex justify-center mt-12">
            <button 
              onClick={() => {
                localStorage.setItem("arranged_slots", JSON.stringify(slots));
                router.push(`/filter?frame=${frameId}`);
              }}
              disabled={!isComplete}
              className={`w-[250px] h-[49px] rounded-[23px] border-[3px] border-[#318570] italic font-inter font-medium text-[20px] text-[#1D4F42] tracking-[-0.06em] transition-all flex items-center justify-center gap-4 ${isComplete ? 'hover:scale-105 shadow-xl active:scale-95 cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'}`}
              style={{ background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)' }}
            >
              FILTER & STIKER
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l5 7-5 7" /></svg>
            </button>
          </div>

        </div>
      </div>

      {previewPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 animate-in zoom-in-95 duration-200" onClick={() => setPreviewPhoto(null)}>
          <img src={previewPhoto} className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border-4 border-white object-contain" alt="Full" />
          <p className="absolute bottom-8 text-white font-inter font-bold italic text-lg">Klik dimana saja untuk kembali</p>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}

export default function PrintReviewPage() {
  return <Suspense><PrintReviewContent /></Suspense>;
}