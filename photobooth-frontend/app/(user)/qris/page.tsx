"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";

interface PaymentData {
  token: string;
  transaction_id: string;
  order_id: string;
  amount: number;
  original_price?: number;
  discount_amount?: number;
  voucher_code?: string;
  package_name: string;
  package_id: string;
}

function QrisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paketDipilih = searchParams.get("paket") || "premium";
  const voucher = searchParams.get("voucher") || "";

  const [timeLeft, setTimeLeft] = useState(300);
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasTriggeredRef = useRef(false);
  const paymentDataRef = useRef<PaymentData | null>(null);
  const hasRedirectedRef = useRef(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  usePageSound("/fase/qris.mp3");

  // 🎯 Sync paymentData ke ref (buat polling access)
  useEffect(() => {
    paymentDataRef.current = paymentData;
  }, [paymentData]);

  // TIMER
  useEffect(() => {
    if (timeLeft <= 0) {
      router.push(`/gagal?reason=timeout&paket=${paketDipilih}`);
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router, paketDipilih]);

  // 🎯 Auto-polling status pembayaran (fallback kalo onSuccess gak fire)
  useEffect(() => {
    if (!paymentData?.transaction_id) return;

    const checkPaymentStatus = async () => {
      if (hasRedirectedRef.current) return;
      const txnId = paymentDataRef.current?.transaction_id;
      if (!txnId) return;

      try {
        const res = await fetch(`${BACKEND_URL}/api/payment/status/${txnId}`);
        if (!res.ok) return;

        const data = await res.json();
        // Cek status paid/success (sesuaikan dengan response backend)
        const status = (data.status || data.payment_status || "").toLowerCase();

        if (status === "paid" || status === "success" || status === "settlement") {
          hasRedirectedRef.current = true;
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          console.log("💰 [POLLING] Payment confirmed:", status);
          router.push(`/success?txn=${txnId}`);
        }
      } catch (err) {
        // Polling gagal, silent (jangan spam log)
      }
    };

    // Polling tiap 3 detik
    pollingIntervalRef.current = setInterval(checkPaymentStatus, 3000);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [paymentData?.transaction_id, router]);

  // FETCH PAYMENT + BUKA MIDTRANS
  useEffect(() => {
    if (!isSnapLoaded || hasTriggeredRef.current) return;

    const generatePayment = async () => {
      hasTriggeredRef.current = true;
      try {
        const res = await fetch(`${BACKEND_URL}/api/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paket: paketDipilih, voucher: voucher }),
        });

        const data = await res.json();

        if (!res.ok || !data.token) {
          setErrorMsg(data.error || "Gagal generate pembayaran");
          return;
        }

        setPaymentData(data);

        (window as any).snap.pay(data.token, {
          onSuccess: async function (result: any) {
            if (hasRedirectedRef.current) return;
            hasRedirectedRef.current = true;
            try {
              await fetch(`${BACKEND_URL}/api/payment/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  transaction_id: data.transaction_id,
                  midtrans_result: result,
                }),
              });
            } catch (err) {
              console.error("Confirm error (lanjut aja):", err);
            }
            // 🎯 PEMBAYARAN BERHASIL → /success (animasi roket) → /kamera
            router.push(`/success?txn=${data.transaction_id}`);
          },
          onPending: function (result: any) {
            console.log("Menunggu pembayaran...", result);
          },
          onError: function (result: any) {
            console.error("Midtrans error:", result);
            router.push(`/gagal?reason=error&txn=${data.transaction_id}`);
          },
          onClose: function () {
            console.log("Popup ditutup sama user");
            // Kalo user tutup popup, polling tetep jalan buat detect payment
          },
        });
      } catch (error) {
        console.error("Error backend:", error);
        setErrorMsg("Gagal konek ke server backend");
      }
    };

    generatePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSnapLoaded, paketDipilih, voucher, router]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatRupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  const displayPrice = paymentData ? formatRupiah(paymentData.amount) : "Memuat...";
  const displayPackageName = paymentData ? paymentData.package_name : paketDipilih.toUpperCase();
  const hasDiscount = paymentData && (paymentData.discount_amount || 0) > 0;

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="Mid-client-BD4ZMoqqW6WahlgZ"
        strategy="afterInteractive"
        onLoad={() => setIsSnapLoaded(true)}
      />

      <main className="relative flex min-h-screen flex-col items-center justify-center p-4 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>

        <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
          <div className="h-full w-[35%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
          <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
        </div>

        {errorMsg && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg font-bold z-50">
            ⚠️ {errorMsg}
          </div>
        )}

        <div
          className="relative z-10 flex flex-col items-center px-6 sm:px-10 shadow-[0px_4px_15px_rgba(0,0,0,0.15)] w-full max-w-[560px] py-10 bg-gradient-to-b from-[#1C614E] via-white to-white via-[1%]"
          style={{ borderRadius: '18px' }}
        >

          <div className="mb-3 flex items-center justify-center shrink-0 w-[82px] h-[83px] bg-white border border-[#FFA218] rounded-[9px] shadow-sm">
            <img src="/scan.png" alt="Scan Icon" className="w-[54px] h-[54px] object-contain" />
          </div>

          <h1 className="font-inter font-bold text-center leading-[48px] tracking-[-0.05em] text-[38px] text-[#424242] mb-1">
            Silahkan Scan QRIS
          </h1>
          <p className="font-inter font-normal text-center tracking-[-0.05em] text-[15px] text-[#424242] mb-5">
            Scan dengan Aplikasi E-Wallet kamu!
          </p>

          <div className="flex items-center justify-center mb-4 shrink-0 w-[310px] h-[310px] bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.2)] rounded-[9px]">
            <img src="/qris1.png" alt="QR Code" className="w-[290px] h-[290px] object-contain" />
          </div>

          {hasDiscount && (
            <div className="flex items-center gap-2 mb-2 px-4 py-1.5 bg-[#FFF3D6] border border-[#F6AA06] rounded-full">
              <span className="text-[14px]">🎟️</span>
              <span className="font-inter font-bold text-[13px] text-[#B8860B]">
                Voucher {paymentData?.voucher_code} · Hemat {formatRupiah(paymentData?.discount_amount || 0)}
              </span>
            </div>
          )}

          {hasDiscount && paymentData?.original_price && (
            <p className="font-inter font-normal text-center text-[18px] text-[#9B9B9B] line-through leading-tight">
              {formatRupiah(paymentData.original_price)}
            </p>
          )}
          <h2
            className="font-inter font-bold text-center tracking-[-0.06em] text-[42px] text-[#17684E] leading-tight mb-0.5"
            style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)' }}
          >
            {displayPrice}
          </h2>
          <p className="font-inter font-normal text-center tracking-[-0.05em] text-[14px] text-[#7A7979] mb-4">
            {displayPackageName} - Glambot Studio
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/icon1.png" alt="Clock Icon" className="w-[24px] h-[24px] object-contain mr-1" />
            <span className="font-inter font-normal tracking-[-0.05em] text-[22px] text-[#7A7979]">
              Berlaku
            </span>
            <span
              className="font-inter font-bold tracking-[-0.06em] text-[32px] text-[#FFAE00]"
              style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)' }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* 🎯 Tombol Batal (di tengah, tanpa Sudah Bayar) */}
          <div className="flex justify-center w-full mt-2">
            <button
              onClick={() => router.push(`/pembayaran/${paketDipilih}`)}
              className="flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white border border-[#000000] w-[220px] h-[53px] rounded-[23px] shadow-sm"
            >
              <span className="font-inter font-extrabold tracking-[-0.02em] text-[18px] text-[#383838]">
                Batal
              </span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export default function QrisPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading Qris...</div>}>
      <QrisContent />
    </Suspense>
  );
}