"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") || "";

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");

  usePageSound("/fase/bayar_berhasil.mpeg");

  // Verifikasi transaksi ke backend
  useEffect(() => {
    if (!txn) {
      setStatus("failed");
      return;
    }

    const verifyTransaction = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/transactions/${txn}`);
        const data = await res.json();

        if (res.ok && data.status === "success") {
          setTimeout(() => setStatus("success"), 1500);
        } else {
          setStatus("failed");
        }
      } catch (err) {
        console.error("Verify error:", err);
        setStatus("failed");
      }
    };

    verifyTransaction();
  }, [txn]);

  // =====================================================================
  // 🚀 Setelah verifikasi success + animasi roket selesai:
  //    1. Enable robot via /api/robot/enable
  //    2. Push ke /kamera (skip /tutorial-kontrol)
  // (Pake 1 monitor doang, gak ada window.open)
  // =====================================================================
  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(async () => {
      // 1. Nyalain robot dulu
      try {
        await fetch(`${BACKEND_URL}/api/robot/enable`, { method: "POST" });
      } catch (err) {
        console.warn("Gagal enable robot:", err);
      }
      // 2. Lompat ke kamera
      router.push(`/kamera?txn=${txn}`);
    }, 2500);
    return () => clearTimeout(timer);
  }, [status, txn, router]);

  // FAILED STATE
  if (status === "failed") {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: '#E3D5D5' }}>
        <div className="bg-white rounded-[18px] shadow-lg p-10 text-center max-w-[500px]">
          <div className="text-[60px] mb-3">⚠️</div>
          <h1 className="font-inter font-bold text-[32px] text-[#332C2C] mb-3">Verifikasi Gagal</h1>
          <p className="font-inter text-[16px] text-[#6F6F6F] mb-6">
            {!txn
              ? "Transaksi tidak valid. Mulai dari awal lagi."
              : "Pembayaran belum terkonfirmasi. Coba refresh atau hubungi admin."}
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

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 md:px-0"
      style={{ backgroundColor: '#E3D5D5' }}
    >
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[45%]" style={{ backgroundImage: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      <div
        className="absolute top-12 md:top-16 flex items-center justify-center gap-3 shadow-md animate-fade-in-down z-10 rounded-full"
        style={{ width: '224px', height: '56px', backgroundColor: '#476A53', border: '1px solid #85DDA6' }}
      >
        <div style={{ width: '24px', height: '24px', backgroundImage: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <span className="font-inter font-bold text-[20px] md:text-[24px]" style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Verifikasi
        </span>
      </div>

      <div className="relative flex flex-col items-center justify-center z-30 mt-16">

        <div className="relative flex items-center justify-center mb-8 w-[150px] h-[200px] md:w-[200px] md:h-[250px]">
          <div className={`relative flex flex-col items-center ${status === "verifying" ? "animate-rumble" : "animate-launch"}`}>
            <img
              src="/roket.png"
              alt="Rocket"
              className="relative z-30 object-contain w-[120px] h-[120px] md:w-[160px] md:h-[160px]"
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-6xl">🚀</span>'; }}
            />
            <div
              className="absolute top-[85%] md:top-[88%] flex flex-col items-center justify-start z-20"
              style={{
                transformOrigin: 'top center',
                transform: status === "success" ? "scaleY(1.5) translateY(5px)" : "scaleY(1) translateY(0px)",
                transition: "transform 0.3s ease-out"
              }}
            >
              <div className="absolute top-0 w-[12px] md:w-[18px] h-[30px] md:h-[45px] rounded-full blur-[2px] animate-flicker-core z-30" style={{ background: '#FFFFFF', boxShadow: '0 0 10px #FFFFCC' }}></div>
              <div className="absolute top-0 w-[24px] md:w-[35px] h-[50px] md:h-[80px] rounded-full blur-[5px] md:blur-[8px] animate-flicker-mid z-20" style={{ background: '#FF9900' }}></div>
              <div className="absolute top-0 w-[35px] md:w-[50px] h-[70px] md:h-[110px] rounded-full blur-[10px] md:blur-[14px] animate-flicker-outer z-10" style={{ background: '#FF3300', opacity: 0.7 }}></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center w-full max-w-[90%] md:max-w-[700px]">
          <h1
            className="font-inter font-bold text-[32px] md:text-[48px] tracking-[-0.05em] transition-all duration-500 leading-tight"
            style={{ color: status === "verifying" ? "#7A7A7A" : "#318C77" }}
          >
            {status === "verifying" ? "Memverifikasi Pembayaran..." : "Pembayaran Berhasil!"}
          </h1>

          <p className="font-inter text-[15px] md:text-[16px] tracking-[-0.05em] transition-all duration-500" style={{ color: '#565656' }}>
            {status === "verifying" ? "Mohon tunggu sebentar..." : "Menyiapkan sesi Glambot Anda!"}
          </p>

          {txn && status === "success" && (
            <p className="font-inter text-[12px] text-[#9A9A9A] mt-3 tracking-wide">
              ID Transaksi: <span className="font-bold">{txn}</span>
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes rumble {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-1px, 1.5px) rotate(-1deg); }
          50% { transform: translate(1.5px, -1px) rotate(1deg); }
          75% { transform: translate(-1.5px, -1.5px) rotate(0deg); }
        }
        .animate-rumble { animation: rumble 0.15s ease-in-out infinite; }
        @keyframes flicker-outer {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.6; }
          50% { transform: scaleY(1.1) scaleX(0.9); opacity: 0.8; }
        }
        .animate-flicker-outer { animation: flicker-outer 0.15s infinite alternate; }
        @keyframes flicker-mid {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.8; }
          50% { transform: scaleY(1.2) scaleX(0.85); opacity: 1; }
        }
        .animate-flicker-mid { animation: flicker-mid 0.1s infinite alternate; }
        @keyframes flicker-core {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.3) scaleX(0.8); }
        }
        .animate-flicker-core { animation: flicker-core 0.05s infinite alternate; }
        @keyframes launch {
          0% { transform: translateY(0); }
          15% { transform: translateY(15px); }
          100% { transform: translateY(-1200px); }
        }
        .animate-launch { animation: launch 1.2s cubic-bezier(0.5, -0.1, 0.1, 1) forwards; }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
      `}</style>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}