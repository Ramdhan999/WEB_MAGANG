"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function PembayaranPage() {
  const params = useParams();
  const paketDipilih = params.paket as string; // Nangkep tulisan 'solo', 'duo', dll dari URL

  // Database mini buat nyesuain data tergantung URL
  const packageData: Record<string, any> = {
    solo: { title: "Glambot Solo", price: "Rp. 35,000", img: "/paket1.png" },
    duo: { title: "Glambot Duo", price: "Rp. 45,000", img: "/paket2.png" },
    group: { title: "Glambot Group", price: "Rp. 55,000", img: "/paket3.png" },
    premium: { title: "Glambot Premium", price: "Rp. 75,000", img: "/paket4.png" },
  };

  // Kalau aneh-aneh, default ke premium
  const currentPackage = packageData[paketDipilih] || packageData.premium;

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden text-white pt-16 pb-16"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* --- PROGRESS BAR (Manjang jadi 33%) --- */}
      <div className="absolute top-0 left-0 w-full h-[12px]">
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)' }}></div>
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
          style={{ width: '33%', background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}
        ></div>
      </div>

      {/* --- BADGE ATAS --- */}
      <div 
        className="mb-8 flex items-center justify-center gap-3 shadow-md"
        style={{ width: '224px', height: '56px', background: '#476A53', border: '1px solid #85DDA6', borderRadius: '28px' }}
      >
        <div style={{ width: '24px', height: '24px', background: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <span 
          style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '24px',
            background: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}
        >
          Pembayaran
        </span>
      </div>

      {/* --- HEADER TEXT --- */}
      <h1 
        className="italic mb-2"
        style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '75px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textShadow: '3px 5px 4px rgba(0, 0, 0, 0.4)'
        }}
      >
        Pembayaran
      </h1>

      {/* Garis Pembatas dengan Bintang */}
      <div className="flex items-center justify-center gap-4 w-full max-w-[800px] mb-12">
        <div style={{ height: '3px', flexGrow: 1, background: '#6AC5C3' }}></div>
        <div style={{ width: '15px', height: '15px', background: 'linear-gradient(180deg, #3EFFB8 0%, #25996E 52.69%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
        <div style={{ height: '3px', flexGrow: 1, background: '#6AC5C3' }}></div>
      </div>

      {/* --- KOTAK PAKET TERPILIH (Dinamis sesuai URL) --- */}
      <div 
        className="flex items-center gap-6 px-6 mb-8 shadow-lg"
        style={{ width: '644px', height: '110px', background: '#2E4F4D', border: '1.5px solid #54868A', borderRadius: '18px', boxSizing: 'border-box' }}
      >
        <div className="flex items-center justify-center" style={{ width: '78px', height: '76px', background: '#B3D2D1', borderRadius: '9px' }}>
          <img src={currentPackage.img} alt="Package" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
        </div>
        <div className="flex flex-col justify-center">
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '32px', letterSpacing: '-0.05em', background: 'linear-gradient(90deg, #F8E19B 0%, #DFB948 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1' }}>
            {currentPackage.title}
          </h2>
          <h3 style={{ fontFamily: "'Inria Serif', serif", fontStyle: 'italic', fontWeight: 700, fontSize: '32px', letterSpacing: '-0.06em', background: 'linear-gradient(90deg, #FFDE97 0%, #FFFFFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '2px 2px 4px rgba(0,0,0,0.25)', lineHeight: '1.2' }}>
            {currentPackage.price}
          </h3>
        </div>
      </div>

      <h3 className="italic font-bold text-[24px] mb-6 tracking-[-0.05em] opacity-90">Pilih Metode Pembayaran:</h3>

      {/* --- METODE PEMBAYARAN: QRIS --- */}
      <Link href="/qris" className="group flex items-center justify-between px-6 mb-4 transition-transform hover:-translate-y-1" style={{ width: '644px', height: '108px', background: '#2E4F4D', border: '1.5px solid #54868A', borderRadius: '18px', boxSizing: 'border-box' }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center" style={{ width: '78px', height: '76px', background: '#B3D2D1', borderRadius: '9px' }}>
            <img src="/qris.png" alt="QRIS" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
          </div>
          <div className="flex flex-col">
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '32px', letterSpacing: '-0.05em', color: '#FFF', lineHeight: '1.1' }}>Scan QR Code</h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '16px', letterSpacing: '-0.05em', color: '#D1D1D1' }}>GoPay - OVO - Dana - DLL</p>
          </div>
        </div>
        {/* Panah Kanan SVG */}
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }} className="transition-transform group-hover:translate-x-2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </Link>

      {/* --- METODE PEMBAYARAN: VOUCHER --- */}
      <Link href="/voucher" className="group flex items-center justify-between px-6 mb-12 transition-transform hover:-translate-y-1" style={{ width: '644px', height: '108px', background: '#2E4F4D', border: '1.5px solid #54868A', borderRadius: '18px', boxSizing: 'border-box' }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center" style={{ width: '78px', height: '76px', background: '#B3D2D1', borderRadius: '9px' }}>
            <img src="/voucher.png" alt="Voucher" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
          </div>
          <div className="flex flex-col">
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '32px', letterSpacing: '-0.05em', color: '#FFF', lineHeight: '1.1' }}>Kode Voucher</h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '16px', letterSpacing: '-0.05em', color: '#D1D1D1' }}>Masukkan kode voucher.</p>
          </div>
        </div>
        {/* Panah Kanan SVG */}
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }} className="transition-transform group-hover:translate-x-2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </Link>

      {/* --- TOMBOL GANTI PAKET (KEMBALI) --- */}
      <Link 
        href="/pilih-paket" 
        className="flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95"
        style={{ width: '286px', height: '48px', background: '#224C42', border: '3px solid #318570', borderRadius: '30px', textDecoration: 'none' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#132E27" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '24px', letterSpacing: '-0.05em', color: '#132E27' }}>Ganti Paket</span>
      </Link>

    </main>
  );
}