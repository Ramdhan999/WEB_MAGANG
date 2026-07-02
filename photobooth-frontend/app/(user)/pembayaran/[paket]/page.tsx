"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePageSound } from "@/hooks/usePageSound";

// ===== TIPE DATA DARI API =====
interface ApiPackage {
  id: number;
  package_id: string;
  name: string;
  badge: string;
  price: number;
  duration: number;
  max_people: number;
  print_count: number;
  icon_url: string;
  is_popular: boolean;
  is_active: boolean;
}

// ===== PALETTE WARNA (sama dengan PilihPaketPage biar konsisten) =====
const COLOR_PALETTE = [
  { avatarBg: "linear-gradient(147.96deg, #FEA685 39.28%, #FDBB9E 113.17%)" }, // orange
  { avatarBg: "linear-gradient(147.96deg, #BA96FD 39.28%, #CBAFFE 113.17%)" }, // purple
  { avatarBg: "linear-gradient(147.96deg, #6FEABC 39.28%, #94F0CC 113.17%)" }, // green
  { avatarBg: "linear-gradient(147.96deg, #F6CA7E 39.28%, #FCD79A 113.17%)" }, // gold
  { avatarBg: "linear-gradient(147.96deg, #8FD0FF 39.28%, #B0DEFF 113.17%)" }, // blue
  { avatarBg: "linear-gradient(147.96deg, #FFA0D2 39.28%, #FFBAE0 113.17%)" }, // pink
];

const FALLBACK_ICONS = ["/paket1.png", "/paket2.png", "/paket3.png", "/paket4.png"];

