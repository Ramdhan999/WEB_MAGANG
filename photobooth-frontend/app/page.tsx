"use client";

import Link from "next/link";
import { usePageSound } from "@/hooks/usePageSound";

export default function Home() {
  usePageSound("/fase/awalan.mp3");
  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-white bg-[#737373]"
    >
      
      <div className="absolute top-0 left-0 w-full h-[75vh] md:h-[65vh] z-0 overflow-hidden pointer-events-none">
        <img 
          src="/bg-keluarga.png" 
          alt="Family Portrait" 
          className="w-full h-full object-cover object-top"
          style={{ 
            opacity: 1,
            filter: 'contrast(1.1) brightness(1)' 
          }} 
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(217, 217, 217, 0.2) 0%, rgba(115, 115, 115, 0) 100%)'
          }}
        />
        <div className="absolute bottom-0 left-0 w-full h-32 md:h-48 bg-gradient-to-t from-[#737373] to-transparent"></div>
      </div>

      {/*KONTEN UTAMA */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen px-4 py-12 gap-8 md:gap-10">
        
        {/* 1. BADGE PREMIUM */}
        <div 
          className="flex items-center justify-center gap-2 shadow-sm w-[280px] md:w-[342px] h-[32px] md:h-[37px] rounded-full"
          style={{
            background: '#476A53',
            border: '1px solid #85DDA6',
            boxSizing: 'border-box'
          }}
        >
          <div className="w-[14px] h-[14px] md:w-[18px] md:h-[18px]" style={{ background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          
          <span 
            className="text-[13px] md:text-[16px] font-bold bg-clip-text text-transparent"
            style={{
              fontFamily: 'Inter, sans-serif', 
              lineHeight: '19px',
              backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)'
            }}
          >
            Premium Glambot Photo Studio
          </span>
        </div>

        {/* 2. LOGO & TEKS GLAMBOT STUDIO */}
        <div className="flex items-center justify-center gap-3 md:gap-[15px]">
          <div 
            className="flex items-center justify-center shadow-lg w-[60px] h-[60px] md:w-[77px] md:h-[77px] rounded-lg"
            style={{
              background: 'linear-gradient(180deg, #48CF8D 0%, #245F69 100%)',
              border: '1px solid #ACFFC1', boxSizing: 'border-box'
            }}
          >
             <img src="/image2.png" alt="Camera Icon" className="w-[30px] h-[30px] md:w-[41px] md:h-[41px] object-contain" />
          </div>
          
          <h2 
            className="text-[36px] md:text-[48px] m-0"
            style={{ fontFamily: 'Inter, sans-serif', lineHeight: '58px' }}
          >
            <span 
              className="not-italic bg-clip-text text-transparent" 
              style={{ 
                fontWeight: 900,
                backgroundImage: 'linear-gradient(90deg, #FFFFFF 0%, #999999 200%)'
              }}
            >
              GLAMBOT
            </span>
            <span 
              className="italic bg-clip-text text-transparent" 
              style={{ 
                fontWeight: 300,
                backgroundImage: 'linear-gradient(273.8deg, #74BECD 23.66%, #96E4A9 63.36%)'
              }}
            >
              STUDIO
            </span>
          </h2>
        </div>

        {/* 3. MAIN TITLE */}
        <div className="flex flex-col items-center">
          <h1 
            className="text-center italic text-[48px] md:text-[96px] m-0 bg-clip-text text-transparent"
            style={{
              fontFamily: 'Inter, sans-serif', 
              fontWeight: 800, 
              backgroundImage: 'linear-gradient(90deg, #999999 0%, #FFFFFF 100%)', 
              lineHeight: '1.1', 
              letterSpacing: '-0.04em'
            }}
          >
            Abadikan Momen
          </h1>
          <h1 
            className="text-center not-italic text-[48px] md:text-[96px] m-0 bg-clip-text text-transparent"
            style={{
              fontFamily: 'Inter, sans-serif', 
              fontWeight: 800, 
              backgroundImage: 'linear-gradient(273.8deg, #74BECD 23.66%, #96E4A9 63.36%)', // Warna sesuai CSS lu
              lineHeight: '1.1', 
              letterSpacing: '-0.04em'
            }}
          >
            Terbaik Kamu
          </h1>
        </div>

        {/* 4. SUBTITLE */}
        <p 
          className="text-center text-[16px] md:text-[20px] max-w-[90%] md:max-w-[600px] mt-[-10px] md:mt-[-20px]"
          style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 400,
            color: '#A2E3CA', lineHeight: '1.4'
          }}
        >
          Robot arm kamera otomatis dengan filter premium & cetak instan<br/>
          Pengalaman foto mandiri yang tak terlupakan.
        </p>

        {/* 5. TOMBOL TOUCH BAWAH */}
        <div className="flex flex-col items-center justify-center mt-6 md:mt-10">
          <Link href="/tutorial" className="group relative flex items-center justify-center cursor-pointer w-[140px] h-[140px] md:w-[184px] md:h-[184px]">
            <div className="absolute transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-110 w-full h-full rounded-full" style={{ background: 'radial-gradient(75% 75% at 50% 50%, rgba(72, 197, 166, 0.4) 0%, rgba(35, 95, 80, 0) 100%)' }}></div>
            <div className="absolute transition-transform duration-700 group-hover:rotate-180 w-[85%] h-[85%] rounded-full border-[1.5px] border-dashed border-[#27B18A] box-border"></div>
            <div className="absolute w-[75%] h-[75%] rounded-full border-[1.5px] border-solid border-[#27B18A] box-border"></div>
            <div className="absolute flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-lg w-[58%] h-[58%] rounded-full bg-[#48C5A6]">
               <img src="/image1.png" alt="Touch" className="w-[45%] h-[45%] object-contain transition-transform duration-300 group-hover:scale-110" />
            </div>
          </Link>
        </div>

      </div>
    </main>
  );
}