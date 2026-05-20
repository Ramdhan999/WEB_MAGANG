"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function TutorialKontrolPage() {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const gestures = [
    { id: '1jari', title: '1 Jari', desc: 'Glambot ke kanan.', img: '/1.png', btnBg: '#5A8073', icon: '→', btnIcon: '/icon_arrow.png' },
    { id: '2jari', title: '2 Jari', desc: 'Glambot ke kiri.', img: '/2.png', btnBg: '#805A75', icon: '←', btnIcon: '/icon_arrow.png', rotate: 'rotate-180' },
    { id: '3jari', title: '3 Jari', desc: 'Glambot ke atas.', img: '/3.png', btnBg: '#5A6B80', icon: '↑', btnIcon: '/icon_arrow.png', rotate: '-rotate-90' },
    { id: '4jari', title: '4 Jari', desc: 'Glambot ke bawah.', img: '/4.png', btnBg: '#5A8073', icon: '↓', btnIcon: '/icon_arrow.png', rotate: 'rotate-90' },
    { id: 'telapak', title: 'Telapak', desc: 'Stop & Tengah', img: '/5.png', btnBg: '#73805A', icon: '◎', btnIcon: '/icon_stop.png' },
    { id: 'kepalan', title: 'Kepalan', desc: 'Ambil Foto!', img: '/kepalan.png', btnBg: '#5A8073', icon: '📷', btnIcon: '/icon_camera.png' },
    { id: 'jempol', title: 'Jempol', desc: 'Konfirmasi / OK', img: '/jempol.png', btnBg: '#5A8078', icon: '✓', btnIcon: '/icon_check.png' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % gestures.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [gestures.length]);

  const activeGesture = gestures[activeIndex];

  const getMekanikStyle = (id: string) => {
    let cameraX = 0;
    let cameraY = 0;
    let lineX = 0;
    let lineHeight = 84; 
    let lineY = 0; 

    switch (id) {
      case '1jari':
        cameraX = 100;
        lineX = 100;
        break;
      case '2jari':
        cameraX = -100;
        lineX = -100;
        break;
      case '3jari':
        cameraY = -35;
        lineHeight = 84; 
        break;
      case '4jari':
        cameraY = 35;
        lineHeight = 84; 
        break;
    }

    return {
      camera: { transform: `translate(${cameraX}px, ${cameraY}px)` },
      line: { 
        transform: `translateX(${lineX}px)`,
        height: `${lineHeight}px`
      }
    };
  };

  const mekanikStyle = getMekanikStyle(activeGesture.id);

  const getCardGradient = (id: string, isActive: boolean) => {
    if (isActive) return { background: 'radial-gradient(203.5% 118.75% at 50.3% -4.63%, #7F8E89 0%, #6EAB93 100%)', borderColor: '#A0A0A0' };
    switch (id) {
      case '1jari': return { background: 'radial-gradient(203.5% 118.75% at 50.3% -4.63%, #FFFFFF 0%, #999999 100%)' };
      case '2jari': return { background: 'radial-gradient(200.33% 116.9% at 52.12% -12.96%, #7C948B 0%, #A5849C 86.39%)' };
      case '3jari': return { background: 'radial-gradient(200.33% 116.9% at 50.3% -10.65%, #79988C 0%, #7B9EAC 87.27%)' };
      case '4jari': return { background: 'radial-gradient(172.69% 172.69% at 52.37% -45.6%, #7D918A 19.47%, #71A591 73.27%)' };
      case 'telapak': return { background: 'radial-gradient(172.96% 100% at 50.3% 0%, #7C938B 0%, #B1B191 100%)' };
      case 'kepalan': return { background: 'radial-gradient(234.34% 135.48% at 50.3% -35.48%, #85988C 0%, #A5849C 84.46%)' };
      case 'jempol': return { background: 'radial-gradient(172.96% 100% at 50.3% 0%, #88968E 0%, #70A691 100%)' };
      default: return { background: '#FFFFFF' };
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center pt-4 pb-12 px-4 md:px-8 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[55%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* HEADER AREA */}
      <div className="w-full max-w-[1225px] flex flex-col items-center mt-12 mb-16 z-10 text-center relative px-2">
        <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">
          Sebelum mulai sesi foto
        </p>
        <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">
          Tutorial Kontrol Glambot
        </h1>
        <div className="text-[28px] text-[#328F7F] mb-3">★</div>
        <p className="font-hind font-normal text-[20px] text-[#706A6A] tracking-[-0.08em]">
          Glambot dapat di kontrol melalui gesture tangan seperti di bawah ini...
        </p>
      </div>

      {/* CONTAINER UTAMA TERPUSAT */}
      <div className="w-full max-w-[1200px] flex flex-col xl:flex-row items-center justify-center gap-6 mb-10 z-10">
        
        {/* PANEL PREVIEW ROBOT (Garis vertikal selalu kelihatan panjang) */}
        <div 
          className="w-full sm:w-[459px] h-[450px] flex flex-col items-center justify-between p-6 relative overflow-hidden shadow-md shrink-0"
          style={{ 
            background: 'radial-gradient(119.89% 119.89% at 50.11% -11%, #225444 0%, #102420 37.98%, #21293D 91.72%)',
            border: '1.5px solid #54868A',
            borderRadius: '23px'
          }}
        >
          {/* Pratinjau Langsung Badge */}
          <div className="flex items-center justify-center gap-2 px-4 h-[25px] bg-[#305A53] border border-[#5D837A] rounded-[41px] mt-2 self-start ml-2 shadow-inner">
            <div className="w-[13px] h-[13px] rounded-full bg-[#7DB7A2]" />
            <span className="font-hind font-semibold text-[16px] text-[#95C0B9] tracking-[-0.09em] pb-0.5">Pratinjau Langsung</span>
          </div>

          {/* AREA MEKANIK SIMULASI ROBOT DYNAMIC */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Rel Horizontal Atas */}
            <div className="w-[298px] h-[7px] bg-[#213736] rounded-[11px] relative flex items-center justify-center">
              
              {/* FIX LINE MOTION: Garis tegak lurus selalu panjang, minimal height=84px */}
              <div 
                className="absolute w-[7px] bg-[#213736] rounded-[11px] origin-top top-[3.5px] transition-all duration-700 ease-in-out"
                style={mekanikStyle.line}
              />
              
              {/* Kepala Kamera Lensa */}
              <div 
                className="absolute w-[47px] h-[47px] bg-[#254040] rounded-[11px] flex items-center justify-center transition-transform duration-700 ease-in-out shadow-xl z-20 top-[-20px]"
                style={mekanikStyle.camera}
              >
                <div className="w-[21px] h-[21px] border-[3px] border-[#3E8568] rounded-full flex items-center justify-center">
                  <div className="w-[13px] h-[13px] rounded-full bg-[#27E6A0]" />
                </div>
              </div>

            </div>
          </div>

          {/* Label Status Aksi Teks */}
          <div className="flex items-center justify-center gap-1 px-4 h-[25px] bg-[#305A53] border border-[#5D837A] rounded-[41px] mb-2 shadow-inner">
            <span className="font-hind font-semibold text-[15px] text-[#95C0B9] tracking-[-0.09em] pb-0.5">{activeGesture.desc}</span>
            {['1jari','2jari','3jari','4jari'].includes(activeGesture.id) && (
              <span className={`text-[12px] text-[#95C0B9] font-bold ${activeGesture.rotate || ''}`}>→</span>
            )}
          </div>
        </div>

        {/* GRID GESTURE (FIX: Rata kiri di dalam flex wrapper) */}
        <div className="flex-1 flex flex-wrap justify-start gap-3 max-w-[740px]">
          {gestures.map((gesture) => {
            const isActive = activeGesture.id === gesture.id;
            const cardStyle = getCardGradient(gesture.id, isActive);
            
            return (
              <div 
                key={gesture.id}
                className={`w-[165px] h-[216px] flex flex-col items-center justify-between py-4 px-2 rounded-[23px] transition-all duration-500 shadow-md border ${
                  isActive ? 'scale-[1.03] z-10 shadow-[0_0_15px_rgba(49,189,199,0.25)]' : 'border-[#54868A]'
                }`}
                style={cardStyle}
              >
                <h3 className="font-hind font-semibold text-[20px] text-white tracking-[-0.08em] text-center leading-none">
                  {gesture.title}
                </h3>

                <div className="h-[50px] flex items-center justify-center shrink-0">
                  <img 
                    src={gesture.img} 
                    alt={gesture.title} 
                    className={`w-[48px] h-[50px] object-contain transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}
                  />
                </div>

                <p className="font-hind font-normal text-[13px] text-[#475550] tracking-[-0.08em] text-center leading-tight max-w-[120px]">
                  {gesture.desc.replace('.', '')}
                </p>

                <div 
                  className="w-[41px] h-[41px] rounded-[10px] border border-[#808080] flex items-center justify-center shadow-inner shrink-0"
                  style={{ backgroundColor: gesture.btnBg }}
                >
                  <img 
                    src={gesture.btnIcon} 
                    alt="icon" 
                    className={`w-[26px] h-[26px] object-contain ${gesture.rotate || ''}`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<span class="text-white text-base font-bold">${gesture.icon}</span>`;
                    }}
                  />
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* TOMBOL LANJUT MULAI SESI */}
      <div className="w-full max-w-[1200px] flex items-center justify-center z-10">
        {/* Fungsi Link href="/kamera" tetep utuh, cuman className & icon panahnya disamain border-nya */}
        <Link 
          href="/kamera" 
          className="flex items-center justify-center gap-3 w-full sm:w-[265px] h-[53px] bg-[#3A9F86] border-3 border-[#E3D5D5] rounded-[23px] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em]">
            Siap! Mulai Sesi Foto
          </span>
          {/* Div wrapper panah baru biar ketebalan dan bentuk ujungnya seragam dengan halaman kamera */}
          <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
        </Link>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,800&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}