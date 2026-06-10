"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import Papa from "papaparse";

export default function TransaksiPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA — refresh otomatis pas tanggal berubah
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8080/api/admin/transactions?date=${selectedDate}`);
        const data = await res.json();
        setTransactions(data || []);
      } catch (err) {
        console.error("Gagal load:", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  const formatRupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  // STATUS HELPERS (match enum baru)
  const getStatusLabel = (s: string) => {
    if (s === 'success') return 'Sukses';
    if (s === 'pending') return 'Pending';
    if (s === 'failed') return 'Gagal';
    return s;
  };
  const getStatusClass = (s: string) => {
    if (s === 'success') return 'bg-[#DCE3DC] border-gray-300';
    if (s === 'pending') return 'bg-yellow-100 border-yellow-400';
    return 'bg-[#E8CECE] border-gray-300';
  };
  const getStatusIcon = (s: string): string | null => {
    if (s === 'success') return '/selesai.png';
    if (s === 'failed') return '/gagal.png';
    return null; // pending pake emoji
  };

  // EXPORT CSV — pake data real, bukan hardcoded
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("Belum ada transaksi untuk di-export pada tanggal ini");
      return;
    }
    const csvData = transactions.map(t => ({
      ID: t.id,
      Waktu: t.time,
      Metode: t.method,
      Jumlah: t.amount,
      Template: t.template,
      Output: t.output,
      Status: getStatusLabel(t.status),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transaksi_${selectedDate}.csv`;
    link.click();
  };

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen font-inter">

      {/* HEADER */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-[20px] p-6 mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-[32px] text-[#3A3A3A]">Riwayat Transaksi</h1>
          <p className="text-[16px] text-[#646464]">
            {loading ? "Memuat..." : `${transactions.length} transaksi pada ${format(new Date(selectedDate + 'T00:00:00'), 'dd MMMM yyyy')}`}
          </p>
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
            disabled={transactions.length === 0}
            className="flex items-center gap-2 bg-[#D9D9D9] border border-gray-400 px-4 py-2 rounded-[8px] font-bold text-[14px] text-[#525252] hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-gray-400 font-bold">Memuat data transaksi...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-gray-400 font-bold">
                    Belum ada transaksi pada tanggal ini
                  </td>
                </tr>
              ) : (
                transactions.map((t, i) => (
                  <tr key={i} className="border-b border-gray-200 text-[14px] hover:bg-gray-50">
                    <td className="py-3 font-bold bg-gray-50/50">{t.id}</td>
                    <td className="py-3">{t.time}</td>
                    <td className="py-3">
                      <span className="px-3 py-1 bg-[#D9D9D9] rounded-md font-bold">{t.method}</span>
                    </td>
                    <td className="py-3 font-bold">{formatRupiah(t.amount)}</td>
                    <td className="py-3">{t.template}</td>
                    <td className="py-3">
                      {t.output === '-' || !t.output ? (
                        <span className="text-gray-400 font-bold">-</span>
                      ) : (
                        <span className="flex items-center justify-center gap-2 px-2 py-1 bg-[#E2E2E2] border border-gray-300 rounded-md font-bold w-[95px] mx-auto">
                          <img src={t.output === 'Digital' ? '/digital.png' : '/cetak1.png'} className="w-4 h-4" /> {t.output}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-md font-bold border ${getStatusClass(t.status)}`}>
                        {getStatusIcon(t.status) ? (
                          <img src={getStatusIcon(t.status)!} className="w-4 h-4" alt={t.status} />
                        ) : (
                          <span>⏳</span>
                        )}
                        {getStatusLabel(t.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}