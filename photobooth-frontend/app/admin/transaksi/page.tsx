"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import Papa from "papaparse";

export default function TransaksiPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const transactions = [
    { id: "TX1032", time: "20:32", method: "QRIS", amount: "Rp 45.000", template: "Classic Grid", output: "Digital", status: "Selesai" },
    { id: "TX1033", time: "20:32", method: "QRIS", amount: "Rp 55.000", template: "Classic Strip", output: "Digital", status: "Selesai" },
    { id: "TX1035", time: "20:32", method: "QRIS", amount: "Rp 45.000", template: "Minecraft Strip", output: "Digital", status: "Gagal" },
    { id: "TX1036", time: "20:32", method: "QRIS", amount: "Rp 35.000", template: "Minecraft Strip", output: "Cetak", status: "Selesai" },
  ];

  const handleExportCSV = () => {
    const csv = Papa.unparse(transactions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transaksi_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen font-inter">
      
      {/* HEADER YANG DIBUNGKUS CARD PUTIH */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-[20px] p-6 mb-6 flex justify-between items-center">
        <div>
           <h1 className="font-bold text-[32px] text-[#3A3A3A]">Riwayat Transaksi</h1>
           <p className="text-[16px] text-[#646464]">Semua transaksi tercatat</p>
        </div>
        
        <div className="flex gap-3">
           <div className="flex items-center gap-2 bg-[#D9D9D9] border border-gray-400 px-4 py-2 rounded-[8px]">
              <img src="/date.png" alt="Date" className="w-5 h-5" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-[14px] text-[#525252] outline-none cursor-pointer"
              />
           </div>
           
           <button 
             onClick={handleExportCSV}
             className="flex items-center gap-2 bg-[#D9D9D9] border border-gray-400 px-4 py-2 rounded-[8px] font-bold text-[14px] text-[#525252] hover:bg-gray-300 transition-colors"
           >
              <img src="/icon4.png" alt="Export" className="w-5 h-5" /> Export CSV
           </button>
        </div>
      </div>

      {/* TABEL */}
      <div className="bg-[#ECECEC] border border-gray-300 shadow-sm rounded-[20px] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse bg-white border border-gray-300 rounded-[10px] overflow-hidden">
            <thead className="bg-[#D9D9D9]">
              <tr>
                {['ID', 'WAKTU', 'METODE', 'JUMLAH', 'TEMPLATE', 'OUTPUT', 'STATUS'].map(h => 
                  <th key={h} className="py-4 text-[14px] font-bold text-[#3A3A3A] border-b border-gray-300">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i} className="border-b border-gray-200 text-[14px] hover:bg-gray-50">
                  <td className="py-3 font-bold bg-gray-50/50">{t.id}</td>
                  <td className="py-3">{t.time}</td>
                  <td className="py-3"><span className="px-3 py-1 bg-[#D9D9D9] rounded-md font-bold">{t.method}</span></td>
                  <td className="py-3 font-bold">{t.amount}</td>
                  <td className="py-3">{t.template}</td>
                  <td className="py-3">
                    <span className="flex items-center justify-center gap-2 px-2 py-1 bg-[#E2E2E2] border rounded-md font-bold w-[95px] mx-auto">
                        <img src={t.output === 'Digital' ? '/digital.png' : '/cetak1.png'} className="w-4 h-4" /> {t.output}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-md font-bold ${t.status === 'Selesai' ? 'bg-[#DCE3DC]' : 'bg-[#E8CECE]'}`}>
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
    </div>
  );
}