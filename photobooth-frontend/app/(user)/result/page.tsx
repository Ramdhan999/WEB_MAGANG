"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State dibikin dinamis biar nunggu data ke-load
  const [frameId, setFrameId] = useState('t4');
  const [photoSlots, setPhotoSlots] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("ORIGINAL");
  const [intensity, setIntensity] = useState(100);
  const [stickers, setStickers] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // STATE UNTUK MODAL UTAMA
  const [activeModal, setActiveModal] = useState<'cetak' | 'digital' | null>(null);
  
  // STATE UNTUK ALUR MODAL CETAK
  const [cetakStep, setCetakStep] = useState<'options' | 'qris' | 'preview'>('options');
  const [extraCetak, setExtraCetak] = useState(0); 
  const hargaPerTambahan = 10000;

  // Konfigurasi Frame
  const frameConfigs: Record<string, { image: string; slots: number; overlayStyle: any }> = {
    't1': { image: '/IMLEK 1.png', slots: 2, overlayStyle: { top: '15%', height: '70%', left: '12%', right: '12%', display: 'flex', flexDirection: 'column', gap: '6%' } },
    't2': { image: '/IMLEK 2.png', slots: 3, overlayStyle: { top: '12%', height: '76%', left: '12%', right: '12%', display: 'flex', flexDirection: 'column', gap: '3%' } },
    't3': { image: '/IMLEK 3.png', slots: 3, overlayStyle: { top: '12%', height: '76%', left: '12%', right: '12%', display: 'flex', flexDirection: 'column', gap: '3%' } },
    't4': { image: '/PIXEL 1.png', slots: 4, overlayStyle: { top: '10%', height: '80%', left: '10%', right: '10%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '4%' } },
  };

  useEffect(() => {
    const urlFrame = searchParams.get('frame');
    const localFrame = localStorage.getItem('selected_frame');
    const finalFrame = urlFrame || localFrame || 't4';
    setFrameId(finalFrame);

    const savedSlots = localStorage.getItem("arranged_slots");
    const savedFilter = localStorage.getItem("applied_filter");
    const savedIntensity = localStorage.getItem("filter_intensity");
    const savedStickers = localStorage.getItem("applied_stickers");

    if (savedSlots) setPhotoSlots(JSON.parse(savedSlots));
    if (savedFilter) setActiveFilter(savedFilter.toUpperCase());
    if (savedIntensity) setIntensity(Number(savedIntensity));
    if (savedStickers) setStickers(JSON.parse(savedStickers));

    setIsLoaded(true);
  }, [searchParams]);

  const currentFrame = frameConfigs[frameId] || frameConfigs['t4'];

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

  const handleKembali = () => {
    router.push(`/filter?frame=${frameId}`);
  };

  const filledSlotsCount = photoSlots.filter(s => s.photo).length;

  if (!isLoaded) return null;

  // KOMPONEN FRAME PREVIEW
  const FramePreview = ({ className = "" }: { className?: string }) => (
    <div className={`w-[240px] h-[550px] bg-white border-[1.5px] border-[#54868A] rounded-[24px] flex items-center justify-center p-3 relative ${className}`}>
      <div className="w-[210px] h-[520px] bg-[#545151] border-[1.5px] border-[#54868A] rounded-[11px] flex items-center justify-center relative overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 z-10 transition-all duration-300" style={{ filter: getFilterCSS(), ...currentFrame.overlayStyle }}>
            {photoSlots.map((slot: any) => (
              <div key={slot.id} className="w-full h-full bg-[#979797] rounded-[6px] overflow-hidden flex items-center justify-center border-[1.5px] border-[#54868A]">
                {slot.photo ? <img src={slot.photo} className="w-full h-full object-cover" alt={`Slot ${slot.id}`} /> : <span className="text-[#264E45] font-hind font-bold text-[36px] opacity-30">{slot.id}</span>}
              </div>
            ))}
          </div>
          <img src={currentFrame.image} className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none" alt="Frame" />
          <div className="absolute inset-0 z-30 pointer-events-none">
            {stickers.map((stk: any) => (
              <div key={stk.id} style={{ position: 'absolute', left: `${stk.x}%`, top: `${stk.y}%`, transform: `translate(-50%, -50%) rotate(${stk.rotation}deg)`, width: `${stk.size}px`, height: `${stk.size}px` }} className="flex items-center justify-center drop-shadow-md">
                 {stk.emoji.length > 2 ? <span style={{ fontSize: `${stk.size * 0.4}px`, fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{stk.emoji}</span> : <span style={{ fontSize: `${stk.size * 0.8}px` }}>{stk.emoji}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-4 pb-[115px] overflow-x-hidden select-none" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-[100] flex">
        <div className="h-full w-full" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
      </div>

      {/* HEADER */}
      <div className="w-full flex flex-col items-center mt-10 mb-6 z-10 px-4 text-center">
        <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">Hasil Foto</h1>
        <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mt-1">Foto Kamu Siap</p>
      </div>

      {/* MAIN LAYOUT */}
      <div className="w-full max-w-[1800px] flex flex-col xl:flex-row gap-8 items-stretch justify-center px-8 z-10">
        
        {/* SISI KIRI: HASIL FRAME FOTO */}
        <div className="flex-1 max-w-[790px] min-h-[740px] rounded-[23px] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden border border-[#54868A]/30"
             style={{ background: 'radial-gradient(circle at 46% -40%, #004D40 0%, #044C40 55.8%, #434343 100%)' }}>
            
            <div className="w-full flex items-center justify-center relative mb-8 shrink-0">
              <div className="absolute left-0 w-[50px] h-[50px] bg-[#008787] rounded-[17px] flex items-center justify-center shadow-inner">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div className="flex flex-col items-center text-center">
                 <h2 className="font-inter font-bold text-[36px] text-[#EAEAEA] leading-none tracking-[-0.05em] drop-shadow-sm">Hasil Frame Foto</h2>
                 <p className="font-inter font-normal text-[20px] text-white leading-none mt-1 tracking-[-0.05em]">Frame akan dicetak dalam ukuran <strong className="font-bold">4R</strong></p>
              </div>
            </div>

            <div className="flex-1 w-full flex items-center justify-center relative pb-6 scale-100 xl:scale-105 origin-center">
               <FramePreview className="shadow-2xl" />
            </div>
        </div>

        {/* SISI KANAN: LIVE PREVIEW & ACTIONS */}
        <div className="flex-1 max-w-[970px] flex flex-col gap-6">
          
          <div className="w-full h-[565px] rounded-[23px] p-6 flex flex-col shadow-xl relative overflow-hidden border border-[#54868A]/30"
               style={{ background: 'radial-gradient(circle at 49% 5%, #002E2E 25%, #1E2221 73%)' }}>
              
              <div className="w-full flex items-center justify-center relative mb-4 shrink-0">
                <div className="absolute left-0 w-[50px] h-[50px] bg-[#00876A] rounded-[17px] flex items-center justify-center shadow-inner">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>
                <div className="flex flex-col items-center text-center">
                   <h2 className="font-inter font-bold text-[36px] text-[#EAEAEA] leading-none tracking-[-0.05em] drop-shadow-sm">Live Preview Photo</h2>
                   <p className="font-inter font-normal text-[20px] text-white leading-none mt-1 tracking-[-0.05em]">Foto pilihan kamu</p>
                </div>
                <div className="absolute right-0 w-[134px] h-[50px] bg-[#008787] rounded-[17px] flex items-center justify-center shadow-inner">
                   <span className="font-inter font-bold text-[36px] text-[#F1F1F1] tracking-[-0.05em] leading-none pt-1">{filledSlotsCount}/{currentFrame.slots}</span>
                </div>
              </div>

              <div className="flex-1 bg-black/20 rounded-[16px] border border-white/10 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto no-scrollbar content-start">
                 {photoSlots.map((slot, idx) => (
                    <div key={idx} className="w-full aspect-[4/3] bg-black/40 rounded-xl overflow-hidden border border-white/20 flex items-center justify-center relative group">
                       {slot.photo ? (
                         <>
                           <img src={slot.photo} alt={`Preview ${slot.id}`} className="w-full h-full object-cover" />
                           <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs font-bold shadow-md">Slot {slot.id}</div>
                         </>
                       ) : (
                         <span className="text-white/20 font-bold text-xl">Kosong</span>
                       )}
                    </div>
                 ))}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full shrink-0">
              
              <button onClick={() => { setActiveModal('cetak'); setCetakStep('options'); setExtraCetak(0); }} className="relative h-[95px] w-full bg-white border-[1.5px] border-[#54868A] rounded-[23px] flex items-center p-3 gap-4 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left group">
                 <div className="w-[70px] h-[70px] bg-[#2E706D] border-[1.5px] border-[#54868A] rounded-[17px] flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:bg-[#3E8C7B] transition-colors p-3">
                    <img src="/print.png" className="w-full h-full object-contain" alt="print" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl">🖨️</span>'; }} />
                 </div>
                 <div className="flex-1 flex flex-col justify-center pr-8 pt-1">
                    <h3 className="font-inter font-bold text-[26px] text-[#545454] tracking-[-0.05em] leading-tight mb-0.5">Cetak Photo</h3>
                    <p className="font-hind font-semibold text-[17px] text-[#3E8C7B] tracking-[-0.05em] leading-tight" style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.1)' }}>Print di mesin studio.</p>
                 </div>
                 <span className="absolute right-6 text-[#54868A] opacity-50 text-3xl group-hover:translate-x-2 transition-transform">→</span>
              </button>

              <button onClick={() => setActiveModal('digital')} className="relative h-[95px] w-full bg-white border-[1.5px] border-[#54868A] rounded-[23px] flex items-center p-3 gap-4 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left group">
                 <div className="w-[70px] h-[70px] bg-[#2E706D] border-[1.5px] border-[#54868A] rounded-[17px] flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:bg-[#3E8C7B] transition-colors p-3">
                    <img src="/expor.png" className="w-full h-full object-contain" alt="export" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl">📲</span>'; }} />
                 </div>
                 <div className="flex-1 flex flex-col justify-center pr-8 pt-1">
                    <h3 className="font-inter font-bold text-[26px] text-[#545454] tracking-[-0.05em] leading-tight mb-0.5">Kirim Digital</h3>
                    <p className="font-hind font-semibold text-[17px] text-[#3E8C7B] tracking-[-0.05em] leading-tight" style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.1)' }}>WhatsApp & QR galeri</p>
                 </div>
                 <span className="absolute right-6 text-[#54868A] opacity-50 text-3xl group-hover:translate-x-2 transition-transform">→</span>
              </button>
              
          </div>

        </div>
      </div>

      {/* FOOTER BAR */}
      <div className="fixed bottom-0 left-0 w-full h-[115px] bg-white z-[60] flex items-center justify-center shadow-[0_-5px_15px_rgba(0,0,0,0.05)] border-t border-gray-200">
         <div className="w-full max-w-[1800px] flex items-center justify-between px-8">
            <button onClick={handleKembali} className="w-[200px] h-[60px] bg-[#169588] rounded-[13px] flex items-center justify-center hover:bg-[#127a6f] shadow-md transition-all active:scale-95">
              <span className="font-inter font-bold text-[22px] text-white tracking-[-0.05em] leading-none">Kembali</span>
            </button>
            <button onClick={handleNewSession} className="w-[200px] h-[60px] bg-[#CDCDCD] rounded-[13px] flex items-center justify-center gap-3 hover:bg-gray-300 shadow-md transition-all active:scale-95 group">
               <div className="w-6 h-6 flex items-center justify-center opacity-70 group-hover:-rotate-180 transition-transform duration-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#545454" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
               </div>
               <span className="font-inter font-bold text-[22px] text-[#545454] tracking-[-0.05em] leading-none">Sesi Baru</span>
            </button>
         </div>
      </div>


      {/* ========================================= */}
      {/* MODAL POP-UP SYSTEM (CETAK & DIGITAL) */}
      {/* ========================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          
          <div className="absolute inset-0" onClick={() => { setActiveModal(null); setExtraCetak(0); }}></div>
          
          {/* ============================== */}
          {/* A. MODAL CETAK PHOTO -> 3 STEPS */}
          {/* ============================== */}
          {activeModal === 'cetak' && (
             <div className="bg-white w-full max-w-[420px] rounded-[28px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border border-[#54868A]">
                
                {/* --- STEP 1: OPTIONS --- */}
                {cetakStep === 'options' && (
                  <div className="flex flex-col items-center w-full p-6">
                     <div className="w-[64px] h-[64px] bg-[#E3D5D5] border border-[#54868A] rounded-[20px] flex items-center justify-center mb-4 shadow-sm">
                        <img src="/print.png" className="w-[30px] h-[30px]" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">🖨️</span>'; }} />
                     </div>
                     <h2 className="font-inter font-extrabold text-[24px] text-[#332C2C] mb-1.5 tracking-[-0.03em] leading-none">Tambah cetakan personal?</h2>
                     <p className="font-hind text-[15px] text-[#545454] text-center px-2 mb-6 leading-tight">Setiap anggota grup bisa pulang dengan cetakan sendiri. Paket utama sudah termasuk 1 cetakan.</p>

                     <div className="w-full bg-[#F4F9F8] rounded-[16px] p-3 flex items-center justify-between mb-4 border border-[#54868A]/30 shadow-sm">
                        <div className="bg-[#3A9F86] text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm">Termasuk paket</div>
                        <span className="font-inter font-bold text-[14px] text-[#332C2C]">Paket Foto · 1 cetakan</span>
                     </div>

                     <div className="w-full bg-white border-[1.5px] border-[#54868A] rounded-[20px] p-5 flex flex-col items-center mb-4 shadow-sm relative">
                        <div className="flex items-center justify-between w-full mb-1 px-2">
                           <button onClick={() => setExtraCetak(Math.max(0, extraCetak - 1))} className="w-[45px] h-[45px] bg-[#E3D5D5] hover:bg-[#d8c7c7] border border-[#54868A] text-[#2E706D] rounded-xl font-bold text-3xl flex items-center justify-center active:scale-95 pb-1 transition-colors">−</button>
                           <div className="flex flex-col items-center">
                              <span className="font-inter font-black text-[64px] leading-none text-[#332C2C] mb-1">{extraCetak}</span>
                              <span className="font-inter font-bold text-[10px] text-[#3A9F86] tracking-widest leading-none">CETAKAN TAMBAHAN</span>
                           </div>
                           <button onClick={() => setExtraCetak(Math.min(5, extraCetak + 1))} className="w-[45px] h-[45px] bg-[#3A9F86] hover:bg-[#2E706D] text-white border border-[#54868A] rounded-xl font-bold text-3xl flex items-center justify-center active:scale-95 pb-1 transition-colors">+</button>
                        </div>
                        <span className="font-hind text-[13px] text-[#545454] mt-2">× <strong className="text-[#3A9F86]">Rp {(hargaPerTambahan).toLocaleString('id-ID')}</strong> per cetakan · maksimal 5</span>
                     </div>

                     <div className="w-full bg-[#2E706D] rounded-[16px] p-5 flex items-center justify-between mb-4 shadow-md border border-[#54868A]">
                        <span className="font-inter font-bold text-[16px] text-white">Total tambahan</span>
                        <span className="font-inter font-bold text-[24px] text-[#F6AA06]">Rp {(extraCetak * hargaPerTambahan).toLocaleString('id-ID')}</span>
                     </div>

                     <div className="w-full bg-[#FFF6E5] rounded-[14px] p-3 flex gap-3 items-start border-l-[4px] border-[#D29E38] mb-6 shadow-sm">
                        <span className="text-lg leading-none pt-0.5">💡</span>
                        <p className="font-hind font-medium text-[13px] text-[#BF7D32] leading-tight">Bayar tambahan setelah melihat hasil cetakan. Kamu bisa melewati langkah ini bila tidak perlu.</p>
                     </div>

                     <div className="w-full flex gap-3">
                        <button onClick={() => setCetakStep('preview')} className="flex-1 h-[53px] bg-white border border-[#54868A] rounded-[16px] font-inter font-bold italic text-[18px] text-[#545454] active:scale-95 hover:bg-[#F9F9F9] transition-colors shadow-sm pt-0.5">Lewati</button>
                        <button onClick={() => { extraCetak > 0 ? setCetakStep('qris') : setCetakStep('preview') }} className="flex-[1.5] h-[53px] bg-[#3A9F86] rounded-[16px] font-inter font-bold italic text-[18px] text-white active:scale-95 hover:bg-[#2E706D] border border-[#54868A] transition-colors shadow-sm pt-0.5">
                            {extraCetak > 0 ? "Bayar & Cetak" : "Cetak Sekarang"}
                        </button>
                     </div>
                  </div>
                )}

                {/* --- STEP 2: QRIS PAYMENT --- */}
                {cetakStep === 'qris' && (
                  <div className="flex flex-col items-center w-full p-6">
                     <div className="w-[64px] h-[64px] bg-[#FFF6E5] border border-[#D29E38] rounded-[20px] flex items-center justify-center mb-4 shadow-sm">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D29E38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                     </div>
                     <h2 className="font-inter font-extrabold text-[24px] text-[#332C2C] mb-1.5 tracking-[-0.03em] leading-none text-center">Scan QRIS — Cetakan Tambahan</h2>
                     <p className="font-hind text-[15px] text-[#545454] mb-6 text-center">Bayar untuk {extraCetak} cetakan extra</p>

                     <div className="w-[220px] h-[220px] bg-white rounded-[24px] shadow-xl p-4 flex items-center justify-center mb-4 border border-[#54868A]">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="#332C2C">
                          <path fillRule="evenodd" clipRule="evenodd" d="M0 0h30v30H0V0zm10 10v10h10V10H10zm40-10h30v30H50V0zm10 10v10h10V10H60zM0 50h30v30H0V50zm10 10v10h10V60H10zm40 10h10v10H50V70zm20 0h10v10H70V70zm-20-20h10v10H50V50zm20 0h10v10H70V50z" />
                          <rect x="35" y="0" width="10" height="10"/><rect x="35" y="20" width="10" height="10"/><rect x="35" y="40" width="10" height="10"/><rect x="35" y="80" width="10" height="10"/>
                          <rect x="0" y="35" width="10" height="10"/><rect x="20" y="35" width="10" height="10"/><rect x="70" y="35" width="10" height="10"/>
                          <rect x="80" y="80" width="20" height="20" rx="2"/><rect x="85" y="85" width="10" height="10" fill="white"/>
                        </svg>
                     </div>

                     <h3 className="font-inter font-bold text-[36px] text-[#3A9F86] leading-none mb-2 drop-shadow-sm">Rp {(extraCetak * hargaPerTambahan).toLocaleString('id-ID')}</h3>
                     <p className="font-hind text-[14px] text-[#545454] mb-6">Studio Booth · Cetakan Personal</p>

                     <div className="flex items-center gap-2 mb-6 bg-[#F4F9F8] px-4 py-2 rounded-full border border-[#54868A]/30">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#545454" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span className="font-inter font-medium text-[15px] text-[#545454]">Berlaku <strong className="text-[#D29E38]">4:57</strong></span>
                     </div>

                     <div className="w-full flex gap-3">
                        <button onClick={() => setCetakStep('options')} className="flex-1 h-[53px] bg-white border border-[#54868A] rounded-[16px] font-inter font-bold italic text-[18px] text-[#545454] active:scale-95 hover:bg-[#F9F9F9] transition-colors shadow-sm pt-0.5">Batal</button>
                        <button onClick={() => setCetakStep('preview')} className="flex-[1.5] h-[53px] bg-[#3A9F86] rounded-[16px] border border-[#54868A] font-inter font-bold italic text-[18px] text-white active:scale-95 hover:bg-[#2E706D] transition-colors shadow-sm pt-0.5">✔ Sudah Bayar</button>
                     </div>
                  </div>
                )}

                {/* --- STEP 3: PRINT PREVIEW --- */}
                {cetakStep === 'preview' && (
                  <div className="flex flex-col items-center w-full p-6">
                     <div className="w-[64px] h-[64px] bg-[#E3D5D5] rounded-[20px] border border-[#54868A] flex items-center justify-center mb-4 shadow-sm">
                        <img src="/print.png" className="w-[30px] h-[30px]" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl">🖨️</span>'; }} />
                     </div>
                     <h2 className="font-inter font-extrabold text-[24px] text-[#332C2C] mb-1.5 tracking-[-0.03em] leading-none text-center">Ini yang akan tercetak</h2>
                     <p className="font-hind text-[15px] text-[#545454] text-center px-4 mb-6 leading-tight">Konfirmasi cetak? Cek dulu hasilnya — setelah ini langsung diproses printer.</p>

                     <div className="bg-[#FFF6E5] border border-[#D29E38] px-5 py-2 rounded-full mb-6 shadow-sm">
                        <span className="font-inter font-bold text-[13px] tracking-widest text-[#BF7D32]">CETAKAN 4R · 102 × 152 MM</span>
                     </div>

                     {/* SCALED DOWN FRAME PREVIEW */}
                     <div className="w-[200px] h-[300px] flex justify-center bg-white shadow-xl border border-[#54868A] rounded-[16px] overflow-hidden mb-8 relative">
                         <div className="absolute top-4 left-1/2 -translate-x-1/2 origin-top scale-[0.5]">
                             <FramePreview className="shadow-none border-none p-0 rounded-none bg-transparent" />
                         </div>
                     </div>

                     <div className="w-full flex gap-3">
                        <button onClick={() => { setActiveModal(null); setExtraCetak(0); setCetakStep('options'); }} className="flex-1 h-[53px] bg-white border border-[#54868A] rounded-[16px] font-inter font-bold italic text-[18px] text-[#545454] active:scale-95 hover:bg-[#F9F9F9] transition-colors shadow-sm pt-0.5">← Batal Cetak</button>
                        <button onClick={() => { setActiveModal(null); setExtraCetak(0); setCetakStep('options'); alert('Sedang memproses cetakan...'); }} className="flex-[1.5] h-[53px] bg-[#3A9F86] rounded-[16px] border border-[#54868A] font-inter font-bold italic text-[18px] text-white active:scale-95 hover:bg-[#2E706D] transition-colors shadow-sm pt-0.5">Konfirmasi Cetak</button>
                     </div>
                  </div>
                )}
             </div>
          )}

          {/* ============================== */}
          {/* B. MODAL KIRIM DIGITAL */}
          {/* ============================== */}
          {activeModal === 'digital' && (
            <div className="bg-white w-full max-w-[500px] rounded-[24px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border border-[#54868A] flex flex-col p-6">
                
                <div className="flex items-center justify-center relative mb-6 shrink-0 w-full">
                    <div className="absolute left-0 w-[50px] h-[50px] bg-[#EAF5F3] border border-[#54868A]/30 rounded-[17px] flex items-center justify-center shadow-md">
                        <img src="/expor.png" className="w-[22px] h-[22px]" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-xl">📲</span>'; }} />
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <h2 className="font-inter font-bold text-[32px] text-[#332C2C] tracking-[-0.05em] leading-none mb-0.5">Kirim Digital</h2>
                        <p className="font-hind font-semibold text-[20px] text-[#3E8C7B] tracking-[-0.08em] leading-none">pilih cara menerima</p>
                    </div>
                </div>

                <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1">
                    
                    {/* Opsi WA (FIX: Background Hijau Muda biar Logo WA Kelihatan) */}
                    <div className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[20px] p-5">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-[40px] h-[40px] bg-[#EAF5F3] border border-[#54868A]/30 rounded-full flex items-center justify-center shadow-md">
                             <img src="/wa.png" className="w-[24px] h-[24px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[#25D366] text-xl font-bold">WA</span>'; }} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-inter font-bold text-[16px] text-[#332C2C] leading-tight">Kirim ke WhatsApp</span>
                            <span className="font-hind font-semibold text-[13px] text-[#3A9F86] leading-tight">Masukkan nomor — hasil frame + semua foto terkirim</span>
                          </div>
                       </div>
                       <input type="tel" placeholder="+62 8xx-xxxx-xxxx" className="w-full h-[45px] rounded-[10px] border border-[#54868A] bg-white px-4 font-inter text-[15px] outline-none focus:border-[#2E706D] mb-4 text-[#332C2C]" />
                       <button className="w-full h-[45px] bg-[#3A9F86] hover:bg-[#2E706D] rounded-[10px] flex items-center justify-center gap-2 transition-colors active:scale-[0.98] shadow-sm border border-[#54868A]">
                          <img src="/wa.png" className="w-[18px] h-[18px] filter brightness-0 invert" onError={(e) => e.currentTarget.style.display = 'none'} />
                          <span className="font-inter font-bold italic text-[16px] text-white pt-0.5">Kirim ke WhatsApp</span>
                       </button>
                    </div>

                    <div className="flex items-center gap-4 w-full px-2">
                       <div className="h-[1px] bg-[#54868A]/30 flex-1"></div>
                       <span className="font-hind font-bold italic text-[16px] text-[#D29E38]">atau</span>
                       <div className="h-[1px] bg-[#54868A]/30 flex-1"></div>
                    </div>

                    <div className="w-full bg-[#FFF6E5] border border-[#F2E0C4] rounded-[20px] p-5 flex flex-col items-center">
                       <div className="flex items-center gap-3 w-full mb-4">
                          <div className="w-[40px] h-[40px] bg-[#FFF6E5] rounded-xl flex items-center justify-center shadow-sm border border-[#F2E0C4]">
                             <img src="/scan.png" className="w-[22px] h-[22px]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[#D29E38] text-xl font-bold">QR</span>'; }} />
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="font-inter font-bold text-[16px] text-[#332C2C] leading-tight">Scan QR ke Web Galeri</span>
                            <span className="font-hind font-semibold text-[13px] text-[#D29E38] leading-tight max-w-[280px]">Buka galeri lengkap di HP kamu via scan</span>
                          </div>
                       </div>
                       
                       <div className="w-[160px] h-[160px] bg-white rounded-xl shadow-md border border-[#54868A] p-3 flex items-center justify-center mb-3">
                          <svg width="100%" height="100%" viewBox="0 0 100 100" fill="#332C2C">
                            <path fillRule="evenodd" clipRule="evenodd" d="M0 0h30v30H0V0zm10 10v10h10V10H10zm40-10h30v30H50V0zm10 10v10h10V10H60zM0 50h30v30H0V50zm10 10v10h10V60H10zm40 10h10v10H50V70zm20 0h10v10H70V70zm-20-20h10v10H50V50zm20 0h10v10H70V50z" />
                            <rect x="35" y="0" width="10" height="10"/><rect x="35" y="20" width="10" height="10"/><rect x="35" y="40" width="10" height="10"/><rect x="35" y="60" width="10" height="10"/><rect x="35" y="80" width="10" height="10"/>
                            <rect x="0" y="35" width="10" height="10"/><rect x="20" y="35" width="10" height="10"/><rect x="50" y="35" width="10" height="10"/><rect x="70" y="35" width="10" height="10"/><rect x="90" y="35" width="10" height="10"/>
                            <rect x="80" y="80" width="20" height="20" rx="2"/><rect x="85" y="85" width="10" height="10" fill="white"/>
                          </svg>
                       </div>
                       <div className="flex items-center gap-2">
                         <img src="/scan.png" className="w-[16px] h-[16px] opacity-70" onError={(e) => e.currentTarget.style.display = 'none'} />
                         <span className="font-hind text-[13px] text-[#545454]">Scan untuk akses galeri foto di HP</span>
                       </div>
                    </div>

                    <button className="w-full h-[45px] bg-white border-[1.5px] border-[#54868A] hover:bg-[#F9F9F9] rounded-[10px] flex items-center justify-center gap-2 transition-colors active:scale-[0.98] group">
                       <span className="text-[#54868A] text-xl leading-none pt-0.5 group-hover:text-[#2E706D]">📥</span>
                       <span className="font-inter font-bold text-[15px] text-[#54868A] group-hover:text-[#2E706D]">Download Semua sebagai ZIP</span>
                    </button>

                 </div>

                 <div className="mt-4 shrink-0 w-full pt-4 border-t border-[#54868A]/30">
                    <button 
                      onClick={() => setActiveModal(null)}
                      className="w-full h-[53px] bg-white border border-[#54868A] hover:bg-red-50 rounded-[23px] flex items-center justify-center active:scale-[0.98] transition-colors"
                    >
                       <span className="font-inter font-bold italic text-[20px] text-[#545454] pt-0.5">Tutup</span>
                    </button>
                 </div>

            </div>
          )}

        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #D1D1D1; border-radius: 20px; }
      `}</style>
    </main>
  );
}

export default function ResultPage() {
  return <Suspense><ResultContent /></Suspense>;
}