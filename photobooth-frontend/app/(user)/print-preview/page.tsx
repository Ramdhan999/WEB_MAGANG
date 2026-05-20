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
  
  // State untuk Modal Preview (Menyimpan Index Foto yang sedang dilihat, null = modal tutup)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Konfigurasi posisi kotak frame yang lebih presisi
  const frameConfigs: Record<string, { image: string; slots: number; overlayStyle: any }> = {
    't1': { image: '/IMLEK 1.png', slots: 2, overlayStyle: { top: '15%', height: '70%', left: '12%', right: '12%', display: 'flex', flexDirection: 'column', gap: '6%' } },
    't2': { image: '/IMLEK 2.png', slots: 3, overlayStyle: { top: '12%', height: '76%', left: '12%', right: '12%', display: 'flex', flexDirection: 'column', gap: '3%' } },
    't3': { image: '/IMLEK 3.png', slots: 3, overlayStyle: { top: '12%', height: '76%', left: '12%', right: '12%', display: 'flex', flexDirection: 'column', gap: '3%' } },
    't4': { image: '/PIXEL 1.png', slots: 4, overlayStyle: { top: '10%', height: '80%', left: '10%', right: '10%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '4%' } }, // Grid 2x2 (4 Slots)
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

  useEffect(() => {
    setSlots(Array.from({ length: currentFrame.slots }).map((_, i) => ({ id: i + 1, photo: null })));
    localStorage.removeItem("arranged_slots");
  }, [currentFrame.slots]);

  const handlePrevPhoto = () => {
    if (previewIndex !== null) {
      setPreviewIndex(previewIndex === 0 ? capturedPhotos.length - 1 : previewIndex - 1);
    }
  };

  const handleNextPhoto = () => {
    if (previewIndex !== null) {
      setPreviewIndex(previewIndex === capturedPhotos.length - 1 ? 0 : previewIndex + 1);
    }
  };

  const assignSlot = (slotId: number) => {
    if (previewIndex === null) return;
    const currentPhoto = capturedPhotos[previewIndex];
    
    setSlots(prev => prev.map(s => {
      if (s.photo === currentPhoto) return { ...s, photo: null };
      if (s.id === slotId) return { ...s, photo: currentPhoto };
      return s;
    }));
  };

  const removePhotoFromSlot = (slotId: number) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, photo: null } : s));
  };

  const isComplete = slots.every(s => s.photo !== null);
  const slotsRemaining = slots.filter(s => s.photo === null).length;

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-4 pb-10 overflow-x-hidden select-none" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[85%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      <div className="w-full flex justify-center items-center mt-6 mb-8 z-10 px-4 relative min-h-[80px]">
        <div className="flex flex-col items-center leading-none">
           <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">Atur posisi fotomu!</p>
           <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">Pilih {currentFrame.slots} Foto untuk Slot Frame</h1>
        </div>
      </div>

      {/* CORE WORKSPACE */}
      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-10 items-start justify-center px-6 flex-grow">
        
        {/* SISI KIRI: PREVIEW FRAME */}
        <div className="flex flex-col gap-3 items-center">
          <h2 className="font-hind font-semibold text-[24px] tracking-[-0.08em] text-[#3E8C7B] uppercase self-start ml-4 drop-shadow-md">Preview Frame</h2>
          <div className="w-[380px] h-[550px] bg-white border-[1.5px] border-[#54868A] rounded-[24px] flex items-center justify-center relative shadow-sm p-4">
            <div className="relative w-[190px] h-[510px] bg-gray-100 rounded-sm">
              <div className="absolute inset-0 z-10" style={currentFrame.overlayStyle}>
                {slots.map((slot) => (
                  <div key={slot.id} onClick={() => removePhotoFromSlot(slot.id)} className="flex-1 w-full bg-[#E5E5E5] overflow-hidden cursor-pointer relative group border border-[#54868A]/30 rounded-sm">
                    {slot.photo && <img src={slot.photo} className="w-full h-full object-cover" alt={`Slot ${slot.id}`} />}
                    {!slot.photo && <span className="absolute inset-0 flex items-center justify-center text-[#54868A] font-bold opacity-40 text-4xl drop-shadow-sm">{slot.id}</span>}
                    {slot.photo && (
                      <div className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[14px] font-bold tracking-widest">
                        HAPUS
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <img src={currentFrame.image} className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none drop-shadow-md" alt="Frame" />
            </div>
          </div>
          
          <div className="w-[380px] h-[55px] bg-white border-[1.5px] border-[#CCAE19] rounded-full flex items-center justify-center shadow-sm">
            <span className="font-hind font-semibold text-[22px] tracking-[-0.08em] text-[#FDAD00] drop-shadow-sm">
              {slots.filter(s => s.photo).length} / {currentFrame.slots} Slot foto terisi
            </span>
          </div>
        </div>

        {/* SISI KANAN: DAFTAR FOTO TERPILIH */}
        <div className="flex flex-col gap-3">
          <h2 className="font-hind font-semibold text-[24px] tracking-[-0.08em] text-[#3E8C7B] uppercase self-start ml-4 drop-shadow-md">({capturedPhotos.length}) Foto</h2>
          <div className="flex gap-4">
            <div className="w-[625px] h-[550px] bg-[#A9A6A6] border-[1.5px] border-[#54868A] rounded-[23px] p-6 relative shadow-inner">
              <div ref={scrollRef} onScroll={() => setScrollProgress(scrollRef.current ? scrollRef.current.scrollTop / (scrollRef.current.scrollHeight - scrollRef.current.clientHeight) : 0)} className="grid grid-cols-4 gap-4 h-full overflow-y-auto pr-2 no-scrollbar content-start">
                {capturedPhotos.map((photo, i) => {
                  const isUsed = slots.some(s => s.photo !== null && s.photo === photo);
                  const usedSlot = slots.find(s => s.photo === photo)?.id;

                  return (
                    <div key={i} className="relative group aspect-[4/3]">
                      <div onClick={() => setPreviewIndex(i)} className={`w-full h-full rounded-[15px] border-[2px] border-[#54868A] overflow-hidden bg-white transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm ${isUsed ? 'opacity-70' : ''}`}>
                        <img src={photo} className="w-full h-full object-cover" alt="Captured" />
                        {isUsed && (
                          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 bg-[#FBB400] rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                              <span className="text-white text-xl font-bold">✓</span>
                            </div>
                            <span className="bg-[#FBB400] text-white text-xs font-bold px-2 py-0.5 mt-1 rounded-full border border-white">Slot {usedSlot}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="w-[12px] h-[550px] bg-[#202020] border-[1.5px] border-[#54868A] rounded-full relative flex justify-center shadow-inner">
              <div className="w-[12px] h-[100px] bg-[#006E68] border-[1.5px] border-[#54868A] rounded-full absolute transition-all duration-75" style={{ top: `${scrollProgress * (550 - 100)}px` }} />
            </div>
          </div>
          
          <div className="flex gap-10 mt-2 self-start ml-4 font-hind font-semibold text-[18px] text-[#3E8C7B] tracking-[-0.08em]">
             <div className="flex items-center gap-3"><div className="w-6 h-6 bg-[#FBB400] rounded-full shadow-sm"></div><span>SUDAH DIPILIH</span></div>
             <div className="flex items-center gap-3"><div className="w-6 h-6 bg-white border border-[#54868A] rounded-full shadow-sm"></div><span>BELUM DIPILIH</span></div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTION BUTTONS */}
      <div className="w-full grid grid-cols-3 items-center px-8 mt-10 mb-4">
        <div className="flex justify-start">
          <button 
            onClick={() => router.push("/frame")} 
            className="font-inter font-medium italic text-[24px] tracking-[-0.06em] text-[#0E1E1A] hover:opacity-70 transition-opacity leading-none"
          >
            ← KEMBALI
          </button>
        </div>

        <div className="flex items-center justify-center">
          <button 
            onClick={() => {
              localStorage.setItem("arranged_slots", JSON.stringify(slots));
              router.push(`/filter?frame=${frameId}`);
            }}
            disabled={!isComplete}
            className={`flex items-center justify-center gap-3 w-full sm:w-[265px] h-[53px] rounded-[23px] shadow-md transition-all duration-300 group ${
              isComplete ? 'bg-[#3A9F86] border-3 border-[#E3D5D5] hover:scale-105 active:scale-95 cursor-pointer' : 'bg-gray-400 border-3 border-gray-300 opacity-60 grayscale cursor-not-allowed'
            }`}
          >
            <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em] leading-none pt-0.5">
              Filter & Stiker
            </span>
            <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
          </button>
        </div>

        <div className="hidden sm:block"></div>
      </div>

      {/* ========================================================= */}
      {/* MODAL PREVIEW FOTO & PILIH SLOT (FIX: Semua baris slot sejajar responsif tanpa geser) */}
      {/* ========================================================= */}
      {previewIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-[#878787]/95 backdrop-blur-md flex flex-col p-6 animate-fade-in items-center justify-center">
          
          <div className="flex justify-between items-center mb-6 w-full max-w-[1100px]">
            <div className="px-4 py-1.5 bg-[#B7D4CD] border border-[#54868A] rounded-full shadow-sm flex items-center gap-2">
              <span className="font-inter font-bold text-[14px] text-[#245D4C]">STUDIO BOOTH</span>
            </div>
            
            <div className="px-6 py-2 bg-white/40 border border-white/50 rounded-full shadow-sm">
              <span className="font-inter font-bold text-white tracking-wide">Pilih Foto &bull; {previewIndex + 1} dari {capturedPhotos.length}</span>
            </div>

            <button onClick={() => setPreviewIndex(null)} className="w-10 h-10 bg-white/40 border border-white/50 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="relative w-full max-w-[900px] max-h-[55vh] aspect-[4/3] flex items-center justify-center bg-black rounded-[24px] overflow-hidden shadow-2xl border-[3px] border-[#54868A]">
            <img src={capturedPhotos[previewIndex]} className="w-full h-full object-cover" alt="Preview Besar" />
            
            <button onClick={handlePrevPhoto} className="absolute left-6 w-14 h-14 bg-[#424242]/80 hover:bg-[#54868A] border-2 border-white/20 rounded-full flex items-center justify-center transition-all shadow-md">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={handleNextPhoto} className="absolute right-6 w-14 h-14 bg-[#424242]/80 hover:bg-[#54868A] border-2 border-white/20 rounded-full flex items-center justify-center transition-all shadow-md">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            
            <div className="absolute top-6 left-6 px-4 py-1.5 bg-[#2B2B2B]/80 text-white font-bold rounded-full border border-white/20">Foto {previewIndex + 1}</div>
          </div>

          {/* AREA BAWAH: PILIH SLOT SIMPAN (Langsung kelihatan semua tanpa scroll) */}
          <div className="mt-8 flex flex-col gap-3 w-full max-w-[1100px]">
            <div className="bg-[#B9CAC6] rounded-[20px] p-3 flex items-center border-[2px] border-[#54868A] shadow-md gap-3 w-full">
              
              {/* Info Kiri */}
              <div className="flex items-center gap-3 shrink-0 md:pr-4 md:border-r border-[#54868A]/30">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#3A9F86] rounded-xl flex items-center justify-center shadow-inner">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-inter font-bold text-[16px] md:text-[18px] text-[#245D4C] whitespace-nowrap">Pilih slot simpan</span>
                  <span className="font-inter text-[#467664] text-[13px] md:text-[14px] whitespace-nowrap">Sisa {slotsRemaining} slot kosong.</span>
                </div>
              </div>

              {/* Looping Tombol Slot menggunakan Flex-1 biar terbagi rata */}
              <div className="flex flex-1 gap-2 md:gap-3 justify-between min-w-0">
                {slots.map((slot) => {
                  const currentPhotoUrl = capturedPhotos[previewIndex];
                  const isCurrentPhotoSelected = slot.photo === currentPhotoUrl;
                  const isFilledByOther = slot.photo !== null && slot.photo !== currentPhotoUrl;

                  return (
                    <button 
                      key={slot.id} 
                      onClick={() => assignSlot(slot.id)}
                      className={`flex-1 flex items-center justify-between bg-white px-2 py-2 rounded-[12px] border-[2px] transition-all hover:scale-105 active:scale-95 min-w-0
                        ${isCurrentPhotoSelected ? 'border-[#FBB400] shadow-[0_0_10px_rgba(251,180,0,0.4)]' : 
                          isFilledByOther ? 'border-white' : 'border-white hover:border-[#3A9F86]'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-md font-bold text-xl overflow-hidden shadow-inner
                          ${isCurrentPhotoSelected || isFilledByOther ? 'bg-transparent' : 'bg-[#E1EAE8] text-[#3A9F86]'}`}>
                          {slot.photo ? <img src={slot.photo} className="w-full h-full object-cover"/> : '+'}
                        </div>
                        <div className="flex flex-col text-left leading-tight min-w-0 hidden sm:flex">
                          <span className="font-inter font-bold text-[14px] text-[#2D2D2D] truncate">Slot {slot.id}</span>
                          <span className={`font-inter text-[11px] truncate ${isCurrentPhotoSelected || isFilledByOther ? 'text-[#FBB400] font-bold' : 'text-[#696969]'}`}>
                            {isCurrentPhotoSelected ? 'Terpilih' : isFilledByOther ? 'Sudah Terisi' : 'Kosong'}
                          </span>
                        </div>
                      </div>
                      <div className={`shrink-0 ml-1 px-3 py-1.5 rounded-full font-bold text-[11px] transition-colors 
                        ${isCurrentPhotoSelected ? 'bg-[#FBB400] text-white' : 
                          isFilledByOther ? 'bg-white text-[#FBB400] border border-[#FBB400]' : 'bg-[#3A9F86] text-white'}`}>
                        {isCurrentPhotoSelected ? 'TERPILIH' : isFilledByOther ? 'GANTI' : '+ PILIH'}
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Notifikasi Kuning kalau Slot Penuh */}
            <div className={`w-full px-5 py-3 rounded-full border-[1.5px] flex items-center gap-3 transition-colors duration-300 ${slotsRemaining === 0 ? 'bg-[#FFF9E6] border-[#FBB400]' : 'bg-[#B9CAC6] border-[#54868A]'}`}>
               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${slotsRemaining === 0 ? 'bg-[#FBB400]' : 'bg-[#3A9F86]'}`}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                   {slotsRemaining === 0 ? <path d="M20 6L9 17l-5-5"/> : <polyline points="20 6 9 17 4 12"/>}
                 </svg>
               </div>
               <span className={`font-inter text-[15px] ${slotsRemaining === 0 ? 'text-[#B8860B]' : 'text-[#245D4C]'}`}>
                 {slotsRemaining === 0 ? 
                   <><strong className="font-bold text-[#FBB400]">Semua slot sudah terisi!</strong> Tutup tampilan ini dan klik tombol Lanjut.</> : 
                   <>Tap slot di atas untuk mengisi foto. Sisa <strong className="font-bold">{slotsRemaining} slot kosong</strong>.</>
                 }
               </span>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </main>
  );
}

export default function PrintReviewPage() {
  return <Suspense><PrintReviewContent /></Suspense>;
}