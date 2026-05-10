"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function TutorialKontrolPage() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const gestures = [
    { id: '1jari', title: '1 Jari', desc: 'Glambot ke kanan', img: '/1.png', icon: '→' },
    { id: '2jari', title: '2 Jari', desc: 'Glambot ke kiri', img: '/2.png', icon: '←' },
    { id: '3jari', title: '3 Jari', desc: 'Glambot ke atas', img: '/3.png', icon: '↑' },
    { id: '4jari', title: '4 Jari', desc: 'Glambot ke bawah', img: '/4.png', icon: '↓' },
    { id: 'telapak', title: 'Telapak', desc: 'Stop & Tengah', img: '/5.png', icon: '◎' },
    { id: 'kepalan', title: 'Kepalan', desc: 'Ambil Foto!', img: '/kepalan.png', icon: '📷' },
    { id: 'jempol', title: 'Jempol', desc: 'Konfirmasi / OK', img: '/jempol.png', icon: '✓' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % gestures.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [gestures.length]);

  const activeGesture = gestures[activeIndex];

  const getPos = (id: string) => {
    let x = 0, y = 0, scale = 1;
    switch (id) {
      case '1jari': x = 80; break;
      case '2jari': x = -80; break;
      case '3jari': y = -40; break;
      case '4jari': y = 40; break;
      case 'kepalan': scale = 1.3; break;
      case 'jempol': scale = 1.3; break;
      case 'telapak': break; 
    }
    return { x, y, scale };
  };

  const pos = getPos(activeGesture.id);

  return (
    <main 
      className="relative min-h-screen flex flex-col font-inter items-center justify-center py-10 px-4 overflow-x-hidden selection:bg-[#75FFC3] selection:text-[#2E4F4D]"
      style={{ backgroundColor: '#E3D5D5' }} 
    >
      {/* PROGRESS BAR ATAS */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[55%]" style={{ backgroundImage: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* HEADER */}
      <div className="text-center mb-8 flex flex-col items-center w-full max-w-[1000px]">
        <h3 
          className="font-hind font-semibold text-[18px] md:text-[24px] tracking-[-0.05em] mb-1" 
          style={{ color: '#5A5A5A' }}
        >
          Sebelum mulai sesi foto
        </h3>
        
        <div className="relative mb-2">
          <h1 
            className="font-inter font-bold text-[37px] md:text-[50px] tracking-tight flex items-center justify-center gap-2 leading-tight"
            style={{ 
              color: '#979797',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))'
            }}
          >
            Tutorial Kontrol Glambot
          </h1>
        </div>

        <div className="w-full flex items-center justify-center my-4">
          <div className="h-[4px] rounded-full w-[150px] bg-[#6AC5C3]"></div>
          <div className="w-[15px] h-[15px] mx-4 shrink-0" style={{ background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          <div className="h-[4px] rounded-full w-[150px] bg-[#6AC5C3]"></div>
        </div>

        <p 
          className="font-hind font-semibold text-[18px] md:text-[24px] tracking-[-0.05em]" 
          style={{ color: '#5A5A5A' }}
        >
          Glambot dapat di kontrol melalui gesture tangan seperti di bawah ini...
        </p>

      </div>

      {/* KONTEN UTAMA (Animasi + Grid) */}
      <div className="w-full max-w-[1050px] flex flex-col lg:flex-row gap-5 mb-8 z-10">
        
        {/* PREVIEW ANIMASI ROBOT (Kotak Kiri) */}
        <div 
          className="flex-[1] bg-[#FFFFFF] border-[1.5px] border-[#54868A] rounded-[23px] flex flex-col items-center justify-center relative min-h-[300px] p-6 overflow-hidden shadow-sm"
        >
          <div className="absolute top-[35%] w-[65%] h-[8px] bg-[#424242] rounded-full z-0"></div>

          <div
            className="absolute top-[35%] h-[110px] flex flex-col items-center transition-transform duration-700 ease-in-out z-10"
            style={{ transform: `translateX(${pos.x}px)` }}
          >
            <div className="w-[8px] h-full bg-[#6B6B6B] rounded-full"></div>

            <div 
              className="absolute w-[50px] h-[50px] bg-[#16302F] rounded-[14px] flex items-center justify-center transition-all duration-700 ease-in-out shadow-lg"
              style={{ 
                top: '50%',
                marginTop: '-25px', 
                transform: `translateY(${pos.y}px) scale(${pos.scale})` 
              }}
            >
              <div className={`w-[22px] h-[22px] border-[3px] border-[#3E8568] rounded-full flex items-center justify-center ${activeGesture.id === 'kepalan' || activeGesture.id === 'jempol' ? 'border-[#00FFB7] shadow-[0_0_15px_#00FFB7]' : ''}`}>
                <div className="w-[12px] h-[12px] rounded-full bg-[#27E6A0]"></div>
              </div>
            </div>
          </div>
          
          <h2 className="mt-auto font-inter font-bold text-[24px] text-center drop-shadow-sm text-[#00FF9F] tracking-[-0.02em] z-20">
            {activeGesture.desc}
          </h2>
        </div>

        {/* GRID GESTURE */}
        <div className="flex-[1.5] grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 content-start">
          {gestures.map((gesture) => {
            const isActive = activeGesture.id === gesture.id;
            return (
              <div 
                key={gesture.id}
                className={`w-full aspect-square overflow-hidden flex flex-col items-center justify-center p-2 rounded-[16px] transition-all duration-500 shadow-sm ${
                  isActive 
                    ? 'bg-[#177E79] border-[1.5px] border-[#31BDC7] shadow-[0_0_20px_rgba(49,189,199,0.3)] z-10' 
                    : 'bg-[#FFFFFF] border-[1.5px] border-[#54868A] z-0'
                }`}
              >
                <div className="h-[40px] md:h-[45px] flex items-center justify-center mb-1 shrink-0">
                  {!imgErrors[gesture.id] ? (
                    <Image 
                      src={gesture.img} 
                      alt={gesture.title} 
                      width={45} 
                      height={45} 
                      className={`object-contain w-full h-full transition-opacity duration-500 ${!isActive ? 'opacity-60' : 'opacity-100'}`} 
                      onError={() => setImgErrors(prev => ({...prev, [gesture.id]: true}))} 
                    />
                  ) : (
                    <span className="text-[30px]">👋</span>
                  )}
                </div>

                <h3 className={`font-hind font-bold text-[16px] text-center leading-none mb-1 shrink-0 ${isActive ? 'text-[#00F736]' : 'text-[#64966F]'}`}>
                  {gesture.title}
                </h3>

                <div className="flex flex-col items-center text-center leading-none shrink-0">
                  <span className={`font-hind font-medium text-[12px] px-1 ${isActive ? 'text-[#00FF9F]' : 'text-[#23644B]'}`}>
                    {gesture.desc.split('.')[0]}
                  </span>
                  <span className={`text-[15px] font-bold mt-1 ${isActive ? 'text-[#00FF9F]' : 'text-[#23644B]'}`}>
                    {gesture.icon}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOMBOL BAWAH */}
      <div className="flex items-center justify-center z-10 w-full px-4 mt-2">
        <Link 
          href="/kamera" 
          className="flex items-center justify-center gap-2 w-full sm:w-[217px] h-[49px] border-[3px] border-[#318570] rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 group"
          style={{ 
            height: '49px', 
            background: 'linear-gradient(90deg, #48C5A6 72.6%, #35967E 100%)', 
            border: '3px solid #318570', 
            borderRadius: '23px' 
          }}
        >
          <span className="italic font-inter font-medium text-[20px] text-[#1D4F42] tracking-[-0.06em]" style={{ color: '#1D4F42' }}>
            Siap, mulai foto
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
    </main>
  );
}