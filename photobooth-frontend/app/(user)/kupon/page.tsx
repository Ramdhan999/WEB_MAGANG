"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";

const KEY_ROWS: string[][] = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const MAX_VOUCHER_LEN = 32;

// idle    : belum disentuh, cuma kartu voucher
// touch   : disentuh jari/pen -> pakai keyboard on-screen bawaan app
// physical: diklik mouse / ada ketikan keyboard fisik -> ketik langsung
type InputMode = "idle" | "touch" | "physical";

function KuponContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paket = searchParams.get("paket") || "";

  const [voucherCode, setVoucherCode] = useState("");
  const [error, setError] = useState(false);
  const [errorText, setErrorText] = useState("Kode voucher salah atau sudah kadaluwarsa!");
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<InputMode>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const showKeyboard = mode === "touch";
  const isEditable = mode === "physical";

  usePageSound("/fase/voucher.mp3");
  usePageSound("/fase/voucher_gaada.mp3", error);

  // Deteksi cara interaksi saat kolom voucher ditekan
  const handleFieldPointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    if (loading) return;
    setError(false);
    if (e.pointerType === "touch" || e.pointerType === "pen") {
      setMode("touch");     // kiosk/touchscreen -> keyboard on-screen
    } else {
      setMode("physical");  // mouse -> anggap ada keyboard fisik
    }
  };

  // Fokus input saat masuk mode physical
  useEffect(() => {
    if (mode === "physical") {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [mode]);

  // Safety net: kalau user mulai ngetik pakai keyboard FISIK, matiin keyboard on-screen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (loading) return;
      if (e.key.length === 1 && mode !== "physical") {
        setMode("physical");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, loading]);

  const appendChar = (ch: string) => {
    if (!showKeyboard || loading) return;
    setError(false);
    setVoucherCode((prev) => (prev + ch).slice(0, MAX_VOUCHER_LEN));
  };
  const handleBackspace = () => {
    if (!showKeyboard || loading) return;
    setVoucherCode((prev) => prev.slice(0, -1));
  };
  const handleClear = () => {
    if (!showKeyboard || loading) return;
    setVoucherCode("");
  };

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

        router.push(`/success?txn=${encodeURIComponent(freeData.transaction_id)}`);
        return;
      }

      router.push(`/qris?paket=${encodeURIComponent(paket)}&voucher=${encodeURIComponent(code)}`);
    } catch (err) {
      console.error("Redeem error:", err);
      setError(true);
      setErrorText("Gagal konek ke server");
      setLoading(false);
      setTimeout(() => setError(false), 3000);
    }
  };

  const KeyButton = ({ label }: { label: string }) => (
    <button
      onClick={() => appendChar(label)}
      disabled={!showKeyboard || loading}
      className="w-[60px] h-[60px] rounded-[13px] bg-white border border-[#54868A] shadow-sm font-inter font-medium text-[20px] text-[#383838] flex items-center justify-center transition-all active:scale-90 active:bg-[#3A9F86] active:text-white disabled:opacity-40 disabled:active:scale-100 disabled:active:bg-white disabled:active:text-[#383838]"
    >
      {label}
    </button>
  );

  const hint = (() => {
    if (mode === "touch") {
      return (
        <span className="flex items-center gap-2 font-hind font-semibold text-[13px] text-[#2E706D]">
          <span className="w-[8px] h-[8px] rounded-full bg-[#3A9F86] animate-pulse"></span>
          Keyboard aktif — silakan ketik
        </span>
      );
    }
    if (mode === "physical") {
      return (
        <span className="font-hind font-medium text-[13px] text-[#2E706D]">
          Ketik pakai keyboard kamu, lalu tekan Redeem / Enter
        </span>
      );
    }
    return (
      <span className="font-hind font-medium text-[13px] text-[#9B9B9B]">
        Ketuk kolom di atas untuk mulai
      </span>
    );
  })();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>

      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[35%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* WRAPPER KOLOM: kartu voucher di atas, keyboard (kalau perlu) di bawah */}
      <div className="relative z-10 w-full max-w-[760px] flex flex-col items-center justify-center gap-6">

        {/* KARTU VOUCHER */}
        <div
          className={`relative flex flex-col items-center px-6 sm:px-10 shadow-[0px_4px_15px_rgba(0,0,0,0.15)] w-full max-w-[560px] py-10 bg-gradient-to-b from-[#1C614E] via-white to-white via-[1%] transition-all duration-500 ${error ? 'animate-shake' : 'animate-fade-in-up'}`}
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
            {error ? errorText : 'Ketuk kolom di bawah untuk memasukkan kode'}
          </p>

          <input
            ref={inputRef}
            type="text"
            value={voucherCode}
            onChange={(e) => {
              if (isEditable) {
                setError(false);
                setVoucherCode(e.target.value.toUpperCase().slice(0, MAX_VOUCHER_LEN));
              }
            }}
            onPointerDown={handleFieldPointerDown}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleRedeem(); }}
            placeholder="Ketik di sini!"
            readOnly={!isEditable}
            disabled={loading}
            className={`px-6 text-center text-[#383838] placeholder-[#9B9B9B] outline-none bg-white w-full max-w-[460px] h-[58px] transition-all mb-4 disabled:opacity-60 border ${mode !== "idle" ? 'border-[#3A9F86] ring-2 ring-[#3A9F86]/40' : 'border-[#000000]'} ${isEditable ? 'cursor-text' : 'cursor-pointer'}`}
            style={{
              borderRadius: '15px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '18px',
              letterSpacing: 'normal'
            }}
          />

          <div className="h-[24px] mb-6 flex items-center">
            {hint}
          </div>

          <div className="flex flex-row gap-4 w-full justify-center mt-auto">
            <button
              onClick={() => router.push(paket ? `/pembayaran/${paket}` : "/pilih-paket")}
              disabled={loading}
              className="flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white border border-[#000000] w-[220px] h-[53px] rounded-[23px] shadow-sm disabled:opacity-60"
            >
              <span className="font-inter font-extrabold tracking-[-0.02em] text-[18px] text-[#383838]">Batal</span>
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

        {/* KEYBOARD ON-SCREEN (cuma muncul di mode touch) */}
        {showKeyboard && (
          <div className="relative w-full max-w-[720px] bg-white/95 border-[1.5px] border-[#54868A] rounded-[18px] p-4 sm:p-5 shadow-[0px_4px_15px_rgba(0,0,0,0.12)] animate-fade-in-up flex flex-col justify-center">
            <div className="flex flex-col gap-2.5">
              {KEY_ROWS.map((row, i) => (
                <div key={i} className="flex gap-2 sm:gap-2.5 justify-center">
                  {row.map((k) => <KeyButton key={k} label={k} />)}
                  {i === KEY_ROWS.length - 1 && (
                    <button
                      onClick={handleBackspace}
                      disabled={!showKeyboard || loading}
                      className="h-[60px] px-5 rounded-[13px] bg-[#E3D5D5] border border-[#54868A] shadow-sm flex items-center justify-center transition-all active:scale-90 active:bg-[#c9b8b8] disabled:opacity-40 disabled:active:scale-100"
                      title="Hapus 1 karakter"
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5A4A4A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                        <line x1="18" y1="9" x2="12" y2="15" />
                        <line x1="12" y1="9" x2="18" y2="15" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {/* Baris bawah: SPASI (lebar) + Bersihkan — tanpa Redeem */}
              <div className="flex gap-2.5 justify-center mt-1">
                <button
                  onClick={() => appendChar(" ")}
                  disabled={!showKeyboard || loading}
                  className="flex-[3] h-[58px] rounded-[13px] bg-white border border-[#54868A] shadow-sm font-inter font-semibold text-[15px] text-[#5A4A4A] flex items-center justify-center transition-all active:scale-95 active:bg-[#F1F1F1] disabled:opacity-40 disabled:active:scale-100"
                >
                  Spasi
                </button>
                <button
                  onClick={handleClear}
                  disabled={!showKeyboard || loading}
                  className="flex-1 h-[58px] rounded-[13px] bg-white border border-[#54868A] shadow-sm font-inter font-bold text-[17px] text-[#8A5A5A] flex items-center justify-center transition-all active:scale-95 active:bg-[#F5E9E9] disabled:opacity-40 disabled:active:scale-100"
                >
                  Bersihkan
                </button>
              </div>
            </div>
          </div>
        )}
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