"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('id-ID', { 
        weekday: 'short', day: 'numeric', month: 'short', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      }).replace(/\./g, ':'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const transactions = [
    { id: "TX1032", time: "20:32", method: "QRIS", template: "Classic Grid", output: "Digital", status: "Selesai" },
    { id: "TX1033", time: "20:32", method: "QRIS", template: "Classic Strip", output: "Digital", status: "Selesai" },
    { id: "TX1034", time: "20:32", method: "QRIS", template: "Cinema Duo", output: "Digital", status: "Selesai" },
    { id: "TX1035", time: "20:32", method: "QRIS", template: "Minecraft Strip", output: "Digital", status: "Gagal" },
    { id: "TX1036", time: "20:32", method: "QRIS", template: "Minecraft Strip", output: "Cetak", status: "Selesai" },
    { id: "TX1037", time: "20:32", method: "QRIS", template: "Cinema Duo", output: "Digital", status: "Gagal" },
    { id: "TX1038", time: "20:32", method: "QRIS", template: "Classic Strip", output: "Cetak", status: "Selesai" },
    { id: "TX1039", time: "20:32", method: "VOUCHER", template: "Classic Grid", output: "Digital", status: "Selesai" },
  ];

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen text-[#3A3A3A] font-inter">
      
      {/* 1. HEADER */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-[12px] p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-[14px] text-[#4B9081] uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#4B9081] rounded-full"></span> SELAMAT DATANG
            </p>
            <h2 className="font-bold text-[36px] text-[#3A3A3A] leading-none mb-1">Dashboard</h2>
            <p className="text-[16px] text-[#646464]">Ringkasan aktivitas booth hari ini</p>
          </div>
          <div className="bg-[#D9D9D9] border border-black/20 px-4 py-2 rounded-[8px] font-bold text-[14px] text-[#525252]">
            {currentTime || "Loading..."}
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Sesi Hari Ini", val: "24", icon: "/sesi1.png" },
          { label: "Pendapatan", val: "Rp. 600,000", icon: "/pendapatan.png" },
          { label: "Foto Dicetak", val: "18", icon: "/cetak.png" },
          { label: "Kirim Digital", val: "9", icon: "/kirim.png" },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-gray-300 border-l-[6px] border-l-[#41BDA9] rounded-[8px] p-5 flex items-center gap-4 shadow-sm h-[110px]">
            <div className="w-[45px] h-[45px] bg-[#E0F2F0] rounded-[6px] flex items-center justify-center shrink-0">
                <img src={item.icon} alt={item.label} className="w-[24px] h-[24px] object-contain" />
            </div>
            <div className="min-w-0"> 
              <p className="font-bold text-[24px] text-[#3A3A3A] leading-none mb-1 truncate">{item.val}</p>
              <p className="text-[14px] text-[#646464] leading-none truncate">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. CHART & TEMPLATE */}
      <div className="grid grid-cols-[1.8fr_1fr] gap-6 mb-8">
        
        {/* Grafik Area */}
        <div className="bg-white border border-gray-300 rounded-[12px] p-6 shadow-sm h-[450px] flex">
           {/* Label Y-Axis */}
           <div className="flex flex-col justify-between text-[#8C8888] font-bold text-[14px] pr-4 pb-10">
              <span>2 jt</span>
              <span>1.5 jt</span>
              <span>1.0 jt</span>
              <span>500rb</span>
              <span>0</span>
           </div>

           {/* Batang & Label X-Axis */}
           <div className="flex-1 flex flex-col h-full">
             <div className="flex-1 flex items-end justify-between border-b-[2px] border-gray-300">
               {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Min'].map((day, i) => (
                  <div key={day} className="flex flex-col items-center w-full relative group">
                      {i === 0 && <span className="absolute -top-7 font-bold text-[#8C8888] text-[14px]">1.04 jt</span>}
                      {i === 1 && <span className="absolute -top-7 font-bold text-[#8C8888] text-[14px]">1.27 jt</span>}
                      
                      <div className={`w-[70px] ${i === 6 ? 'h-[280px] bg-gradient-to-t from-[#716337] to-[#D7BB68]' : i===5 ? 'h-[320px] bg-gradient-to-t from-[#339593] to-[#43C5C3]' : i===3 ? 'h-[260px] bg-gradient-to-t from-[#339593] to-[#43C5C3]' : i===4 ? 'h-[200px] bg-gradient-to-t from-[#339593] to-[#43C5C3]' : i===1 ? 'h-[230px] bg-gradient-to-t from-[#339593] to-[#43C5C3]' : i===2 ? 'h-[140px] bg-gradient-to-t from-[#339593] to-[#43C5C3]' : 'h-[180px] bg-gradient-to-t from-[#339593] to-[#43C5C3]'} rounded-t-[10px]`}></div>
                  </div>
               ))}
             </div>
             <div className="flex justify-between pt-4 px-2">
               {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Min'].map((day) => (
                  <span key={day} className="font-bold text-[16px] text-[#436B60] w-[70px] text-center">{day}</span>
               ))}
             </div>
           </div>
        </div>

        {/* Template List Area */}
        <div className="bg-white border border-gray-300 rounded-[12px] p-6 shadow-sm h-[450px]">
           <h2 className="font-bold text-[28px] text-[#3A3A3A] mb-6">Template Populer</h2>
           <div className="space-y-5">
              {[ 
                {n:"Classic Strip", s:"49 sesi", c:"bg-[#FFCE3C]", w:"w-[85%]"}, 
                {n:"Classic Grid", s:"38 sesi", c:"bg-[#84BEC2]", w:"w-[65%]"}, 
                {n:"Classic Collage", s:"25 sesi", c:"bg-[#E28760]", w:"w-[45%]"},
                {n:"Cinema Grid", s:"22 sesi", c:"bg-[#D9D9D9]", w:"w-[40%]"},
                {n:"Cinema Strip", s:"20 sesi", c:"bg-[#D9D9D9]", w:"w-[35%]"}
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-4">
                   <div className={`${t.c} w-[40px] h-[40px] rounded-[8px] flex items-center justify-center font-bold text-[22px]`}>{i + 1}</div>
                   <div className="flex-1 min-w-0">
                     <p className="font-bold text-[18px] leading-tight truncate">{t.n}</p>
                     <p className="text-[13px] text-[#646464]">{t.s}</p>
                   </div>
                   <div className="w-[120px] h-[10px] bg-[#E0E0E0] rounded-full overflow-hidden shrink-0">
                      <div className={`${t.w} h-full bg-[#2A9375] rounded-full`}></div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* 4. TABEL TRANSAKSI (Terhubung ke halaman Transaksi) */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-[20px] p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-[22px] text-[#3A3A3A]">Transaksi Terbaru</h2>
            <p className="text-[13px] text-gray-500">5 transaksi terakhir</p>
          </div>
          <Link href="/admin/transaksi" className="bg-[#D9D9D9] border border-gray-400 hover:bg-gray-300 transition-colors rounded-[8px] px-6 py-2 font-bold text-[15px] flex items-center gap-2">
            Lihat Semua <span>→</span>
          </Link>
        </div>

        <table className="w-full text-center border-collapse bg-[#F9F9F9] border border-gray-300 rounded-[10px] overflow-hidden shadow-sm">
          <thead className="bg-[#D9D9D9]">
            <tr>
              {['ID', 'WAKTU', 'METODE', 'TEMPLATE', 'OUTPUT', 'STATUS'].map(h => 
                <th key={h} className="py-4 text-[15px] font-bold text-[#3A3A3A] border-b border-gray-300">{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 5).map((t, i) => (
              <tr key={i} className="border-b border-gray-200 text-[14px] text-[#525252] hover:bg-gray-50">
                <td className="py-3 font-bold bg-gray-50/50">{t.id}</td>
                <td className="py-3">{t.time}</td>
                <td className="py-3 font-bold">{t.method}</td>
                <td className="py-3">{t.template}</td>
                <td className="py-3">
                  <span className="flex items-center justify-center gap-2 px-2 py-1 bg-[#E2E2E2] border border-gray-400 rounded-md font-bold text-[12px] w-[90px] mx-auto">
                    <img src={t.output === 'Digital' ? '/digital.png' : '/cetak1.png'} className="w-4 h-4" /> {t.output}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md font-bold text-[12px] border ${t.status === 'Selesai' ? 'bg-[#DCE3DC] border-gray-300' : 'bg-[#E8CECE] border-gray-300'}`}>
                    <img src={t.status === 'Selesai' ? '/selesai.png' : '/gagal.png'} className="w-4 h-4" />
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}