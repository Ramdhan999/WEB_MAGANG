"use client";

import { useState, useEffect } from "react";

export default function TestimoniOperatorPage() {
  const [isOperatorMode, setIsOperatorMode] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(209);
  const [fotoDiambil, setFotoDiambil] = useState(0);

  // MENDENGARKAN SINYAL DARI LAYAR 1 (Kamera Utama)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'triggerWarning') {
        setIsOperatorMode(true);
        setShowWarning(true);
        
        // Matiin Warning otomatis setelah 8 Detik
        setTimeout(() => {
          setShowWarning(false);
        }, 8000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Timer Hitung Mundur Sisa Waktu
  useEffect(() => {
    if (!isOperatorMode || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isOperatorMode, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const gestures = [
    { id: '1jari', img: '/1.png' },
    { id: '2jari', img: '/2.png' },
    { id: '3jari', img: '/3.png' },
    { id: '4jari', img: '/4.png' },
    { id: 'telapak', img: '/5.png' },
    { id: 'kepalan', img: '/kepalan.png' },
    { id: 'jempol', img: '/jempol.png' },
  ];

  // =======================================================================
  // TAMPILAN 1: HALAMAN TESTIMONI (Awal sebelum kamera nyala)
  // =======================================================================
  if (!isOperatorMode) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden selection:bg-[#75FFC3]" style={{ backgroundColor: '#E3D5D5' }}>
        
        {/* Header Ala Operator */}
        <div className="absolute top-0 left-0 w-full h-[91px] bg-[#464646] flex items-center justify-between px-8 z-10 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-[77px] h-[77px] bg-gradient-to-b from-[#48CF8D] to-[#245F69] border border-[#ACFFC1] rounded-[9px] flex items-center justify-center">
              <span className="text-3xl text-[#ACFFC1]">✨</span>
            </div>
            <h1 className="font-inter font-black text-[48px] tracking-tight" style={{ 
              background: 'linear-gradient(90deg, #FFFFFF 0%, #999999 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              GLAMBOTSTUDIO
            </h1>
          </div>
          <div className="px-6 py-2 bg-gradient-to-b from-[#48CF8D] to-[#245F69] border border-[#ACFFC1] rounded-[19.5px]">
            <span className="font-inter font-bold italic text-[20px] tracking-[0.11em] text-[#2D2D2D]">LAYAR TESTIMONI</span>
          </div>
        </div>

        {/* Konten Tengah (Bebas tanpa box putih) */}
        <div className="flex flex-col items-center z-10 animate-fade-in text-center mt-20 w-full max-w-[1200px]">
          <h3 className="font-hind font-semibold italic text-[28px] text-[#289368] mb-2 tracking-[-0.02em]">
            Cerita Mereka yang Sudah Mencoba
          </h3>
          <h1 className="font-inter font-black text-[64px] mb-8 tracking-tight" style={{ 
              background: 'linear-gradient(90deg, #FFFFFF 0%, #999999 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.1))'
            }}>
            GlambotStudio
          </h1>

          <div className="w-[100px] h-[100px] bg-[#FFFFFF] border-[2px] border-[#54868A] rounded-[24px] flex items-center justify-center shadow-sm mb-8">
            <span className="text-[50px]">📸</span>
          </div>

          <h2 className="font-inter font-bold italic text-[40px] text-[#285B47] mb-8 max-w-[900px] leading-tight">
            "Foto kami jadi cinematic banget, robotnya keren!"
          </h2>

          <div className="flex items-center gap-4 mb-12">
            <span className="font-inter font-bold text-[22px] text-[#5E5E5E]">Rina & Sasha</span>
            <div className="px-5 py-2 bg-gradient-to-r from-[#48C5A6] to-[#35967E] border border-[#318570] rounded-[19.5px] shadow-sm">
              <span className="font-inter font-bold text-[14px] text-white">GLAMBOT DUO</span>
            </div>
          </div>

          {/* Indikator Slider */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-[40px] h-[8px] bg-[#289368] rounded-full"></div>
            <div className="w-[10px] h-[10px] bg-[#B4B4B4] rounded-full"></div>
            <div className="w-[10px] h-[10px] bg-[#B4B4B4] rounded-full"></div>
            <div className="w-[10px] h-[10px] bg-[#B4B4B4] rounded-full"></div>
            <div className="w-[10px] h-[10px] bg-[#B4B4B4] rounded-full"></div>
          </div>

          <p className="font-hind font-medium text-[20px] text-[#54868A]">
            📸 Pengalaman foto premium tanpa fotografer · cetak instan · filter pro
          </p>
        </div>
      </main>
    );
  }

  // =======================================================================
  // TAMPILAN 2: HALAMAN OPERATOR (Berubah Otomatis Pas Terima Sinyal)
  // =======================================================================
  return (
    <main className="relative flex flex-col h-screen overflow-hidden selection:bg-[#75FFC3]" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* HEADER OPERATOR (Tinggi 91px) */}
      <div className="w-full h-[91px] bg-[#464646] shrink-0 flex items-center justify-between px-6 md:px-8 relative z-20 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-[60px] h-[60px] md:w-[77px] md:h-[77px] bg-gradient-to-b from-[#48CF8D] to-[#245F69] border border-[#ACFFC1] rounded-[9px] flex items-center justify-center">
             <img src="/image4.png" alt="logo" className="w-[30px] h-[30px] md:w-[41px] md:h-[41px]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl text-[#ACFFC1]">✨</span>'; }} />
          </div>
          <h1 className="font-inter font-black text-[32px] md:text-[48px] bg-clip-text text-transparent tracking-tight leading-none" style={{ backgroundImage: 'linear-gradient(90deg, #FFFFFF 0%, #999999 100%)' }}>
            GLAMBOTSTUDIO
          </h1>
          <div className="hidden md:flex ml-4 px-6 h-[39px] items-center bg-gradient-to-b from-[#48CF8D] to-[#245F69] border border-[#ACFFC1] rounded-[19.5px]">
            <span className="font-inter font-bold italic text-[20px] tracking-[0.11em] text-[#2D2D2D] leading-none">LAYAR OPERATOR</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-6 h-[39px] border border-[#ACFFC1] rounded-[19.5px]" style={{ backgroundColor: '#295D4E' }}>
          <div className="w-[20px] h-[20px] bg-[#40FF00] rounded-full shadow-[0_0_10px_#40FF00]"></div>
          <span className="hidden md:block font-inter font-bold italic text-[20px] tracking-[0.11em] text-[#C2C2C2] leading-none pt-0.5">SENSOR AKTIF</span>
        </div>
      </div>

      {/* KONTEN UTAMA (Sisa tinggi layar) */}
      <div className="w-full max-w-[1866px] mx-auto flex-grow flex gap-4 lg:gap-6 p-4 lg:p-6 overflow-hidden">
        
        {/* BAGIAN KIRI (Status Bar, Kamera, 3 Box Info) */}
        <div className="flex-1 flex flex-col gap-4 h-full min-w-0">
          
          {/* 1. Panduan Bar Atas */}
          <div className="w-full h-[74px] shrink-0 bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[23px] flex items-center px-4 relative overflow-hidden shadow-sm">
             {/* Aksen Hijau di kiri */}
             <div className="absolute left-0 top-0 bottom-0 w-[16px] bg-[#00FF66]"></div>
             
             <div className="ml-4 w-[154px] h-[55px] bg-gradient-to-b from-[#48CF8D] to-[#245F69] border border-[#ACFFC1] rounded-[10px] flex items-center justify-center mr-6 shadow-sm">
                <span className="font-inter font-bold italic text-[20px] tracking-[0.11em] text-[#2D2D2D]">PANDUAN</span>
             </div>
             
             {/* Ikon Meter */}
             <div className="flex items-center gap-3">
               <img src="/meter.png" alt="meter" className="w-[31px] h-[31px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[28px]">📏</span>'; }} />
               <span className="font-inter font-bold italic text-[18px] md:text-[20px] tracking-[0.11em] text-[#2D2D2D]">3 Meter <span className="font-normal text-[#5A5A5A]">dari robot</span></span>
             </div>

             <div className="h-[40px] border-r-[3px] border-[#54868A] opacity-30 mx-6"></div>

             {/* Ikon Telapak */}
             <div className="flex items-center gap-3">
               <img src="/item.png" alt="item" className="w-[31px] h-[31px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[28px]">✋</span>'; }} />
               <span className="font-inter font-bold italic text-[18px] md:text-[20px] tracking-[0.11em] text-[#2D2D2D]">Telapak = <span className="font-normal text-[#5A5A5A]">Unlock Gestur</span></span>
             </div>

             <div className="h-[40px] border-r-[3px] border-[#54868A] opacity-30 mx-6"></div>

             <div className="flex items-center gap-3">
               <div className="w-[24px] h-[24px] bg-[#40FF00] rounded-full"></div>
               <span className="font-inter font-bold italic text-[18px] md:text-[20px] tracking-[0.11em] text-[#2D2D2D]">Hijau = <span className="font-normal text-[#5A5A5A]">Sensor Aktif</span></span>
             </div>
          </div>

          {/* 2. Kamera Preview (Dibungkus kotak putih) */}
          <div className="w-full flex-grow bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[23px] p-3 md:p-4 shadow-sm flex flex-col overflow-hidden">
             <div className="w-full h-full bg-[#B4B4B4] border-[1.5px] border-[#54868A] rounded-[18px] relative flex flex-col justify-end p-6 overflow-hidden shadow-inner">
               
               <div className="flex flex-col gap-1 z-10 w-fit">
                 <div className="px-3 py-1 bg-[#295D4E] border border-[#ACFFC1] rounded-[19.5px] w-fit flex items-center gap-2 shadow-sm mb-1">
                   <div className="w-[12px] h-[12px] bg-[#40FF00] rounded-full shadow-[0_0_5px_#40FF00]"></div>
                   <span className="font-hind font-bold text-[16px] tracking-[-0.08em] text-[#BEE1D3] leading-none pt-0.5">LIVE</span>
                 </div>
                 <span className="font-hind font-semibold text-[32px] md:text-[48px] leading-[1] text-[#5E5E5E] tracking-[-0.08em]">- menunggu gestur -</span>
               </div>
               
               <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-inter text-[#464646] text-[20px] font-medium opacity-40 text-center pointer-events-none">
                 (Preview Sensor Kamera)
               </span>
             </div>
          </div>

          {/* 3. Tiga Box Informasi Bawah */}
          <div className="w-full h-[90px] md:h-[106px] shrink-0 flex gap-4 lg:gap-6">
             {/* Sisa Waktu */}
             <div className="flex-[1.5] bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[23px] flex flex-col justify-center px-6 shadow-sm">
               <span className="font-hind font-bold text-[16px] md:text-[20px] text-[#289368] tracking-[-0.08em] leading-none mb-1">SISA WAKTU</span>
               <span className="font-hind font-semibold text-[36px] md:text-[48px] text-[#285B47] tracking-[-0.08em] leading-none">{formatTime(timeLeft)}</span>
             </div>
             {/* Foto Diambil */}
             <div className="flex-1 bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[23px] flex flex-col justify-center px-6 shadow-sm">
               <span className="font-hind font-bold text-[16px] md:text-[20px] text-[#289368] tracking-[-0.08em] leading-none mb-1">FOTO DIAMBIL</span>
               <span className="font-hind font-semibold text-[36px] md:text-[48px] text-[#285B47] tracking-[-0.08em] leading-none">{fotoDiambil} foto</span>
             </div>
             {/* Jarak Aman */}
             <div className="flex-1 bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[23px] flex flex-col justify-center px-6 shadow-sm">
               <span className="font-hind font-bold text-[16px] md:text-[20px] text-[#289368] tracking-[-0.08em] leading-none mb-1">JARAK AMAN</span>
               <span className="font-hind font-semibold text-[36px] md:text-[48px] text-[#285B47] tracking-[-0.08em] leading-none">3 Meter</span>
             </div>
          </div>

        </div>

        {/* BAGIAN KANAN (Sidebar Gestur Robot) */}
        <div className="w-[260px] lg:w-[311px] shrink-0 h-full bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[23px] p-5 lg:p-6 flex flex-col shadow-sm">
          <h2 className="font-hind font-semibold text-[20px] text-[#105249] tracking-[-0.08em] uppercase mb-2">GESTUR ROBOT</h2>
          <div className="w-full h-0 border-t-[3px] border-dashed border-[#54868A] mb-5"></div>
          
          {/* Grid Icon Gestur */}
          <div className="grid grid-cols-3 gap-3">
            {gestures.map((g, i) => (
              <div key={i} className="w-full aspect-square bg-[#9F9F9F] border border-[#54868A] rounded-[6px] flex items-center justify-center relative overflow-hidden shadow-sm">
                <img src={g.img} alt={`gesture-${i}`} className="w-[30px] h-[30px] lg:w-[36px] lg:h-[36px] object-contain opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[20px]">👋</span>'; }} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* POP-UP WARNING (3 HAL WAJIB TAHU) */}
      {/* ==================================================================== */}
      {showWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-[90%] max-w-[700px] bg-[#E3D5D5] border-[2px] border-[#54868A] rounded-[30px] p-10 flex flex-col shadow-2xl relative animate-scale-up">
            
            <button onClick={() => setShowWarning(false)} className="absolute top-6 right-6 text-[#54868A] hover:text-[#1D4F42] transition-colors">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="flex justify-center mb-8">
               <div className="px-8 py-2 bg-gradient-to-r from-[#48C5A6] to-[#35967E] rounded-full border-[2px] border-[#318570] shadow-md">
                 <span className="font-inter font-bold italic text-[22px] tracking-[0.11em] text-[#1D4F42]">PANDUAN SINGKAT</span>
               </div>
            </div>
            
            <h2 className="font-inter font-black text-[42px] text-center text-[#303030] mb-3 leading-tight tracking-tight">
              Sebelum Mulai — <br/>3 Hal Wajib Tahu
            </h2>
            <p className="font-hind text-[22px] text-center text-[#54868A] mb-10 font-medium">Pegang panduan ini selama sesi foto berlangsung.</p>

            <div className="flex flex-col gap-5">
              <div className="w-full bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[20px] p-6 flex items-center gap-6 shadow-sm">
                <img src="/meter.png" alt="meter" className="w-[36px] h-[36px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[36px]">📏</span>'; }} />
                <span className="font-inter italic text-[22px] text-[#5A5A5A] leading-tight">
                  <strong className="text-[#289368]">Jarak 3 meter</strong> dari robot — biar gerak robot terbaca aman.
                </span>
              </div>
              <div className="w-full bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[20px] p-6 flex items-center gap-6 shadow-sm">
                <img src="/item.png" alt="item" className="w-[36px] h-[36px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[36px]">✋</span>'; }} />
                <span className="font-inter italic text-[22px] text-[#5A5A5A] leading-tight">
                  Ganti gestur? <strong className="text-[#289368]">Buka telapak (5 jari)</strong> dulu untuk unlock.
                </span>
              </div>
              <div className="w-full bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[20px] p-6 flex items-center gap-6 shadow-sm">
                <div className="w-[32px] h-[32px] bg-[#40FF00] rounded-full shadow-[0_0_12px_#40FF00] flex-shrink-0 border border-[#289368]"></div>
                <span className="font-inter italic text-[22px] text-[#5A5A5A] leading-tight">
                  Indikator <strong className="text-[#289368]">hijau</strong> = robot siap. Tunggu <strong className="text-[#FFAE00]">3-5 detik</strong> antar gerakan.
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;0,900;1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }

        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </main>
  );
}