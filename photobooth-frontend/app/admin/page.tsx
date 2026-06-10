"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const BACKEND_URL = "http://localhost:8080";

interface RevenueDay {
  day: string;
  label: string;
  revenue: number;
  date: string;
}

interface PopularTemplate {
  name: string;
  sessions: number;
}

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState("");

  const [stats, setStats] = useState({
    sesi_hari_ini: 0,
    pendapatan: 0,
    foto_dicetak: 0,
    kirim_digital: 0,
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenueDay[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<PopularTemplate[]>([]);

  // JAM
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

  // FETCH SEMUA DATA — auto refresh tiap 10 detik
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resStats, resTx, resChart, resTemplates] = await Promise.all([
          fetch(`${BACKEND_URL}/api/admin/dashboard/stats`),
          fetch(`${BACKEND_URL}/api/admin/transactions/recent`),
          fetch(`${BACKEND_URL}/api/admin/dashboard/revenue-chart`),
          fetch(`${BACKEND_URL}/api/admin/dashboard/popular-templates`),
        ]);

        setStats(await resStats.json());
        setTransactions((await resTx.json()) || []);
        setRevenueChart((await resChart.json()) || []);
        setPopularTemplates((await resTemplates.json()) || []);
      } catch (error) {
        console.error("Gagal load data:", error);
      }
    };
    fetchData();

    const intervalData = setInterval(fetchData, 10000);
    return () => clearInterval(intervalData);
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(angka);
  };

  // Format angka ke "X jt" / "Xrb" buat label grafik
  const formatShort = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)} jt`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
    return `${n}`;
  };

  // ===== CHART SCALING =====
  // Cari nilai max buat nentuin skala. Minimal 2jt biar gak gepeng kalo sepi.
  const maxRevenue = Math.max(2_000_000, ...revenueChart.map((d) => d.revenue));
  const CHART_HEIGHT = 320; // px area bar
  const getBarHeight = (revenue: number) => {
    if (maxRevenue === 0) return 0;
    return Math.round((revenue / maxRevenue) * CHART_HEIGHT);
  };

  // Y-axis labels dinamis berdasarkan maxRevenue (5 tingkatan: 0, 25%, 50%, 75%, 100%)
  const yAxisLabels = [1, 0.75, 0.5, 0.25, 0].map((frac) => formatShort(maxRevenue * frac));

  // Hari ini (buat highlight bar warna emas)
  const todayLabel = (() => {
    const map = ['Min', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return map[new Date().getDay()];
  })();

  // ===== TEMPLATE POPULER SCALING =====
  const maxSessions = popularTemplates.length > 0 ? popularTemplates[0].sessions : 1;
  // Warna ranking: 1=gold, 2=teal, 3=orange, sisanya abu
  const rankColors = ["bg-[#FFCE3C]", "bg-[#84BEC2]", "bg-[#E28760]", "bg-[#D9D9D9]", "bg-[#D9D9D9]"];

  // ===== STATUS BADGE HELPERS =====
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
    return null;
  };

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen text-[#3A3A3A] font-inter">

      {/* HEADER */}
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

      {/* STATS CARDS */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Sesi Hari Ini", val: stats.sesi_hari_ini, icon: "/sesi1.png" },
          { label: "Pendapatan", val: formatRupiah(stats.pendapatan), icon: "/pendapatan.png" },
          { label: "Foto Dicetak", val: stats.foto_dicetak, icon: "/cetak.png" },
          { label: "Kirim Digital", val: stats.kirim_digital, icon: "/kirim.png" },
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

      {/* CHART & TEMPLATE */}
      <div className="grid grid-cols-[1.8fr_1fr] gap-6 mb-8">

        {/* ===== GRAFIK PENDAPATAN (dinamis dari API) ===== */}
        <div className="bg-white border border-gray-300 rounded-[12px] p-6 shadow-sm h-[450px] flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-[20px] text-[#3A3A3A]">Pendapatan Minggu Ini</h2>
            <span className="text-[13px] text-gray-500">Senin–Minggu</span>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Y-AXIS LABELS (dinamis) */}
            <div className="flex flex-col justify-between text-[#8C8888] font-bold text-[13px] pr-4 pb-10">
              {yAxisLabels.map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </div>

            {/* BARS */}
            <div className="flex-1 flex flex-col h-full">
              <div className="flex-1 flex items-end justify-between border-b-[2px] border-gray-300">
                {revenueChart.length === 0 ? (
                  <div className="w-full flex items-center justify-center text-gray-400 font-bold pb-10">
                    Memuat data pendapatan...
                  </div>
                ) : (
                  revenueChart.map((d, i) => {
                    const barHeight = getBarHeight(d.revenue);
                    const isToday = d.label === todayLabel;
                    return (
                      <div key={i} className="flex flex-col items-center w-full relative group">
                        {/* Label nominal di atas bar (cuma kalo ada revenue) */}
                        {d.revenue > 0 && (
                          <span className="absolute font-bold text-[#8C8888] text-[13px]" style={{ bottom: `${barHeight + 6}px` }}>
                            {formatShort(d.revenue)}
                          </span>
                        )}
                        <div
                          className={`w-[60px] rounded-t-[10px] transition-all duration-500 ${isToday ? 'bg-gradient-to-t from-[#716337] to-[#D7BB68]' : 'bg-gradient-to-t from-[#339593] to-[#43C5C3]'}`}
                          style={{ height: `${barHeight}px` }}
                          title={`${d.label}: ${formatRupiah(d.revenue)}`}
                        ></div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* X-AXIS LABELS */}
              <div className="flex justify-between pt-4 px-2">
                {(revenueChart.length > 0 ? revenueChart.map((d) => d.label) : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Min']).map((day, i) => (
                  <span key={i} className={`font-bold text-[15px] w-[60px] text-center ${day === todayLabel ? 'text-[#9A7B2A]' : 'text-[#436B60]'}`}>{day}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== TEMPLATE POPULER (dinamis dari API) ===== */}
        <div className="bg-white border border-gray-300 rounded-[12px] p-6 shadow-sm h-[450px] overflow-y-auto">
          <h2 className="font-bold text-[28px] text-[#3A3A3A] mb-6">Template Populer</h2>

          {popularTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
              <span className="text-[40px] mb-2 opacity-30">📊</span>
              <p className="font-bold text-[15px]">Belum ada data template</p>
              <p className="text-[13px] text-center mt-1">Template bakal muncul di sini setelah ada yang dipakai user</p>
            </div>
          ) : (
            <div className="space-y-5">
              {popularTemplates.map((t, i) => {
                const widthPct = maxSessions > 0 ? Math.round((t.sessions / maxSessions) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`${rankColors[i] || 'bg-[#D9D9D9]'} w-[40px] h-[40px] rounded-[8px] flex items-center justify-center font-bold text-[22px] shrink-0`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[18px] leading-tight truncate">{t.name}</p>
                      <p className="text-[13px] text-[#646464]">{t.sessions} sesi</p>
                    </div>
                    <div className="w-[120px] h-[10px] bg-[#E0E0E0] rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full bg-[#2A9375] rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TABEL TRANSAKSI TERBARU */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-[20px] p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-[22px] text-[#3A3A3A]">Transaksi Terbaru</h2>
            <p className="text-[13px] text-gray-500">10 transaksi terakhir</p>
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
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-gray-400 font-bold">Belum ada transaksi hari ini</td>
              </tr>
            ) : (
              transactions.map((t, i) => (
                <tr key={i} className="border-b border-gray-200 text-[14px] text-[#525252] hover:bg-gray-50">
                  <td className="py-3 font-bold bg-gray-50/50">{t.id}</td>
                  <td className="py-3">{t.time}</td>
                  <td className="py-3 font-bold">{t.method}</td>
                  <td className="py-3">{t.template}</td>
                  <td className="py-3">
                    {t.output === '-' || !t.output ? (
                      <span className="text-gray-400 font-bold">-</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 px-2 py-1 bg-[#E2E2E2] border border-gray-400 rounded-md font-bold text-[12px] w-[90px] mx-auto">
                        <img src={t.output === 'Digital' ? '/digital.png' : '/cetak1.png'} className="w-4 h-4" /> {t.output}
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md font-bold text-[12px] border ${getStatusClass(t.status)}`}>
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
  );
}