export default function PembayaranPage() {
  const router = useRouter();
  const params = useParams();
  const paketDipilih = (params?.paket as string) || "";

  const [pkg, setPkg] = useState<ApiPackage | null>(null);
  const [colorIndex, setColorIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

   usePageSound("/fase/bayar.mp3");


  // FETCH DATA PAKET BERDASARKAN package_id DARI URL
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/admin/packages");
        const data: ApiPackage[] = await res.json();
        const activePackages = (data || []).filter((p) => p.is_active);
        const idx = activePackages.findIndex((p) => p.package_id === paketDipilih);

        if (idx === -1) {
          setNotFound(true);
        } else {
          setPkg(activePackages[idx]);
          setColorIndex(idx);
        }
      } catch (err) {
        console.error("Gagal load paket:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (paketDipilih) {
      fetchPackage();
    } else {
      setNotFound(true);
      setLoading(false);
    }
  }, [paketDipilih]);

  const formatRupiah = (angka: number) => `Rp ${angka.toLocaleString("id-ID")}`;

  // ===== STATE: LOADING =====
  if (loading) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: '#E3D5D5' }}>
        <p className="font-inter font-semibold text-[24px] text-[#395350]">Memuat data paket...</p>
      </main>
    );
  }

  // ===== STATE: PAKET GAK KETEMU =====
  if (notFound || !pkg) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: '#E3D5D5' }}>
        <div className="bg-white rounded-[18px] shadow-lg p-10 text-center max-w-[500px]">
          <h1 className="font-inter font-bold text-[32px] text-[#332C2C] mb-3">Paket Tidak Ditemukan</h1>
          <p className="font-inter text-[16px] text-[#6F6F6F] mb-6">
            Paket yang lu pilih udah gak tersedia atau dinonaktifkan. Silakan pilih paket lain.
          </p>
          <button
            onClick={() => router.push("/pilih-paket")}
            className="bg-[#38635A] text-white px-6 py-3 rounded-full font-bold text-[16px] hover:bg-[#2c4e47] transition-colors"
          >
            ← Kembali ke Pilih Paket
          </button>
        </div>
      </main>
    );
  }

  // ===== STATE: SUKSES (data ketemu) =====
  const colors = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
  const avatarImg = pkg.icon_url || FALLBACK_ICONS[colorIndex % FALLBACK_ICONS.length];

  return (
    <main className="relative min-h-screen flex flex-col select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>

      {/* PROGRESS BAR TOP */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[25%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* HEADER AREA: back button + title group (top-left) */}
      <header className="pt-9 px-12 flex items-center gap-4 z-10">
        {/* Back button white circle 76px */}
        <button
          onClick={() => router.push("/pilih-paket")}
          className="w-[76px] h-[76px] bg-white border-[0.3px] border-black rounded-full shadow-[3px_4px_4px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0"
          title="Kembali ke pilih paket"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#393836" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        {/* Title group */}
        <div className="flex flex-col leading-none">
          <p className="font-hind font-semibold italic text-[20px] text-[#37786D] tracking-[-0.05em] mb-1">
            hampir sampai
          </p>
          <h1 className="font-inter font-bold text-[64px] text-[#393333] tracking-[-0.06em] leading-none">
            Pembayaran
          </h1>
        </div>
      </header>

      {/* CONTENT centered */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 z-10 pb-20 px-4">

        {/* CARD PAKET TERPILIH — dinamis dari DB */}
        <div
          className="flex items-center gap-5 px-5 shadow-[6px_9px_9.6px_rgba(0,0,0,0.25)] w-[644px] bg-white h-[110px]"
          style={{ border: '1.5px solid #EDCBAB', borderRadius: '18px' }}
        >
          <div
            className="w-[61px] h-[61px] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm ml-2"
            style={{ background: colors.avatarBg }}
          >
            <img src={avatarImg} alt={pkg.name} className="w-[43px] h-[43px] object-contain" />
          </div>
          <div className="flex-1 flex items-center justify-between leading-none">
            <h2 className="font-inter font-bold text-[32px] text-[#393836] tracking-[-0.05em]">
              {pkg.name}
            </h2>
            <h3 className="font-inter font-bold text-[32px] text-[#17684E] tracking-[-0.06em] mr-2">
              {formatRupiah(pkg.price)}
            </h3>
          </div>
        </div>

        {/* SUBTITLE METODE */}
        <h3 className="font-inter font-medium text-[20px] text-[#6B6B6B] tracking-[-0.05em] text-center">
          Pilih Metode Pembayaran:
        </h3>

        {/* 2 CARDS SIDE-BY-SIDE — click langsung navigate */}
        <div className="flex gap-7">

          {/* Card QR */}
          <button
            onClick={() => router.push(`/qris?paket=${paketDipilih}`)}
            className="group w-[260px] h-[195px] bg-white rounded-[18px] p-4 flex flex-col items-center justify-center gap-2.5 transition-all shadow-[6px_9px_9.6px_rgba(0,0,0,0.15)] border-[1.5px] border-[#EDCBAB] hover:scale-[1.03] hover:shadow-[8px_11px_12px_rgba(0,0,0,0.2)] hover:border-[#D29E38] active:scale-95"
          >
            <div className="w-[82px] h-[80px] bg-[#E1E1E1] border border-[#CBC585] rounded-[9px] flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <img src="/qris.png" alt="QRIS" className="w-[44px] h-[44px] object-contain" />
            </div>
            <h3 className="font-inter font-bold text-[22px] text-[#343434] text-center tracking-[-0.05em] leading-tight group-hover:text-[#17684E] transition-colors">
              Scan QR Code
            </h3>
            <p className="font-inter font-normal text-[14px] text-[#616060] text-center tracking-[-0.05em] leading-tight">
              GoPay - OVO - Dana - DLL
            </p>
          </button>

          {/* Card Voucher */}
          <button
            onClick={() => router.push(`/kupon?paket=${paketDipilih}`)}
            className="group w-[260px] h-[195px] bg-white rounded-[18px] p-4 flex flex-col items-center justify-center gap-2.5 transition-all shadow-[6px_9px_9.6px_rgba(0,0,0,0.15)] border-[1.5px] border-[#EDCBAB] hover:scale-[1.03] hover:shadow-[8px_11px_12px_rgba(0,0,0,0.2)] hover:border-[#D29E38] active:scale-95"
          >
            <div className="w-[82px] h-[80px] bg-[#E1E1E1] border border-[#CBC585] rounded-[9px] flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <img src="/kupon.png" alt="Voucher" className="w-[44px] h-[44px] object-contain" />
            </div>
            <h3 className="font-inter font-bold text-[22px] text-[#343434] text-center tracking-[-0.05em] leading-tight group-hover:text-[#17684E] transition-colors">
              Kode Voucher
            </h3>
            <p className="font-inter font-normal text-[14px] text-[#616060] text-center tracking-[-0.05em] leading-tight">
              Masukkan kode voucher.
            </p>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:ital,wght@0,600;1,600&family=Inter:ital,wght@0,400;0,500;0,700;1,500&display=swap');
      `}</style>
    </main>
  );
}