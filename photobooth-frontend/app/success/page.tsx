"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success">("verifying");

  useEffect(() => {
    const verifyTimer = setTimeout(() => {
      setStatus("success");
    }, 3000);

    const redirectTimer = setTimeout(() => {
      router.push("/tutorial-kontrol"); 
    }, 5500);

    return () => {
      clearTimeout(verifyTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 md:px-0"
      style={{ backgroundColor: '#E3D5D5' }} 
    >
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-20 flex">
        <div className="h-full w-[45%]" style={{ backgroundImage: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      {/* 1. BADGE VERIFIKASI */}
      <div 
        className="absolute top-12 md:top-16 flex items-center justify-center gap-3 shadow-md animate-fade-in-down z-10 rounded-full" 
        style={{ width: '224px', height: '56px', backgroundColor: '#476A53', border: '1px solid #85DDA6' }}
      >
        <div style={{ width: '24px', height: '24px', backgroundImage: 'linear-gradient(180deg, #75FFC3 0%, #72F6BD 45.19%, #548A72 100%)', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
        <span className="font-inter font-bold text-[20px] md:text-[24px]" style={{ backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #A9E2B5 0%, #4DE8D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Verifikasi
        </span>
      </div>

      {/* 2. KONTEN TENGAH */}
      <div className="relative flex flex-col items-center justify-center z-30 mt-16">
        
        {/* AREA ANIMASI ROKET & API */}
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
              {/* Layer 1: Core Putih/Kuning Terang (Inti Api yang paling panas) */}
              <div className="absolute top-0 w-[12px] md:w-[18px] h-[30px] md:h-[45px] rounded-full blur-[2px] animate-flicker-core z-30" style={{ background: '#FFFFFF', boxShadow: '0 0 10px #FFFFCC' }}></div>
              
              {/* Layer 2: Oranye Terang (Tengah) */}
              <div className="absolute top-0 w-[24px] md:w-[35px] h-[50px] md:h-[80px] rounded-full blur-[5px] md:blur-[8px] animate-flicker-mid z-20" style={{ background: '#FF9900' }}></div>
              
              {/* Layer 3: Merah Gelap (Luar / Ekzos) */}
              <div className="absolute top-0 w-[35px] md:w-[50px] h-[70px] md:h-[110px] rounded-full blur-[10px] md:blur-[14px] animate-flicker-outer z-10" style={{ background: '#FF3300', opacity: 0.7 }}></div>
            </div>

          </div>

        </div>

        {/* TEXT AREA */}
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
        </div>

      </div>

      {/* KEYFRAMES CSS UNTUK ANIMASI ROKET & API */}
      <style jsx global>{`
        /* Animasi Getar (Mesin Nyala) */
        @keyframes rumble {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-1px, 1.5px) rotate(-1deg); }
          50% { transform: translate(1.5px, -1px) rotate(1deg); }
          75% { transform: translate(-1.5px, -1.5px) rotate(0deg); }
        }
        .animate-rumble {
          animation: rumble 0.15s ease-in-out infinite;
        }

        /* --- API LAYER LUAR (Merah, bergerak lebih lambat) --- */
        @keyframes flicker-outer {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.6; }
          50% { transform: scaleY(1.1) scaleX(0.9); opacity: 0.8; }
        }
        .animate-flicker-outer {
          animation: flicker-outer 0.15s infinite alternate;
        }

        /* --- API LAYER TENGAH (Oranye) --- */
        @keyframes flicker-mid {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.8; }
          50% { transform: scaleY(1.2) scaleX(0.85); opacity: 1; }
        }
        .animate-flicker-mid {
          animation: flicker-mid 0.1s infinite alternate;
        }

        /* --- API CORE (Putih/Kuning, bergetar sangat cepat) --- */
        @keyframes flicker-core {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.3) scaleX(0.8); }
        }
        .animate-flicker-core {
          animation: flicker-core 0.05s infinite alternate;
        }

        /* Animasi Terbang Tembus Atas Layar */
        @keyframes launch {
          0% { transform: translateY(0); }
          15% { transform: translateY(15px); } /* Turun dikit buat ancang-ancang */
          100% { transform: translateY(-1200px); } /* Melesat jauh ke atas */
        }
        .animate-launch {
          animation: launch 1.2s cubic-bezier(0.5, -0.1, 0.1, 1) forwards;
        }

        /* Animasi Fade In Badge Atas */
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
      `}</style>
    </main>
  );
}