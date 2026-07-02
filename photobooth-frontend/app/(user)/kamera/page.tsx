"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";
const DEBUG_STATE = true;


// 🎯 Gesture config
const START_GESTURE = 5;                                // Telapak (5 jari) → sinyal MULAI
const PRESET_GESTURES = [1, 2, 3, 4, 6, 7, 8, 9, 10]; // Preset (5 dipisahin karena buat mulai)

// 🎯 Mapping angka → nama file gambar di /public
const NUMBER_NAMES: Record<number, string> = {
  1: "satu", 2: "dua", 3: "tiga", 4: "empat", 5: "lima",
  6: "enam", 7: "tujuh", 8: "delapan", 9: "sembilan", 10: "sepuluh"
};


// 🎯 CAPTURE AREA GUIDE
// Aspect ratio SENSOR kamera Canon (default 3:2, sesuai 36×24mm)
// Ubah ke 4/3 kalo camera Anda 4:3, atau 2/3 kalo portrait mount
// Rumus: width / height
const CAPTURE_ASPECT = 3 / 2;

// =====================================================================
// SUARA YANG DIPAKAI (SIMPEL — CUMA 2):
//   1. "4" → main pas gesture (yang trigger preset) kedeteksi
//      → robot mulai gerak. Telapak gak ada suara (gak trigger preset).
//   2. "tiga/dua/satu" → countdown 3-2-1 SETELAH robot done → jepret.
// Suara 1, 2, 3, 8 DIBUANG (gak dipake).
// =====================================================================

interface SessionData {
  id: number;
  transaction_id: string;
  template_name: string;
  frame_id: string;
}

function SesiFotoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") || "";

  const [session, setSession] = useState<SessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(300);
  const [initialDuration, setInitialDuration] = useState(300); // 🎯 buat progress bar
  const [fotoDiambil, setFotoDiambil] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [showFlash, setShowFlash] = useState(false);
  const [isDummyCapturing, setIsDummyCapturing] = useState(false);
  const [simMode, setSimMode] = useState(false);

  // 🎯 Track preset yg lagi aktif (buat highlight card)
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [startTriggered, setStartTriggered] = useState(false);

  // 🎯 Camera container aspect tracking (buat guide strips)
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const [containerAspect, setContainerAspect] = useState(16 / 9);

  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasEndedRef = useRef(false);

  // ===== AUDIO =====
  const audioRef = useRef<Record<string, HTMLAudioElement>>({});
  const audioPathRef = useRef<Record<string, string>>({});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<{ key: string; time: number }>({ key: "", time: 0 });

  const seqRef = useRef({ palm: 0, gesture: 0, preset: 0, done: 0, init: false });
  const simModeRef = useRef(false);
  const isCountingDownRef = useRef(false);

  useEffect(() => { isCountingDownRef.current = isCountingDown; }, [isCountingDown]);
  usePageSound("/fase/layar.mp3");

  // 🎯 Ukur aspect ratio kamera container secara dinamis (buat guide strips)
  useEffect(() => {
    if (!cameraContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerAspect(width / height);
        }
      }
    });
    observer.observe(cameraContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // ===== PRELOAD AUDIO (cuma 4 file: suara 4 + 3 hitungan) =====
  useEffect(() => {
    const files: Record<string, string> = {
      "4": "/sounds/4.mp3",
      "tiga": "/sounds/hitungan%20tiga.mp3",
      "dua": "/sounds/hitungan%20dua.mp3",
      "satu": "/sounds/hitungan%20satu.mp3",
    };
    audioPathRef.current = files;
    const obj: Record<string, HTMLAudioElement> = {};
    for (const k in files) {
      const a = new Audio(files[k]);
      a.preload = "auto";
      a.addEventListener("error", () => {
        console.error(`🔇 [SOUND] GAGAL LOAD FILE: ${files[k]}`);
      });
      obj[k] = a;
    }
    audioRef.current = obj;
  }, []);

  // Single-channel + debounce — anti overlap
  const playSound = (key: string) => {
    const a = audioRef.current[key];
    if (!a) { console.warn("🔇 [SOUND] gak ada audio buat key:", key); return; }

    const now = Date.now();
    const last = lastPlayedRef.current;
    if (last.key === key && now - last.time < 1000) {
      if (DEBUG_STATE) console.log("🔇 [SOUND] skip duplicate:", key);
      return;
    }
    lastPlayedRef.current = { key, time: now };

    if (currentAudioRef.current && currentAudioRef.current !== a) {
      try { currentAudioRef.current.pause(); currentAudioRef.current.currentTime = 0; } catch (e) { }
    }

    try {
      a.pause();
      a.currentTime = 0;
      currentAudioRef.current = a;
      a.play()
        .then(() => { if (DEBUG_STATE) console.log("🔊 [SOUND] play:", key); })
        .catch((e) => console.warn("🔇 [SOUND] gagal play:", key, e?.message));
    } catch (e) { console.warn("🔇 [SOUND] error:", key, e); }
  };

  // ===== INIT SESSION =====
  useEffect(() => {
    const initSession = async () => {
      if (!txn) {
        setSessionError("Transaksi tidak valid. Mulai dari awal lagi.");
        setLoadingSession(false);
        return;
      }
      try {
        let res = await fetch(`${BACKEND_URL}/api/photo-session/by-transaction/${txn}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
          if (data.duration_seconds) {
            setTimeLeft(data.duration_seconds);
            setInitialDuration(data.duration_seconds);
          }
          if (data.session?.photos) setFotoDiambil(data.session.photos.length);
        } else if (res.status === 404) {
          const createRes = await fetch(`${BACKEND_URL}/api/photo-session/upsert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transaction_id: txn, frame_id: "", template_name: "" })
          });
          if (createRes.ok) {
            const newSession = await createRes.json();
            setSession(newSession);
            const refetch = await fetch(`${BACKEND_URL}/api/photo-session/by-transaction/${txn}`);
            if (refetch.ok) {
              const fullData = await refetch.json();
              if (fullData.duration_seconds) {
                setTimeLeft(fullData.duration_seconds);
                setInitialDuration(fullData.duration_seconds);
              }
            }
          } else {
            const errData = await createRes.json();
            setSessionError(errData.error || "Gagal buat session");
          }
        } else {
          const errData = await res.json();
          setSessionError(errData.error || "Gagal load session");
        }
      } catch (err) {
        console.error("Init session error:", err);
        setSessionError("Gagal konek ke server");
      } finally {
        setLoadingSession(false);
      }
    };
    initSession();
  }, [txn]);

  useEffect(() => {
    if (session && !isCameraActive) {
      setIsCameraActive(true);
      fetch(`${BACKEND_URL}/api/robot/enable`, { method: "POST" }).catch(() => { });
    }
  }, [session, isCameraActive]);

  useEffect(() => {
    if (!simMode) return;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.warn("Webcam gagal dibuka (sim):", e);
      }
    })();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [simMode]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // =====================================================================
  // ⏰ TIMER HABIS → DISABLE ROBOT + redirect ke /frame
  // =====================================================================
  useEffect(() => {
    if (session && timeLeft <= 0 && !hasEndedRef.current) {
      hasEndedRef.current = true;

      fetch(`${BACKEND_URL}/api/robot/disable`, { method: "POST" })
        .then(() => { if (DEBUG_STATE) console.log("🤖 [ROBOT] disabled — timer habis"); })
        .catch((err) => console.warn("🤖 [ROBOT] disable gagal (lanjut aja):", err));

      try {
        const bc = new BroadcastChannel("glambot_session");
        bc.postMessage({ type: "session_ended" });
        bc.close();
      } catch (e) { }
      router.push(`/frame?txn=${txn}`);
    }
  }, [timeLeft, session, txn, router]);

  // =====================================================================
  // POLLING STATE ROBOT
  // - palm_seq naik → sinyal MULAI ke-trigger (highlight card 5)
  // - preset_seq naik → SUARA 4 (gesture trigger preset → robot terima)
  // - done_seq naik   → START COUNTDOWN (hitungan + jepret)
  // =====================================================================
  useEffect(() => {
    if (!isCameraActive) return;

    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/robot/state`);
        const s = await res.json();
        if (DEBUG_STATE) console.log("[STATE]", s);

        simModeRef.current = !!s.sim_enabled;
        setSimMode(!!s.sim_enabled);

        const prev = seqRef.current;
        if (!prev.init) {
          seqRef.current = { palm: s.palm_seq, gesture: s.gesture_seq, preset: s.preset_seq, done: s.done_seq, init: true };
          return;
        }

        // 🎯 Telapak ke-trigger → sinyal MULAI aktif
        if (s.palm_seq > prev.palm) {
          setStartTriggered(true);
          if (DEBUG_STATE) console.log("✋ [PALM] MULAI ter-trigger");
        }

        // Suara 4 pas gesture trigger preset
        if (!isCountingDownRef.current && s.preset_seq > prev.preset) {
          playSound("4");
          // 🎯 Update active preset display (kalo backend kirim value preset)
          if (typeof s.current_preset === 'number') {
            setActivePreset(s.current_preset);
          }
        }

        // Robot DONE → countdown 3-2-1 → jepret
        if (s.done_seq > prev.done && !isCountingDownRef.current) {
          startSession();
        }

        seqRef.current = { palm: s.palm_seq, gesture: s.gesture_seq, preset: s.preset_seq, done: s.done_seq, init: true };
      } catch (err) { }
    };

    const interval = setInterval(poll, 500);
    poll();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive]);

  // ===== COUNTDOWN 3,2,1 (+ hitungan) → JEPRET =====
  const startSession = () => {
    if (isCountingDownRef.current) return;
    if (DEBUG_STATE) console.log("⏱️ [COUNTDOWN] mulai 3-2-1");
    setIsCountingDown(true);
    isCountingDownRef.current = true;
    setCountdownNumber(3);
    playSound("tiga");

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        playSound(count === 2 ? "dua" : "satu");
      } else {
        clearInterval(timer);
        doCapture();
      }
    }, 1000);
  };

  const doCapture = async () => {
    if (simModeRef.current) {
      await captureWebcamUpload();
    } else {
      await takePhoto(false);
    }
  };

  const captureWebcamUpload = async () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    if (!session) {
      setIsCountingDown(false);
      isCountingDownRef.current = false;
      return;
    }

    try {
      const video = videoRef.current;
      if (!video || !video.videoWidth) {
        console.warn("Webcam belum siap, fallback ke dummy");
        await takePhoto(true);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { await takePhoto(true); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      const res = await fetch(`${BACKEND_URL}/api/photo-session/${session.id}/capture-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("Upload webcam gagal:", data.error);
      } else {
        if (DEBUG_STATE) console.log("📸 WEBCAM Jepret!", data);
        if (data.total_photos !== undefined) setFotoDiambil(data.total_photos);
      }
    } catch (err) {
      console.error("captureWebcamUpload error:", err);
    } finally {
      setIsCountingDown(false);
      isCountingDownRef.current = false;
    }
  };

  const takePhoto = async (isDummy: boolean) => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    if (!session) {
      setIsCountingDown(false);
      isCountingDownRef.current = false;
      return;
    }

    try {
      const url = `${BACKEND_URL}/api/photo-session/${session.id}/capture${isDummy ? "?dummy=true" : ""}`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        console.error("Capture gagal:", data.error);
      } else {
        console.log(isDummy ? "🧪 DUMMY Jepret!" : "📸 DSLR Jepret!", data);
        if (data.total_photos !== undefined) setFotoDiambil(data.total_photos);
      }
    } catch (err) {
      console.error("Capture error:", err);
    }

    setIsCountingDown(false);
    isCountingDownRef.current = false;
  };

  const handleDummyCapture = async () => {
    if (isDummyCapturing) return;
    setIsDummyCapturing(true);
    await takePhoto(true);
    setTimeout(() => setIsDummyCapturing(false), 500);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "d" || e.key === "D") && session && !isDummyCapturing) handleDummyCapture();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isDummyCapturing]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // 🎯 Gesture card component (pake image dari /public/{nama_indonesia}.png)
  const GestureCard = ({ n, isStart, isActive }: { n: number; isStart?: boolean; isActive?: boolean }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const imgName = NUMBER_NAMES[n];
    return (
      <div
        className={`
          w-[80px] h-[80px] rounded-[10px] flex items-center justify-center relative
          transition-all shadow-md p-1
          ${isStart
            ? `bg-[#3A9F86] border-[3px] border-white shadow-[0_4px_10px_rgba(58,159,134,0.5)] ${startTriggered ? 'animate-pulse-scale ring-4 ring-[#3A9F86]/40' : ''}`
            : isActive
              ? 'bg-[#3A9F86] border-[3px] border-white shadow-[0_0_12px_rgba(58,159,134,0.6)] scale-110'
              : 'bg-[#5A8073] border border-[#808080]'
          }
        `}
      >
        {!imgFailed ? (
          <img
            src={`/${imgName}.png`}
            alt={`Gesture ${n} (${imgName})`}
            className="w-full h-full object-contain"
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        ) : (
          // Fallback kalo image gagal load → tampilin angka
          <span
            className="font-inter font-black text-white tracking-tight"
            style={{ fontSize: '40px', textShadow: '0 2px 4px rgba(0,0,0,0.35)' }}
          >
            {n}
          </span>
        )}
      </div>
    );
  };

  if (loadingSession) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: "#E3D5D5" }}>
        <p className="font-inter font-semibold text-[24px] text-[#395350]">Memuat sesi foto...</p>
      </main>
    );
  }

  if (sessionError || !session) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: "#E3D5D5" }}>
        <div className="bg-white rounded-[18px] shadow-lg p-10 text-center max-w-[500px]">
          <h1 className="font-inter font-bold text-[32px] text-[#332C2C] mb-3">Sesi Tidak Bisa Dimulai</h1>
          <p className="font-inter text-[16px] text-[#6F6F6F] mb-6">{sessionError || "Transaksi tidak ditemukan."}</p>
          <button onClick={() => router.push("/pilih-paket")} className="bg-[#38635A] text-white px-6 py-3 rounded-full font-bold text-[16px] hover:bg-[#2c4e47] transition-colors">← Mulai Ulang</button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col select-none overflow-hidden" style={{ backgroundColor: "#E3D5D5" }}>
      {showFlash && <div className="fixed inset-0 bg-white z-[100] animate-pulse" />}

      {/* 1. TOP GRADIENT BAR (12px, in-flow) */}
      <div className="w-full h-[12px] shrink-0 flex z-40">
        <div className="h-full w-[65%]" style={{ background: "linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)" }}></div>
        <div className="h-full flex-grow" style={{ background: "linear-gradient(90deg, #151515 0%, #252525 100%)", transform: "matrix(-1, 0, 0, 1, 0, 0)" }}></div>
      </div>

      {/* 2. HEADER */}
      <header className="w-full h-[80px] bg-white border-b-[1.5px] border-[#54868A] flex items-center justify-between px-8 shrink-0">
        {/* Left: timer */}
        <div className="flex items-center gap-4">
          <div className="w-[44px] h-[44px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center shadow-inner shrink-0">
            <img src="/icon1.png" alt="timer icon" className="w-[22px] h-[22px] object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-hind font-semibold text-[20px] text-[#405444] tracking-[-0.08em]">Sisa waktu sesi:</span>
            <span className="font-inter font-medium text-[22px] text-[#FFAE00] tracking-[-0.06em] mt-1" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.25)" }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Right: sim + robot + progress */}
        <div className="flex items-center gap-4">
          {simMode && (
            <div className="px-4 h-[36px] bg-[#FFF1C2] border border-[#D29E38] rounded-[28px] flex items-center gap-2 shadow-inner">
              <span className="w-[10px] h-[10px] rounded-full bg-[#D29E38] animate-pulse"></span>
              <span className="font-hind font-bold text-[14px] text-[#9A6E1E] tracking-[-0.05em]">MODE SIMULASI</span>
            </div>
          )}

          <div className="w-[194px] h-[40px] bg-[#EAEAEA] border border-[#379AA1] rounded-[28px] flex items-center px-4 justify-between shadow-inner">
            <div className={`w-[18px] h-[18px] rounded-full shrink-0 ${isCameraActive ? "bg-[#40FF00] shadow-[0_0_8px_#40FF00]" : "bg-[#4B8C86]"}`}></div>
            <span className="font-hind font-semibold text-[18px] text-[#2B6E6A] tracking-[-0.08em] text-right">
              Robot {isCameraActive ? "Active" : "Stand-by"}
            </span>
          </div>

          <div className="w-[158px] h-[12px] bg-[#373737] rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${initialDuration > 0 ? Math.max(0, (timeLeft / initialDuration) * 100) : 0}%`,
                background: 'linear-gradient(90deg, #18876F 0%, #2AEDC3 100%)'
              }}
            />
          </div>
        </div>
      </header>

      {/* 3. CAMERA AREA — EDGE-TO-EDGE, DARK GRADIENT */}
      <div ref={cameraContainerRef} className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #232323 0%, #344A41 100%)' }}>

        {/* Panduan pill (atas tengah) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[900px] h-[46px] bg-white border-[1.5px] border-[#54868A] rounded-[39px] flex items-center justify-center px-6 shadow-md">
          <span className="font-hind font-semibold text-[18px] text-[#303030] text-center tracking-tight">
            Jaga Jarak aman dari pergerakan lengan robot. Panduan lengkap ada di layar eksternal.
          </span>
        </div>

        {/* Foto count badge (atas kanan) */}
        <div className="absolute top-4 right-4 z-20 bg-white/95 border-[1.5px] border-[#54868A] px-4 py-1.5 rounded-full shadow-md">
          <span className="font-hind font-semibold text-[18px] text-[#2E8040] tracking-[-0.05em]">
            📸 {fotoDiambil} foto diambil
          </span>
        </div>

        {/* Camera stream — FILL width & height */}
        {simMode ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        ) : (
          <img
            ref={imgRef}
            src={isCameraActive ? `${BACKEND_URL}/api/camera/stream` : undefined}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraActive ? "opacity-100" : "opacity-0"}`}
            crossOrigin="anonymous"
            alt="Live View DSLR"
          />
        )}

        {/* 🎯 CAPTURE AREA GUIDE — blur strips kiri-kanan (yang bakal ke-crop) */}
        {(() => {
          const sideStripPercent = containerAspect > CAPTURE_ASPECT
            ? ((1 - CAPTURE_ASPECT / containerAspect) / 2) * 100
            : 0;
          if (sideStripPercent < 0.5) return null; // skip kalo strip terlalu tipis (aspect udah pas)

          const stripStyle: React.CSSProperties = {
            width: `${sideStripPercent}%`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(15, 25, 25, 0.55)',
          };
          return (
            <>
              {/* Strip KIRI (ke-crop) */}
              <div
                className="absolute top-0 left-0 h-full pointer-events-none z-[5]"
                style={{ ...stripStyle, borderRight: '2px solid rgba(255, 255, 255, 0.7)', boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.35)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-70">
                  {/* <span className="text-white text-[18px]">✂</span>
                  <span className="font-hind font-bold text-white text-[9px] tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                    KE-CROP
                  </span> */}
                </div>
              </div>

              {/* Strip KANAN (ke-crop) */}
              <div
                className="absolute top-0 right-0 h-full pointer-events-none z-[5]"
                style={{ ...stripStyle, borderLeft: '2px solid rgba(255, 255, 255, 0.7)', boxShadow: 'inset 4px 0 8px rgba(0,0,0,0.35)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-70">
                  {/* <span className="text-white text-[18px]">✂</span>
                  <span className="font-hind font-bold text-white text-[9px] tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    KE-CROP
                  </span> */}
                </div>
              </div>

              {/* Label bawah — info aspect */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[6] pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 shadow-md">
                  {/* <span className="font-hind font-semibold text-white text-[11px] tracking-wider">
                    📷 Area foto (rasio {CAPTURE_ASPECT === 1.5 ? '3:2' : CAPTURE_ASPECT === (4/3) ? '4:3' : CAPTURE_ASPECT === (2/3) ? '2:3' : CAPTURE_ASPECT.toFixed(2)}) — merapat ke tengah biar semua kefoto
                  </span> */}
                </div>
              </div>
            </>
          );
        })()}

        {/* Loading state */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse z-10">
            <span className="text-[80px] mb-3">📸</span>
            <span className="font-inter text-white/70 text-[22px] font-medium">Menyalakan kamera...</span>
          </div>
        )}

        {/* Countdown overlay */}
        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
            <span className="text-[240px] font-black text-white drop-shadow-2xl animate-ping-once">{countdownNumber}</span>
          </div>
        )}
      </div>

      {/* 4. GESTURE STRIP — MULAI (5) | PRESET (1-4, 6-10) */}
      <div className="w-full h-[150px] bg-white border-t-[1.5px] border-[#54868A] flex items-stretch gap-5 px-8 py-3 shrink-0">

        {/* --- MULAI GROUP (gesture 5) --- */}
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          <span className="font-hind font-bold text-[12px] text-[#3A9F86] tracking-[0.15em] uppercase">
            ① Mulai dulu
          </span>
          <GestureCard n={5} isStart />
        </div>

        {/* --- SEPARATOR (arrow) --- */}
        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
          <div className="w-[2px] h-[30px] bg-gradient-to-b from-transparent to-[#CCCCCC]"></div>
          <div className="text-[22px] text-[#B5B5B5] font-bold leading-none">→</div>
          <div className="w-[2px] h-[30px] bg-gradient-to-t from-transparent to-[#CCCCCC]"></div>
        </div>

        {/* --- PRESET GROUP (gesture 1,2,3,4,6,7,8,9,10) --- */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <span className="font-hind font-bold text-[12px] text-[#2B6E6A] tracking-[0.15em] uppercase">
            ② Lalu pilih preset 1-10
          </span>
          <div className="flex gap-2 items-center">
            {PRESET_GESTURES.map(n => (
              <GestureCard key={n} n={n} isActive={activePreset === n} />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;0,900;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        @keyframes ping-once { 0% { transform: scale(1); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        .animate-ping-once { animation: ping-once 1s ease-out infinite; }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 10px rgba(58,159,134,0.5); }
          50% { transform: scale(1.08); box-shadow: 0 4px 20px rgba(58,159,134,0.8); }
        }
        .animate-pulse-scale { animation: pulse-scale 1.2s ease-in-out infinite; }
      `}</style>
    </main>
  );
}

export default function SesiFotoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <SesiFotoContent />
    </Suspense>
  );
}