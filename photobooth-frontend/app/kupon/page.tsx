"use client";

import { useRouter } from "next/navigation";

export default function KuponPage() {
  const router = useRouter(); // Hook untuk mengembalikan user ke page sebelumnya yang dinamis

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(100% 408.71% at 0% 0%, #66908E 0%, #243F42 29.63%, #35463C 67.36%, #5CAA96 100%), radial-gradient(17.98% 73.49% at 91.02% 82.12%, #66908E 0%, #496361 0%, #373737 89.92%)'
      }}
    >
      {/* --- KOTAK MODAL VOUCHER --- */}
      <div
        className="relative flex flex-col items-center justify-start shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 animate-fade-in-up"
        style={{
          width: '644px',
          height: '596px',
          background: '#2E4F4D',
          border: '1.5px solid #54868A',
          borderRadius: '18px',
          boxSizing: 'border-box'
        }}
      >
        {/* Garis Dekorasi Atas */}
        <div
          className="absolute top-0"
          style={{
            width: '612px',
            height: '6px',
            background: '#6AC5C3',
            borderRadius: '0 0 6px 6px', 
          }}
        />

        {/* 1. Ikon Kupon */}
        <div
          className="mt-[45px] flex items-center justify-center shadow-inner"
          style={{
            width: '146px',
            height: '142px',
            background: '#B3D2D1',
            borderRadius: '9px',
          }}
        >
          <img
            src="/kupon.png"
            alt="Ikon Kupon"
            style={{ width: '120px', height: '120px', objectFit: 'contain' }}
          />
        </div>

        {/* 2. Judul & Subjudul */}
        <div className="mt-6 flex flex-col items-center text-center">
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '48px',
              lineHeight: '58px',
              letterSpacing: '-0.05em',
              background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}
          >
            Kode Voucher
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '19px',
              letterSpacing: '-0.05em',
              background: 'linear-gradient(90deg, #FFFFFF 0%, #979797 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginTop: '4px'
            }}
          >
            Masukkan kode voucher kamu!
          </p>
        </div>

        {/* 3. Input Field (Dibuat fungsional bisa diketik) */}
        <input
          type="text"
          placeholder="Masukkan Kode di sini!"
          className="mt-8 px-6 text-center text-white placeholder-[#435450] outline-none transition-colors focus:ring-2 focus:ring-[#41D2BA]"
          style={{
            width: '577px',
            height: '89px',
            background: '#213433',
            border: '1.5px solid #41D2BA',
            borderRadius: '18px',
            boxSizing: 'border-box',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '24px',
            letterSpacing: '-0.05em',
          }}
        />

        {/* 4. Tombol Aksi */}
        <div className="mt-[45px] flex w-full justify-center gap-[24px]">
          
          {/* Tombol Batal (Pakai router.back biar pinter kembali ke paket pilihan) */}
          <button 
            onClick={() => router.back()} 
            className="group cursor-pointer border-none bg-transparent p-0 outline-none"
          >
            <div
              className="flex items-center justify-center transition-all duration-300 group-hover:bg-[#2A5C50] group-hover:scale-105 group-active:scale-95"
              style={{
                width: '220px',
                height: '62px',
                background: '#224C42',
                border: '3px solid #318570',
                borderRadius: '30px',
                boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '32px',
                color: '#318C77',
                letterSpacing: '-0.05em',
              }}
            >
              Batal
            </div>
          </button>

          {/* Tombol Redeem */}
          <button className="group cursor-pointer border-none bg-transparent p-0 outline-none">
            <div
              className="flex items-center justify-center shadow-lg transition-all duration-300 group-hover:bg-[#45B298] group-hover:shadow-[0_0_20px_rgba(57,154,131,0.6)] group-hover:scale-105 group-active:scale-95"
              style={{
                width: '220px',
                height: '62px',
                background: '#399A83',
                borderRadius: '30px',
                boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '32px',
                color: '#224C42',
                letterSpacing: '-0.05em',
              }}
            >
              Redeem
            </div>
          </button>

        </div>
      </div>
    </main>
  );
}