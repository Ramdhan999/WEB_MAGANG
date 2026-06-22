"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = "http://localhost:8080";
const DEBUG_STATE = true;

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
  const [fotoDiambil, setFotoDiambil] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [showFlash, setShowFlash] = useState(false);
  const [isDummyCapturing, setIsDummyCapturing] = useState(false);
  const [simMode, setSimMode] = useState(false);

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
          if (data.duration_seconds) setTimeLeft(data.duration_seconds);
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
              if (fullData.duration_seconds) setTimeLeft(fullData.duration_seconds);
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

      // ✅ Disable robot dulu sebelum redirect — fire and forget
      // (gak nunggu response biar redirect tetep cepet)
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
  // - preset_seq naik → SUARA 4 (gesture trigger preset → robot terima)
  // - done_seq naik   → START COUNTDOWN (hitungan + jepret)
  // - palm_seq / gesture_seq → DIIGNORE (gak dipake)
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

        // Suara 4 pas gesture trigger preset (telapak otomatis skip karena gak trigger preset)
        if (!isCountingDownRef.current && s.preset_seq > prev.preset) {
          playSound("4");
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
    <main className="relative flex h-screen flex-col items-center justify-start pt-6 pb-8 px-4 md:px-8 select-none overflow-hidden" style={{ backgroundColor: "#E3D5D5" }}>
      {showFlash && <div className="fixed inset-0 bg-white z-[100] animate-pulse"></div>}

      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[65%]" style={{ background: "linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)" }}></div>
        <div className="h-full flex-grow" style={{ background: "linear-gradient(90deg, #151515 0%, #252525 100%)", transform: "matrix(-1, 0, 0, 1, 0, 0)" }}></div>
      </div>

      <div className="w-full max-w-[1828px] flex-1 flex flex-col items-center z-10 mt-6 min-h-0">
        <div className="w-full h-[74px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] px-8 flex items-center justify-between shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="w-[37px] h-[37px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center shadow-inner">
              <img src="/icon1.png" alt="timer icon" className="w-[20px] h-[20px] object-contain" />
            </div>
            <div className="flex flex-col justify-center leading-none">
              <span className="font-hind font-semibold text-[24px] tracking-[-0.08em] text-[#405444] text-right">Sisa waktu sesi:</span>
              <span className="font-inter font-medium text-[20px] text-[#FFAE00] mt-1 tracking-[-0.06em]" style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.25)" }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {simMode && (
              <div className="px-4 h-[40px] bg-[#FFF1C2] border border-[#D29E38] rounded-[28px] flex items-center gap-2 shadow-inner">
                <span className="w-[12px] h-[12px] rounded-full bg-[#D29E38] animate-pulse"></span>
                <span className="font-hind font-bold text-[16px] text-[#9A6E1E] tracking-[-0.05em] pb-0.5">MODE SIMULASI</span>
              </div>
            )}
            <div className="w-[194px] h-[40px] bg-[#EAEAEA] border border-[#379AA1] rounded-[28px] flex items-center px-4 justify-between shadow-inner">
              <div className={`w-[18px] h-[18px] rounded-full shrink-0 ${isCameraActive ? "bg-[#40FF00] shadow-[0_0_8px_#40FF00]" : "bg-[#4B8C86]"}`}></div>
              <span className="font-hind font-semibold text-[20px] text-[#2B6E6A] tracking-[-0.08em] text-right pb-0.5">
                Robot {isCameraActive ? "Active" : "Stand-by"}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex items-end justify-between px-2 mb-2">
          <h1 className="font-inter font-bold text-[24px] text-[#3F3F3F] tracking-[-0.05em] leading-none">Sesi Foto</h1>
          <span className="font-hind font-semibold text-[20px] text-[#2E8040] tracking-[-0.08em] text-right leading-none pb-0.5">{fotoDiambil} foto di ambil.</span>
        </div>

        <div className="w-full flex-1 min-h-0 bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-[17px] flex flex-col shadow-sm relative">
          <h2 className="font-hind font-semibold text-[24px] text-[#303030] mb-3 ml-2 leading-none">Kamera Utama</h2>
          <div className="w-full flex-grow bg-black border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center justify-center overflow-hidden">
            {simMode ? (
              <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <img
                ref={imgRef}
                src={isCameraActive ? `${BACKEND_URL}/api/camera/stream` : undefined}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraActive ? "opacity-100" : "opacity-0"}`}
                crossOrigin="anonymous"
                alt="Live View DSLR"
              />
            )}

            {!isCameraActive && (
              <div className="flex flex-col items-center animate-pulse z-10">
                <span className="text-[40px] mb-2">📸</span>
                <span className="font-inter text-[#666666] text-[18px] font-medium text-center">Menyalakan kamera...</span>
              </div>
            )}

            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-30">
                <span className="text-[200px] font-black text-white drop-shadow-2xl animate-ping-once">{countdownNumber}</span>
              </div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/55 backdrop-blur-md px-5 py-2 rounded-full border border-white/15 z-20 shadow-lg">
              <span className="font-inter font-bold text-[15px] text-white"> ✋ TELAPAK TANGAN UNTUK AMBIL FOTO </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        @keyframes ping-once { 0% { transform: scale(1); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        .animate-ping-once { animation: ping-once 1s ease-out infinite; }
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