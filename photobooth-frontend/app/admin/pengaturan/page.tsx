"use client";

import React, { useState } from "react";

export default function PengaturanPage() {
  const [isNotifOn, setIsNotifOn] = useState(true);

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen font-inter">
      
      {/* HEADER */}
      <div className="bg-white border border-gray-300 rounded-[8px] p-6 mb-8 shadow-sm">
        <h1 className="text-[36px] font-bold text-[#3A3A3A] leading-tight">Pengaturan Umum</h1>
        <p className="text-[20px] text-[#646464] mt-1">Konfigurasi booth dan admin</p>
      </div>

      {/* TOP GRID: BOOTH, ACCESS, TAMPILAN */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        
        {/* Informasi Booth */}
        <div className="bg-white p-6 rounded-[8px] border border-gray-300 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <img src="/booth.png" className="w-[33px] h-[33px]" />
            <h2 className="text-[24px] font-bold text-[#3A3A3A]">Informasi Booth</h2>
          </div>
          <div className="space-y-4">
            {['Nama Booth', 'Lokasi', 'Kode booth'].map(label => (
              <div key={label}>
                <label className="block text-[14px] font-bold text-[#3A3A3A] mb-1">{label}</label>
                <input className="w-full px-4 py-2 border border-gray-400 rounded-[14px] text-[15px]" placeholder="Isi detail..." />
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-[#386359] text-white font-bold rounded-[14px] hover:bg-[#2c4e47]">Simpan</button>
        </div>

        {/* Admin Access */}
        <div className="bg-white p-6 rounded-[8px] border border-gray-300 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <img src="/access.png" className="w-[33px] h-[33px]" />
            <h2 className="text-[24px] font-bold text-[#3A3A3A]">Admin Access</h2>
          </div>
          <div className="space-y-4">
            {['Nama Admin', 'Pin Admin (4 digit)', 'Email Notifikasi'].map(label => (
              <div key={label}>
                <label className="block text-[14px] font-bold text-[#3A3A3A] mb-1">{label}</label>
                <input className="w-full px-4 py-2 border border-gray-400 rounded-[14px] text-[15px]" />
              </div>
            ))}
            <div className="flex justify-between items-center bg-[#E5E5E5] p-3 rounded-[14px]">
              <span className="font-bold text-[14px]">Notifikasi WhatsApp</span>
              <div onClick={() => setIsNotifOn(!isNotifOn)} className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer ${isNotifOn ? 'bg-[#386359]' : 'bg-[#A29C9C]'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${isNotifOn ? 'translate-x-[18px]' : ''}`}></div>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-3 bg-[#386359] text-white font-bold rounded-[14px] hover:bg-[#2c4e47]">Simpan</button>
        </div>

        {/* Tampilan User */}
        <div className="bg-white p-6 rounded-[8px] border border-gray-300 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <img src="/tampil.png" className="w-[33px] h-[33px]" />
            <h2 className="text-[24px] font-bold text-[#3A3A3A]">Tampilan User</h2>
          </div>
          <label className="block text-[14px] font-bold text-[#3A3A3A] mb-1">Splash Text</label>
          <input className="w-full px-4 py-2 border border-gray-400 rounded-[14px] mb-4" placeholder="Abadikan Momen Terbaik Kamu" />
          <label className="block text-[14px] font-bold text-[#3A3A3A] mb-3">Accent Color</label>
          <div className="flex gap-2 mb-8">
            {[ '#C8A45A', '#E2C07C', '#C07840', '#8B9E8A', '#9A94C8', '#B8B09A'].map(color => (
              <div key={color} style={{backgroundColor: color}} className="w-[50px] h-[50px] rounded-full border border-gray-300 cursor-pointer"></div>
            ))}
          </div>
          <button className="w-full py-3 bg-[#386359] text-white font-bold rounded-[14px] hover:bg-[#2c4e47]">Simpan</button>
        </div>
      </div>

      {/* THEME SYSTEM */}
      <div className="bg-white p-6 rounded-[8px] border border-gray-300 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-6">
            <img src="/theme.png" className="w-[33px] h-[33px]" />
            <h2 className="text-[24px] font-bold text-[#3A3A3A]">Theme System</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
           {[{name: 'Calm', desc: 'Teal - Sage - Sand', bg: 'bg-[#D2F3EC]'}, {name: 'Vibrant', desc: 'Peach - Lavender - Cream', bg: 'bg-white'}, {name: 'Festive', desc: 'Lantern Red - Gold - Jade', bg: 'bg-white'}].map((theme, i) => (
             <div key={theme.name} className={`p-4 rounded-[8px] border-2 ${i === 0 ? 'border-[#3F6E68]' : 'border-gray-200'}`}>
                <div className="flex gap-2 mb-4">
                  {[1,2,3].map(c => <div key={c} className="w-[45px] h-[45px] bg-gray-400 rounded-full border border-black"></div>)}
                </div>
                <h3 className="font-bold text-[20px]">{theme.name}</h3>
                <p className="text-[14px] text-gray-600 mb-3">{theme.desc}</p>
                <span className="px-3 py-1 bg-[#D9D9D9] rounded-full text-[12px] font-bold">WEEKDAY / PREMIUM</span>
             </div>
           ))}
        </div>
      </div>

      {/* MAINTENANCE */}
      <div className="bg-white p-6 rounded-[8px] border border-gray-300 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <img src="/maintenance.png" className="w-[33px] h-[33px]" />
            <h2 className="text-[24px] font-bold text-[#3A3A3A]">Maintenance</h2>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 border border-gray-400 rounded-[14px] font-bold"><img src="/icon4.png" className="w-5" /> Export Semua Data</button>
           <button className="flex items-center gap-2 px-6 py-3 border border-gray-400 rounded-[14px] font-bold"><img src="/sampah.png" className="w-5" /> Reset Data Hari Ini</button>
           <button className="flex items-center gap-2 px-6 py-3 bg-[#F3CCCC] border border-gray-400 rounded-[14px] font-bold text-red-700"><img src="/segitiga.png" className="w-5" /> Factory Reset</button>
        </div>
        <p className="mt-6 text-[14px] text-gray-500 font-mono text-center">v2.0.0 - Build 2025.06 - Synced with user</p>
      </div>

    </div>
  );
}