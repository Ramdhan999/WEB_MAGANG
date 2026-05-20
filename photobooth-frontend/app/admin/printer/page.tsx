"use client";

import React, { useState } from "react";

export default function PrinterPage() {
  const [isFailTest, setIsFailTest] = useState(false);
  const [isRingLightOn, setIsRingLightOn] = useState(true);
  const [isLedStripOn, setIsLedStripOn] = useState(true);
  const [isScreensaverOn, setIsScreensaverOn] = useState(true);
  const [lightBrightness, setLightBrightness] = useState(85);

  // Fungsi buat ngerapiin desain: Card disamain tingginya dan elemen naik ke atas
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white p-5 rounded-[12px] border border-gray-300 shadow-sm flex flex-col h-[520px]">
      {children}
    </div>
  );

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen font-inter">
      <div className="bg-white border border-gray-300 rounded-[8px] p-6 mb-8 shadow-sm">
        <h1 className="text-[36px] font-bold text-[#3A3A3A] leading-tight">Printer & Hardware</h1>
        <p className="text-[16px] text-[#646464] mt-1">Status printer dan hardware booth</p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        
        {/* 1. STATUS PRINTER */}
        <Card>
          <div className="w-[67px] h-[67px] bg-[#B1DBD4] border border-black/20 rounded-[16px] flex items-center justify-center mb-4">
             <img src="/cetak1.png" alt="Printer" className="w-[33px] h-[33px] object-contain" />
          </div>
          <h3 className="font-bold text-[20px] text-[#3A3A3A] mb-4">Status Printer</h3>
          <div className="bg-[#E7EFEB] border border-[#94BBBD] rounded-[10px] py-2.5 px-4 flex items-center gap-2.5 mb-5">
            <div className="w-3 h-3 bg-[#3EA47B] rounded-full"></div>
            <span className="font-bold text-[#3EA47B] text-[14px]">Online - Siap Cetak</span>
          </div>
          <div className="space-y-3 mb-auto">
             <div className="flex justify-between border-b border-gray-300 pb-2"><span className="text-[14px] text-[#898A8A]">Model</span><span className="font-bold text-[14px]">DNP DS620</span></div>
             <div className="flex justify-between border-b border-gray-300 pb-2"><span className="text-[14px] text-[#898A8A]">Koneksi</span><span className="font-bold text-[14px]">USB</span></div>
             <div className="flex justify-between border-b border-gray-300 pb-2"><span className="text-[14px] text-[#898A8A]">Print hari ini</span><span className="font-bold text-[14px]">18</span></div>
          </div>
          <div className="space-y-3 mt-4">
             <button onClick={() => alert("Test Print")} className="w-full py-2.5 bg-white border border-gray-400 rounded-[10px] flex items-center justify-center gap-2 hover:bg-gray-50"><img src="/test.png" className="w-4 h-4 opacity-70" /><span className="font-bold text-[14px]">Test Print</span></button>
             <div className="flex justify-between items-center bg-[#E8E8E8] border border-gray-300 px-4 py-2.5 rounded-[10px]">
                <span className="text-[12px] text-[#616161]">Simulasi: Paksa Gagal</span>
                <div onClick={() => setIsFailTest(!isFailTest)} className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer ${isFailTest ? 'bg-[#CF4D4D]' : 'bg-[#A29C9C]'}`}><div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${isFailTest ? 'translate-x-[18px]' : ''}`}></div></div>
             </div>
             <button onClick={() => alert("Booth Offline")} className="w-full py-2.5 bg-white border border-gray-400 rounded-[10px] flex items-center justify-center gap-2 hover:bg-gray-50"><img src="/off.png" className="w-4 h-4 opacity-70" /><span className="font-bold text-[14px]">Tandai Booth Offline</span></button>
          </div>
        </Card>

        {/* 2. KERTAS & RIBBON */}
        <Card>
          <div className="w-[67px] h-[67px] bg-[#B1DBD4] border border-black/20 rounded-[16px] flex items-center justify-center mb-4">
             <img src="/kertas.png" alt="Kertas" className="w-[33px] h-[33px] object-contain" />
          </div>
          <h3 className="font-bold text-[20px] text-[#3A3A3A] mb-6">Kertas & Ribbon</h3>
          <div className="space-y-5 mb-6">
             <div><div className="flex justify-between text-[13px] mb-1"><span>Kertas 4×6"</span> <span className="font-bold">230/400</span></div><div className="w-full bg-gray-300 h-2 rounded-full"><div className="bg-[#45BBAB] h-full w-[58%] rounded-full"></div></div></div>
             <div><div className="flex justify-between text-[13px] mb-1"><span>Ribbon</span> <span className="font-bold">180/300</span></div><div className="w-full bg-gray-300 h-2 rounded-full"><div className="bg-[#45BBAB] h-full w-[60%] rounded-full"></div></div></div>
          </div>
          {/* Tombol Reset dengan sedikit space di atas */}
          <button 
            onClick={() => alert("Reset!")} 
            className="w-full mt-6 py-2.5 bg-white border border-gray-400 rounded-[10px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-[#616161]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          <span className="font-bold text-[14px] text-[#616161]">Reset Hitungan Kertas</span>
          </button>
        </Card>

        {/* 3. LAMPU & LED */}
        <Card>
          <div className="w-[67px] h-[67px] bg-[#B1DBD4] border border-black/20 rounded-[16px] flex items-center justify-center mb-4">
             <img src="/lampu.png" alt="Lampu" className="w-[33px] h-[33px] object-contain" />
          </div>
          <h3 className="font-bold text-[20px] text-[#3A3A3A] mb-1">Lampu & LED</h3>
          <p className="text-[12px] text-[#616161] mb-5">Kontrol Pencahayaan booth</p>
          <div className="space-y-3 mb-5">
             <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-3 py-2 rounded-[8px]"><span className="font-bold text-[13px] text-[#616161]">Ring Light</span><div onClick={() => setIsRingLightOn(!isRingLightOn)} className={`w-9 h-5 rounded-full flex items-center px-1 cursor-pointer ${isRingLightOn ? 'bg-[#2F5A4D]' : 'bg-[#A29C9C]'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${isRingLightOn ? 'translate-x-[18px]' : ''}`}></div></div></div>
             <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-3 py-2 rounded-[8px]"><span className="font-bold text-[13px] text-[#616161]">LED Strip Ambient</span><div onClick={() => setIsLedStripOn(!isLedStripOn)} className={`w-9 h-5 rounded-full flex items-center px-1 cursor-pointer ${isLedStripOn ? 'bg-[#2F5A4D]' : 'bg-[#A29C9C]'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${isLedStripOn ? 'translate-x-[18px]' : ''}`}></div></div></div>
          </div>
          {/* Brightness dinaikin */}
          <span className="font-bold text-[13px] text-[#616161] block mb-2">Brightness</span>
          <input type="range" value={lightBrightness} onChange={(e) => setLightBrightness(Number(e.target.value))} className="w-full h-1 bg-gray-300 rounded-lg accent-[#2F5A4D]" />
        </Card>

        {/* 4. MONITOR & DISPLAY */}
        <Card>
          <div className="w-[67px] h-[67px] bg-[#B1DBD4] border border-black/20 rounded-[16px] flex items-center justify-center mb-4">
             <img src="/monitor.png" alt="Monitor" className="w-[33px] h-[33px] object-contain" />
          </div>
          <h3 className="font-bold text-[20px] text-[#3A3A3A] mb-1">Monitor & Display</h3>
          <p className="text-[12px] text-[#616161] mb-5">Layar Booth</p>
          <div className="space-y-2 mb-6">
             <div className="flex justify-between border-b pb-1.5"><span className="text-[13px] text-gray-500">Resolusi</span> <span className="font-bold text-[13px]">1920×1080</span></div>
             <div className="flex justify-between border-b pb-1.5"><span className="text-[13px] text-gray-500">Orientasi</span> <span className="font-bold text-[13px]">Portrait</span></div>
             <div className="flex justify-between border-b pb-1.5"><span className="text-[13px] text-gray-500">Brightness</span> <span className="font-bold text-[13px]">85%</span></div>
          </div>
          {/* Screensaver dinaikin */}
          <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-3 py-2 rounded-[8px]">
             <span className="font-bold text-[13px] text-[#616161]">Screensaver (3m)</span>
             <div onClick={() => setIsScreensaverOn(!isScreensaverOn)} className={`w-9 h-5 rounded-full flex items-center px-1 cursor-pointer ${isScreensaverOn ? 'bg-[#2F5A4D]' : 'bg-[#A29C9C]'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${isScreensaverOn ? 'translate-x-[18px]' : ''}`}></div></div>
          </div>
        </Card>

      </div>
    </div>
  );
}