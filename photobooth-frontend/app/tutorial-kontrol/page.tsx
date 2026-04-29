'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function TutorialKontrolPage() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // 7 Gestur menggunakan file PNG kustom
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

  const getRobotTransform = (id: string) => {
    switch (id) {
      case '1jari': return 'translate(60px, 0px)';
      case '2jari': return 'translate(-60px, 0px)';
      case '3jari': return 'translate(0px, -70px)';
      case '4jari': return 'translate(0px, 20px)';
      case 'kepalan': return 'scale(1.5)';
      case 'jempol': return 'scale(1.5)';
      default: return 'translate(0px, 0px)';
    }
  };

  return (
    <main 
      className="min-h-screen text-white flex flex-col font-inter items-center py-8 px-4 relative overflow-x-hidden"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      
      {/* --- PROGRESS BAR --- */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[1080px]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full w-[786px]" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* --- HEADER --- */}
      <div className="text-center mt-4 mb-6 flex flex-col items-center">
        <h3 className="font-hind font-semibold text-[22px] tracking-wide mb-1 text-[#A9E2B5]">
          Sebelum mulai sesi foto
        </h3>
        <div className="relative">
          <h1 className="font-inter font-bold text-[46px] tracking-tight flex items-center justify-center gap-2 leading-none text-white drop-shadow-md">
            Tutorial Kontrol Glambot
          </h1>
          <div className="flex justify-center mt-2 mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#3EFFB8]">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <p className="font-hind font-semibold text-[20px] text-[#A9E2B5] mt-1">
          Glambot dapat di kontrol melalui gesture tangan seperti di bawah ini...
        </p>
      </div>

      {/* --- BOX PERINGATAN --- */}
      <div className="w-full max-w-[1100px] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[24px] p-6 mb-6 shadow-lg">
        
        {/* Header Warning */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-[48px] h-[48px] flex items-center justify-center rounded-[10px] shadow-md bg-gradient-to-br from-[#FE8346] to-[#D79D81]">
              <Image src="/warning.png" alt="Warning" width={30} height={30} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl text-black font-bold">!</span>'; }} />
            </div>

            <div className="flex flex-col justify-center">
              <h4 className="font-inter italic font-bold text-[18px] text-[#FFCD9E] drop-shadow-sm">
                Perhatian - Pahami cara kerja Robot!
              </h4>
              <p className="font-inter font-medium text-[13px] text-[#D1D1D1] mt-0.5">
                Baca poin ini agar sesi foto aman & nyaman.
              </p>
            </div>
          </div>
          
          <div className="bg-[#16302F] border border-[#8FA2A4] rounded-full px-4 py-1.5 flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#2BFF2F] to-[#356E00] shadow-[0_0_8px_rgba(43,255,47,0.8)] animate-pulse"></div>
            <span className="font-hind font-bold text-[16px] text-[#E0E0E0] tracking-wider">SIAP</span>
          </div>
        </div>

        {/* 3 Kotak Inner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kotak 1 */}
          <div className="bg-[#223A39] border-[1.5px] border-[#54868A] rounded-[18px] p-5 flex flex-col h-full">
            <h5 className="font-hind font-bold text-[20px] text-[#A9E2B5] mb-3 flex items-center gap-2.5">
              <Image src="/step3.png" alt="Gesture" width={26} height={26} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              Kontrol Gesture
            </h5>
            <ul className="list-disc pl-5 font-hind font-normal text-[15px] text-[#FCFCFC] space-y-1.5 leading-snug">
              <li>Tangan bisa <strong className="text-white">bolak-balik</strong> saat gerakkan robot.</li>
              <li>Ganti gestur? Unlock dulu dengan <strong className="text-white">telapak tangan (5 jari)</strong>.</li>
              <li>Dua tangan/orang terdeteksi — aman, tidak error.</li>
            </ul>
          </div>

          {/* Kotak 2 */}
          <div className="bg-[#223A39] border-[1.5px] border-[#54868A] rounded-[18px] p-5 flex flex-col h-full">
            <h5 className="font-hind font-bold text-[20px] text-[#A9E2B5] mb-3 flex items-center gap-2.5">
              <Image src="/jam.png" alt="Timing" width={26} height={26} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              Timing
            </h5>
            <ul className="list-disc pl-5 font-hind font-normal text-[15px] text-[#FCFCFC] space-y-1.5 leading-snug">
              <li>Transisi gerakan robot: <strong className="text-white">3-5 detik</strong>.</li>
              <li>Mulai sesi foto: <strong className="text-white">hitung mundur 3 detik</strong> otomatis.</li>
              <li>Tidak ada durasi ideal — foto sepuasnya selama sesi.</li>
            </ul>
          </div>

          {/* Kotak 3 */}
          <div className="bg-[#223A39] border-[1.5px] border-[#54868A] rounded-[18px] p-5 flex flex-col h-full">
            <h5 className="font-hind font-bold text-[20px] text-[#A9E2B5] mb-3 flex items-center gap-2.5">
              <Image src="/keamanan.png" alt="Keamanan" width={26} height={26} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              Keamanan
            </h5>
            <ul className="list-disc pl-5 font-hind font-normal text-[15px] text-[#FCFCFC] space-y-1.5 leading-snug">
              <li>Jaga jarak minimal <strong className="text-white">3 meter</strong> dari robot.</li>
              <li>Robot tidak akan overheat, aman untuk sesi panjang.</li>
              <li className="flex items-center">Indikator <span className="inline-block w-3 h-3 rounded-full mx-1.5 bg-gradient-to-br from-[#2BFF2F] to-[#356E00]"></span> hijau = robot siap.</li>
            </ul>
          </div>
        </div>

        {/* Footer Info Box */}
        <div className="mt-6 pt-5 border-t border-[#54868A]/60 grid grid-cols-4 gap-4 text-center divide-x divide-[#54868A]/60">
            <div className="flex flex-col items-center justify-center">
              <span className="font-hind font-bold text-[18px] text-[#4ADECA] uppercase mb-1">JARAK AMAN</span>
              <span className="font-hind font-normal text-[18px] text-[#E0E0E0]">3 Meter</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="font-hind font-bold text-[18px] text-[#4ADECA] uppercase mb-1">TRANSISI</span>
              <span className="font-hind font-normal text-[18px] text-[#E0E0E0]">3 - 5 detik</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="font-hind font-bold text-[18px] text-[#4ADECA] uppercase mb-1">COUNTDOWN</span>
              <span className="font-hind font-normal text-[18px] text-[#E0E0E0]">3 detik</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="font-hind font-bold text-[18px] text-[#4ADECA] uppercase mb-1">STATUS</span>
              <div className="flex items-center gap-2">
                <span className="font-hind font-normal text-[18px] text-[#E0E0E0]">Siap</span>
              </div>
            </div>
        </div>
      </div>

      {/* --- GARIS PEMBATAS TENGAH --- */}
      <div className="w-full max-w-[1100px] flex items-center mb-6">
        <div className="h-[10px] rounded-l-full w-[35%] bg-gradient-to-l from-[#00D5FF] to-[#467664]"></div>
        <div className="flex-grow h-[10px] rounded-r-full bg-gradient-to-r from-[#151515] to-[#252525]"></div>
      </div>

      {/* --- KONTEN UTAMA (ANIMASI & GRID GESTURE) --- */}
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row gap-6 mb-8">
        
        {/* KOTAK KIRI: Preview Animasi Robot */}
        <div className="flex-[1] bg-[#2E4F4D] border-[1.5px] border-[#54868A] rounded-[24px] flex flex-col items-center justify-center relative shadow-lg overflow-hidden min-h-[320px] p-6">
          
          {/* Garis Track Animasi */}
          <div className="absolute top-[28%] w-[65%] h-[6px] bg-[#213736] rounded-full"></div>
          <div className="absolute top-[28%] w-[6px] h-[45%] bg-[#213736] rounded-full"></div>
          
          {/* Robot Node */}
          <div 
            className="absolute top-[50%] w-[54px] h-[54px] bg-[#254040] rounded-[14px] flex items-center justify-center transition-all duration-700 ease-in-out shadow-inner"
            style={{ transform: getRobotTransform(activeGesture.id) }}
          >
            <div className={`w-[26px] h-[26px] border-[4px] border-[#3E8568] rounded-full flex items-center justify-center ${activeGesture.id === 'kepalan' || activeGesture.id === 'jempol' ? 'border-[#00FFB7] shadow-[0_0_15px_#00FFB7]' : ''}`}>
              <div className="w-[14px] h-[14px] rounded-full bg-[#27E6A0]"></div>
            </div>
          </div>
          
          {/* Teks Instruksi Aktif */}
          <h2 className="mt-auto pt-10 font-hind font-bold text-[22px] text-center z-20 text-[#A9E2B5] drop-shadow-md">
            {activeGesture.desc}
          </h2>
        </div>

        {/* KOTAK KANAN: Grid Gesture */}
        <div className="flex-[1.5] grid grid-cols-2 md:grid-cols-4 gap-4 content-start">
          {gestures.map((gesture) => {
            const isActive = activeGesture.id === gesture.id;
            const hasError = imgErrors[gesture.id];
            
            return (
              <div 
                key={gesture.id}
                className={`flex flex-col items-center justify-center p-4 rounded-[20px] transition-all duration-500 shadow-sm ${
                  isActive 
                    ? 'bg-[#177E79] border-[2px] border-[#31BDC7] scale-105 shadow-[0_0_20px_rgba(49,189,199,0.3)] z-10' 
                    : 'bg-[#2E4F4D] border-[1.5px] border-[#54868A] opacity-80'
                }`}
              >
                {/* Ikon Gambar */}
                <div className="flex items-center justify-center mb-2 h-[50px]">
                  {hasError ? (
                    <span className="text-[35px]">👋</span>
                  ) : (
                    <Image 
                      src={gesture.img} 
                      alt={gesture.title} 
                      width={45} 
                      height={45} 
                      className={`object-contain drop-shadow-md transition-transform duration-500 ${isActive ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]' : ''}`}
                      onError={() => setImgErrors(prev => ({ ...prev, [gesture.id]: true }))}
                    />
                  )}
                </div>
                
                {/* Teks Gesture */}
                <h3 className={`font-hind font-bold text-[18px] text-center whitespace-nowrap mb-0.5 ${isActive ? 'text-[#00F736] drop-shadow-md' : 'text-[#A9E2B5]'}`}>
                  {gesture.title}
                </h3>
                <div className="flex flex-col items-center text-center">
                  <span className={`font-hind font-medium text-[13px] leading-tight ${isActive ? 'text-[#00FF9F]' : 'text-[#40A981]'}`}>
                    {gesture.desc.split('.')[0]}
                  </span>
                  <span className={`text-[16px] font-bold mt-0.5 ${isActive ? 'text-[#00FF9F]' : 'text-[#40A981]'}`}>
                    {gesture.icon}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- TOMBOL MULAI FOTO --- */}
      <div className="mt-4 pb-10">
        <Link 
          href="/kamera" 
          className="group flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#48C5A6] to-[#35967E] border-[3px] border-[#318570] px-10 py-3.5 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(72,197,166,0.3)]"
        >
          <span className="font-inter font-bold italic text-[22px] text-[#1D4F42]">
            Siap, mulai foto
          </span>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1D4F42" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
             <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Global font override */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

    </main>
  );
}