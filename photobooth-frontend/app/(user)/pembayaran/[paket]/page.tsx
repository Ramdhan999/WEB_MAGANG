"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

// ===== PALETTE WARNA (HARUS SAMA dengan PilihPaketPage biar konsisten!) =====
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

  // FETCH DATA PAKET BERDASARKAN package_id DARI URL
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/admin/packages");
        const data: ApiPackage[] = await res.json();

        // Filter cuma yang aktif, terus cari index berdasarkan package_id dari URL
        const activePackages = (data || []).filter((p) => p.is_active);
        const idx = activePackages.findIndex((p) => p.package_id === paketDipilih);

        if (idx === -1) {
          // Paket gak ketemu di DB (mungkin dihapus admin)
          setNotFound(true);
        } else {
          setPkg(activePackages[idx]);
          setColorIndex(idx); // Index buat ambil warna avatar yang konsisten
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
    <main className="relative flex min-h-screen flex-col items-center justify-center pt-4 pb-12 px-4 md:px-8 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>

      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[25%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      <div className="w-full flex flex-col items-center flex-1 justify-center max-w-[1440px] z-10">

        {/* HEADER AREA */}
        <div className="w-full max-w-[1225px] flex flex-col items-center mb-12 text-center relative px-2">
          <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">
            Hampir Sampai
          </p>
          <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">
            Pembayaran
          </h1>
        </div>

        {/* KOTAK KARTU PAKET TERPILIH — sekarang dinamis dari DB */}
        <div
          className="flex items-center gap-5 px-5 mb-5 shadow-[6px_9px_9.6px_rgba(0,0,0,0.25)] w-full max-w-[644px] bg-white h-[110px]"
          style={{ border: '1.5px solid #EDCBAB', borderRadius: '18px' }}
        >
          <div
            className="w-[61px] h-[61px] rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm ml-2"
            style={{ background: colors.avatarBg }}
          >
            <img src={avatarImg} alt={pkg.name} className="w-[43px] h-[43px] object-contain" />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <h2 className="font-inter font-bold text-[32px] text-[#393836] tracking-[-0.05em] mb-1">
              {pkg.name}
            </h2>
            <h3 className="font-inter font-bold text-[32px] text-[#17684E] tracking-[-0.06em]">
              {formatRupiah(pkg.price)}
            </h3>
          </div>
        </div>

        {/* SUBTITLE */}
        <h3 className="font-inter font-medium text-[24px] text-[#6B6B6B] tracking-[-0.05em] mt-5 mb-4 text-center">
          Pilih Metode Pembayaran:
        </h3>

        {/* METODE 1: SCAN QR CODE */}
        <Link
          href={`/qris?paket=${paketDipilih}`}
          className="group flex items-center justify-between px-5 mb-4 shadow-[6px_9px_9.6px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.01] w-full max-w-[644px] bg-white h-[108px]"
          style={{ border: '1.5px solid #EDCBAB', borderRadius: '18px' }}
        >
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center shrink-0 w-[78px] h-[76px] bg-[#E1E1E1] border border-[#CBC585] rounded-[9px] shadow-inner ml-1">
              <img src="/qris.png" alt="QRIS" className="w-[45px] h-[45px] object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <h2 className="font-inter font-bold text-[24px] text-[#343434] tracking-[-0.05em] mb-1.5 transition-colors group-hover:text-[#17684E]">
                Scan QR Code
              </h2>
              <p className="font-inter font-normal text-[16px] text-[#616060] tracking-[-0.05em]">
                GoPay - OVO - Dana - DLL
              </p>
            </div>
          </div>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300 group-hover:translate-x-2 group-hover:stroke-[#17684E] shrink-0 mr-2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        {/* METODE 2: KODE VOUCHER */}
        <Link
          href={`/kupon?paket=${paketDipilih}`}
          className="group flex items-center justify-between px-5 mb-12 shadow-[6px_9px_9.6px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.01] w-full max-w-[644px] bg-white h-[107px]"
          style={{ border: '1.5px solid #EDCBAB', borderRadius: '18px' }}
        >
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center shrink-0 w-[78px] h-[76px] bg-[#E1E1E1] border border-[#CBC585] rounded-[9px] shadow-inner ml-1">
              <img src="/kupon.png" alt="Voucher" className="w-[45px] h-[45px] object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <h2 className="font-inter font-bold text-[24px] text-[#343434] tracking-[-0.05em] mb-1.5 transition-colors group-hover:text-[#17684E]">
                Kode Voucher
              </h2>
              <p className="font-inter font-normal text-[16px] text-[#616060] tracking-[-0.05em]">
                Masukkan kode voucher.
              </p>
            </div>
          </div>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300 group-hover:translate-x-2 group-hover:stroke-[#17684E] shrink-0 mr-2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* FOOTER */}
      <div className="w-full max-w-[1440px] flex flex-col items-center z-10 relative mt-auto px-6 md:px-4">
        <div className="w-full flex justify-start">
          <button
            onClick={() => router.push("/pilih-paket")}
            className="font-inter font-medium italic text-[24px] tracking-[-0.06em] text-[#0E1E1A] hover:opacity-70 transition-opacity"
          >
            ← KEMBALI
          </button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@600&family=Inter:ital,wght@0,400;0,500;0,700;1,500&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </main>
  );
}