"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";

function KuponContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paket = searchParams.get("paket") || "";

  const [voucherCode, setVoucherCode] = useState("");
  const [error, setError] = useState(false);
  const [errorText, setErrorText] = useState("Kode voucher salah atau sudah kadaluwarsa!");
  const [loading, setLoading] = useState(false);

  usePageSound("/fase/voucher.mp3");
  usePageSound("/fase/voucher_gaada.mp3", error);

  const handleRedeem = async () => {
    const code = voucherCode.trim();
    if (!code) {
      setError(true);
      setErrorText("Masukkan kode voucher dulu!");
      setTimeout(() => setError(false), 3000);
      return;
    }

    if (!paket) {
      setError(true);
      setErrorText("Paket tidak terdeteksi. Mulai dari pilih paket lagi.");
      setTimeout(() => setError(false), 3000);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      // 1. VALIDASI VOUCHER ke backend
      const res = await fetch(`${BACKEND_URL}/api/voucher/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, paket }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(true);
        setErrorText(data.error || "Kode voucher tidak valid!");
        setVoucherCode("");
        setLoading(false);
        setTimeout(() => setError(false), 3000);
        return;
      }

      // 2. KALAU GRATIS → bikin transaksi gratis, lalu LANGSUNG orchestrate ke /kamera
      if (data.is_free) {
        const freeRes = await fetch(`${BACKEND_URL}/api/payment/free`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paket, voucher: code }),
        });
        const freeData = await freeRes.json();

        if (!freeRes.ok || !freeData.transaction_id) {
          setError(true);
          setErrorText(freeData.error || "Gagal proses voucher gratis");
          setLoading(false);
          setTimeout(() => setError(false), 3000);
          return;
        }

        // 🎯 PEMBAYARAN GRATIS BERHASIL → /success (animasi roket) → /kamera
        router.push(`/success?txn=${freeData.transaction_id}`);
        return;
      }

      // 3. KALAU DISKON BIASA → ke QRIS bawa kode voucher (QRIS yang handle orchestrate-nya)
      router.push(`/qris?paket=${paket}&voucher=${code}`);
    } catch (err) {
      console.error("Redeem error:", err);
      setError(true);
      setErrorText("Gagal konek ke server");
      setLoading(false);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>

      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[35%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      <div
        className={`relative z-10 flex flex-col items-center px-6 sm:px-10 shadow-[0px_4px_15px_rgba(0,0,0,0.15)] w-full max-w-[560px] py-10 bg-gradient-to-b from-[#1C614E] via-white to-white via-[1%] transition-all duration-500 ${error ? 'animate-shake' : 'animate-fade-in-up'}`}
        style={{ borderRadius: '18px' }}
      >

        <div className="mb-3 flex items-center justify-center shrink-0 w-[82px] h-[83px] bg-white border border-[#FFA218] rounded-[9px] shadow-sm">
          <img src="/kupon.png" alt="Coupon Icon" className="w-[54px] h-[54px] object-contain" />
        </div>

        <h1 className="font-inter font-bold text-center leading-[58px] tracking-[-0.05em] text-[48px] text-[#424242] mb-1">
          Kode Voucher
        </h1>
        <p
          className="font-inter font-normal text-center tracking-[-0.05em] text-[16px] mb-8 transition-colors duration-300"
          style={{ color: error ? '#FF4C4C' : '#424242', opacity: error ? 1 : 0.7 }}
        >
          {error ? errorText : 'Masukkan kode voucher kamu di bawah ini'}
        </p>

        <input
          type="text"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleRedeem(); }}
          placeholder="Masukkan Kode di sini!"
          disabled={loading}
          className="px-6 text-center text-[#383838] placeholder-[#9B9B9B] outline-none border border-[#000000] bg-white w-full max-w-[460px] h-[58px] transition-all mb-12 disabled:opacity-60"
          style={{
            borderRadius: '15px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '18px',
            letterSpacing: '-0.05em'
          }}
        />

        <div className="flex flex-row gap-4 w-full justify-center mt-auto">

          <button
            onClick={() => router.push(paket ? `/pembayaran/${paket}` : "/pilih-paket")}
            disabled={loading}
            className="flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white border border-[#000000] w-[220px] h-[53px] rounded-[23px] shadow-sm disabled:opacity-60"
          >
            <span className="font-inter font-extrabold tracking-[-0.02em] text-[18px] text-[#383838]">
              Batal
            </span>
          </button>

          <button
            onClick={handleRedeem}
            disabled={loading}
            className="flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-[#3A9F86] w-[220px] h-[53px] rounded-[23px] shadow-md disabled:opacity-60"
          >
            <span className="font-inter font-extrabold italic tracking-[-0.06em] text-[18px] text-white">
              {loading ? "Memproses..." : "Redeem"}
            </span>
          </button>

        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

export default function KuponPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <KuponContent />
    </Suspense>
  );
}