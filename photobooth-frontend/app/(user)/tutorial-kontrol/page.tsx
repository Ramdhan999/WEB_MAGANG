"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

const BACKEND_URL = "http://localhost:8080";

// ============================================================
// 🖼️ SmartImg — gambar yang auto-retry kalau gagal load.
// Berguna khusus di popup MONITOR 2: kadang <img> gagal load
// pas window lagi pindah/resize ke layar kedua, dan gak retry sendiri.
// Komponen ini coba load ulang beberapa kali, dan kalau tetep gagal
// baru nampilin fallback (emoji).
// ============================================================
function SmartImg({
  src, alt, className, fallback,
}: { src: string; alt: string; className?: string; fallback?: string }) {
  const [tries, setTries] = useState(0);
  const [failed, setFailed] = useState(false);
  const MAX_RETRY = 4;

  // Cache-buster biar browser bener-bener fetch ulang pas retry
  const realSrc = tries === 0 ? src : `${src}?r=${tries}`;

  if (failed && fallback) {
    return <span className="text-white text-base font-bold">{fallback}</span>;
  }

  return (
    <img
      src={realSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (tries < MAX_RETRY) {
          // Retry: delay naik tiap percobaan (200ms, 400ms, 600ms...)
          setTimeout(() => setTries((t) => t + 1), 200 * (tries + 1));
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

// ============================================================
// 🖥️ KONFIG MONITOR 2 (UBAH PAS ONSITE)
// ------------------------------------------------------------
// MONITOR_2_OFFSET_X = lebar Monitor 1 dalam pixel.
//   Window reminder bakal dibuka mulai dari titik X ini, jadi
//   munculnya di layar kedua (yang ada di sebelah kanan monitor 1).
//   Contoh: kalau Monitor 1 Full-HD (1920px), set 1920.
//   Kalau monitor 2 ada di KIRI monitor 1, kasih nilai MINUS (-1920).
// MONITOR_2_WIDTH / HEIGHT = resolusi monitor 2.
// ============================================================
const MONITOR_2_OFFSET_X = 1920;
const MONITOR_2_OFFSET_Y = 0;
const MONITOR_2_WIDTH = 1920;
const MONITOR_2_HEIGHT = 1080;

function TutorialKontrolContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") || "";

  // reminder=1 → mode tampilan di MONITOR 2 (cuma buat ngingetin gesture)
  const isReminder = searchParams.get("reminder") === "1";

  const [activeIndex, setActiveIndex] = useState<number>(0);

  const gestures = [
    { id: '1jari', title: '1 Jari', desc: 'Glambot ke kanan.', img: '/1.png', btnBg: '#5A8073', icon: '→', btnIcon: '/icon_arrow.png' },
    { id: '2jari', title: '2 Jari', desc: 'Glambot ke kiri.', img: '/2.png', btnBg: '#805A75', icon: '←', btnIcon: '/icon_arrow.png', rotate: 'rotate-180' },
    { id: '3jari', title: '3 Jari', desc: 'Glambot ke atas.', img: '/3.png', btnBg: '#5A6B80', icon: '↑', btnIcon: '/icon_arrow.png', rotate: '-rotate-90' },
    { id: '4jari', title: '4 Jari', desc: 'Glambot ke bawah.', img: '/4.png', btnBg: '#5A8073', icon: '↓', btnIcon: '/icon_arrow.png', rotate: 'rotate-90' },
    { id: 'telapak', title: 'Telapak', desc: 'Stop & Tengah', img: '/5.png', btnBg: '#73805A', icon: '◎', btnIcon: '/icon_stop.png' },
    { id: 'kepalan', title: 'Kepalan', desc: 'Ambil Foto!', img: '/kepalan.png', btnBg: '#5A8073', icon: '📷', btnIcon: '/icon_camera.png' },
    { id: 'jempol', title: 'Jempol', desc: 'Konfirmasi / OK', img: '/jempol.png', btnBg: '#5A8078', icon: '✓', btnIcon: '/icon_check.png' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % gestures.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [gestures.length]);

  // ===== MODE REMINDER (MONITOR 2): dengerin sinyal sesi selesai → nutup diri =====
  useEffect(() => {
    if (!isReminder) return;
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("glambot_session");
      bc.onmessage = (e) => {
        if (e?.data?.type === "session_ended") {
          try { window.close(); } catch (err) { }
        }
      };
    } catch (err) { }
    return () => { try { bc?.close(); } catch (e) { } };
  }, [isReminder]);

  const activeGesture = gestures[activeIndex];

  const getMekanikStyle = (id: string) => {
    let cameraX = 0;
    let cameraY = 0;
    let lineX = 0;
    let lineHeight = 84;

    switch (id) {
      case '1jari': cameraX = 100; lineX = 100; break;
      case '2jari': cameraX = -100; lineX = -100; break;
      case '3jari': cameraY = -35; lineHeight = 84; break;
      case '4jari': cameraY = 35; lineHeight = 84; break;
    }

    return {
      camera: { transform: `translate(${cameraX}px, ${cameraY}px)` },
      line: { transform: `translateX(${lineX}px)`, height: `${lineHeight}px` }
    };
  };

  const mekanikStyle = getMekanikStyle(activeGesture.id);

  const getCardGradient = (id: string, isActive: boolean) => {
    if (isActive) return { background: 'radial-gradient(203.5% 118.75% at 50.3% -4.63%, #7F8E89 0%, #6EAB93 100%)', borderColor: '#A0A0A0' };
    switch (id) {
      case '1jari': return { background: 'radial-gradient(203.5% 118.75% at 50.3% -4.63%, #FFFFFF 0%, #999999 100%)' };
      case '2jari': return { background: 'radial-gradient(200.33% 116.9% at 52.12% -12.96%, #7C948B 0%, #A5849C 86.39%)' };
      case '3jari': return { background: 'radial-gradient(200.33% 116.9% at 50.3% -10.65%, #79988C 0%, #7B9EAC 87.27%)' };
      case '4jari': return { background: 'radial-gradient(172.69% 172.69% at 52.37% -45.6%, #7D918A 19.47%, #71A591 73.27%)' };
      case 'telapak': return { background: 'radial-gradient(172.96% 100% at 50.3% 0%, #7C938B 0%, #B1B191 100%)' };
      case 'kepalan': return { background: 'radial-gradient(234.34% 135.48% at 50.3% -35.48%, #85988C 0%, #A5849C 84.46%)' };
      case 'jempol': return { background: 'radial-gradient(172.96% 100% at 50.3% 0%, #88968E 0%, #70A691 100%)' };
      default: return { background: '#FFFFFF' };
    }
  };

  // =====================================================================
  // TOMBOL "SIAP MULAI SESI FOTO" — orchestrate 2 monitor + nyalain robot
  // =====================================================================
  const handleNext = async () => {
    if (!txn) {
      router.push("/kamera");
      return;
    }

    // 1. BUKA tutorial-kontrol (reminder) di MONITOR 2
    try {
      const features = `popup=yes,left=${MONITOR_2_OFFSET_X},top=${MONITOR_2_OFFSET_Y},width=${MONITOR_2_WIDTH},height=${MONITOR_2_HEIGHT}`;
      window.open(`/tutorial-kontrol?txn=${txn}&reminder=1`, "glambotMonitor2", features);
    } catch (err) {
      console.warn("Gagal buka monitor 2:", err);
    }

    // 2. NYALAIN ROBOT + KAMERA (API yang dulu di tombol "Mulai Sesi")
    try {
      await fetch(`${BACKEND_URL}/api/robot/enable`, { method: "POST" });
    } catch (err) {
      console.warn("Gagal enable robot:", err);
    }

    // 3. MONITOR 1 (window ini) → pindah ke kamera
    router.push(`/kamera?txn=${txn}`);
  };

  // ===== ICON TOMBOL pake SVG INLINE (gak butuh file PNG, gak akan 404) =====
  const renderBtnIcon = (id: string) => {
    const stroke = "#FFFFFF";
    const sw = 2.5;
    switch (id) {
      case '1jari': // panah kanan
        return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
      case '2jari': // panah kiri
        return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
      case '3jari': // panah atas
        return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
      case '4jari': // panah bawah
        return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>;
      case 'telapak': // stop (lingkaran target)
        return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" fill={stroke} stroke="none" /></svg>;
      case 'kepalan': // kamera
        return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
      case 'jempol': // ceklis
        return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw + 0.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>;
      default:
        return <span className="text-white text-base font-bold">✓</span>;
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center pt-4 pb-12 px-4 md:px-8 select-none overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>

      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[55%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* HEADER AREA */}
      <div className="w-full max-w-[1225px] flex flex-col items-center mt-12 mb-16 z-10 text-center relative px-2">
        <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">
          {isReminder ? "Sesi foto sedang berjalan" : "Sebelum mulai sesi foto"}
        </p>
        <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">
          Tutorial Kontrol Glambot
        </h1>
        <div className="text-[28px] text-[#328F7F] mb-3">★</div>
        <p className="font-hind font-normal text-[20px] text-[#706A6A] tracking-[-0.08em]">
          Glambot dapat di kontrol melalui gesture tangan seperti di bawah ini...
        </p>
      </div>

      {/* CONTAINER UTAMA */}
      <div className="w-full max-w-[1200px] flex flex-col xl:flex-row items-center justify-center gap-6 mb-10 z-10">

        {/* PANEL PREVIEW ROBOT */}
        <div
          className="w-full sm:w-[459px] h-[450px] flex flex-col items-center justify-between p-6 relative overflow-hidden shadow-md shrink-0"
          style={{
            background: 'radial-gradient(119.89% 119.89% at 50.11% -11%, #225444 0%, #102420 37.98%, #21293D 91.72%)',
            border: '1.5px solid #54868A',
            borderRadius: '23px'
          }}
        >
          <div className="flex items-center justify-center gap-2 px-4 h-[25px] bg-[#305A53] border border-[#5D837A] rounded-[41px] mt-2 self-start ml-2 shadow-inner">
            <div className="w-[13px] h-[13px] rounded-full bg-[#7DB7A2]" />
            <span className="font-hind font-semibold text-[16px] text-[#95C0B9] tracking-[-0.09em] pb-0.5">Pratinjau Langsung</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[298px] h-[7px] bg-[#213736] rounded-[11px] relative flex items-center justify-center">
              <div className="absolute w-[7px] bg-[#213736] rounded-[11px] origin-top top-[3.5px] transition-all duration-700 ease-in-out" style={mekanikStyle.line} />
              <div className="absolute w-[47px] h-[47px] bg-[#254040] rounded-[11px] flex items-center justify-center transition-transform duration-700 ease-in-out shadow-xl z-20 top-[-20px]" style={mekanikStyle.camera}>
                <div className="w-[21px] h-[21px] border-[3px] border-[#3E8568] rounded-full flex items-center justify-center">
                  <div className="w-[13px] h-[13px] rounded-full bg-[#27E6A0]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 px-4 h-[25px] bg-[#305A53] border border-[#5D837A] rounded-[41px] mb-2 shadow-inner">
            <span className="font-hind font-semibold text-[15px] text-[#95C0B9] tracking-[-0.09em] pb-0.5">{activeGesture.desc}</span>
            {['1jari', '2jari', '3jari', '4jari'].includes(activeGesture.id) && (
              <span className={`text-[12px] text-[#95C0B9] font-bold ${activeGesture.rotate || ''}`}>→</span>
            )}
          </div>
        </div>

        {/* GRID GESTURE */}
        <div className="flex-1 flex flex-wrap justify-start gap-3 max-w-[740px]">
          {gestures.map((gesture) => {
            const isActive = activeGesture.id === gesture.id;
            const cardStyle = getCardGradient(gesture.id, isActive);

            return (
              <div
                key={gesture.id}
                className={`w-[165px] h-[216px] flex flex-col items-center justify-between py-4 px-2 rounded-[23px] transition-all duration-500 shadow-md border ${isActive ? 'scale-[1.03] z-10 shadow-[0_0_15px_rgba(49,189,199,0.25)]' : 'border-[#54868A]'}`}
                style={cardStyle}
              >
                <h3 className="font-hind font-semibold text-[20px] text-white tracking-[-0.08em] text-center leading-none">{gesture.title}</h3>
                <div className="h-[50px] flex items-center justify-center shrink-0">
                  <SmartImg src={gesture.img} alt={gesture.title} className={`w-[48px] h-[50px] object-contain transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`} fallback={gesture.icon} />
                </div>
                <p className="font-hind font-normal text-[13px] text-[#475550] tracking-[-0.08em] text-center leading-tight max-w-[120px]">{gesture.desc.replace('.', '')}</p>
                <div className="w-[41px] h-[41px] rounded-[10px] border border-[#808080] flex items-center justify-center shadow-inner shrink-0" style={{ backgroundColor: gesture.btnBg }}>
                  {renderBtnIcon(gesture.id)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER — tombol cuma muncul di MONITOR 1 (bukan reminder) */}
      <div className="w-full max-w-[1200px] flex items-center justify-center z-10">
        {isReminder ? (
          <div className="flex items-center gap-3 px-8 h-[53px] bg-[#305A53] border border-[#5D837A] rounded-[23px] shadow-md">
            <span className="w-[14px] h-[14px] rounded-full bg-[#27E6A0] animate-pulse"></span>
            <span className="font-inter font-bold italic text-[20px] text-white tracking-[-0.06em]">
              Sesi berjalan — ikuti gesture di atas ✋
            </span>
          </div>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center justify-center gap-3 w-full sm:w-[265px] h-[53px] bg-[#3A9F86] border-3 border-[#E3D5D5] rounded-[23px] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em]">
              Siap! Mulai Sesi Foto
            </span>
            <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,800&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}

export default function TutorialKontrolPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <TutorialKontrolContent />
    </Suspense>
  );
}