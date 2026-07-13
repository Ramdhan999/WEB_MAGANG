"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = "http://localhost:8080";
const DEBUG_STATE = true;


// 🎯 Gesture config
const START_GESTURE = 5;
const PRESET_GESTURES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 🎯 Mapping angka → nama file gambar di /public
const NUMBER_NAMES: Record<number, string> = {
  1: "satu", 2: "dua", 3: "tiga", 4: "empat", 5: "lima",
  6: "enam", 7: "tujuh", 8: "delapan", 9: "sembilan", 10: "sepuluh"
};


// 🎯 CAPTURE AREA GUIDE
const CAPTURE_ASPECT = 3 / 2;

// 🎯 Preview foto config — 5 detik
const PREVIEW_DURATION_SEC = 5;

// 🔒 FSM state type dari backend
type FsmStateType = "LOCKED" | "UNLOCKING" | "UNLOCKED" | "CONFIRMING" | "MOVING" | "COOLDOWN" | "";

// 🤖 Flask MJPEG stream URL
const FLASK_URL = "http://localhost:5001";
const FLASK_VIDEO_FEED = `${FLASK_URL}/video_feed`;

interface SessionData {
  id: number;
  transaction_id: string;
  template_name: string;
  frame_id: string;
}

// ============================================================================
// 🔢 MINI GESTURE CARD — untuk grid preset di sidebar
// ============================================================================
function MiniGestureCard({
  n,
  isStart,
  isActive,
  startTriggered,
}: {
  n: number;
  isStart?: boolean;
  isActive?: boolean;
  startTriggered?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgName = NUMBER_NAMES[n];

  return (
    <div
      className={`
        aspect-square rounded-[8px] flex items-center justify-center relative
        transition-all shadow-sm p-1
        ${isStart
          ? `bg-[#3A9F86] border-[2px] border-white shadow-[0_2px_6px_rgba(58,159,134,0.5)] ${startTriggered ? 'ring-2 ring-[#3A9F86]/60' : ''}`
          : isActive
            ? 'bg-[#3A9F86] border-[2px] border-white shadow-[0_0_10px_rgba(58,159,134,0.7)] scale-110'
            : 'bg-[#5A8073] border border-[#808080]'
        }
      `}
    >
      {!imgFailed ? (
        <img
          src={`/${imgName}.png`}
          alt={`Gesture ${n}`}
          className="w-full h-full object-contain"
          onError={() => setImgFailed(true)}
          draggable={false}
        />
      ) : (
        <span
          className="font-inter font-black text-white tracking-tight"
          style={{ fontSize: '22px', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
        >
          {n}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// 🤖 GESTURE DETECTION PANEL — panel kanan
// ============================================================================
function GestureDetectionPanel({
  fsmState,
  unlockProgress,
  activePreset,
  startTriggered,
}: {
  fsmState: FsmStateType;
  unlockProgress: number;
  activePreset: number | null;
  startTriggered: boolean;
}) {
  const [videoError, setVideoError] = useState(false);

  const isLocked = fsmState === "LOCKED" || fsmState === "";
  const isUnlocking = fsmState === "UNLOCKING";
  const isUnlocked = fsmState === "UNLOCKED";
  const isConfirming = fsmState === "CONFIRMING";
  const isMoving = fsmState === "MOVING";

  const stateBadge = isLocked
    ? { label: "LOCKED", color: "#B84545", borderColor: "#7A2E2E", bgColor: "rgba(184,69,69,0.15)" }
    : isUnlocking
      ? { label: "UNLOCKING", color: "#D29E38", borderColor: "#9A6E1E", bgColor: "rgba(210,158,56,0.15)" }
      : isUnlocked
        ? { label: "UNLOCKED", color: "#3A9F86", borderColor: "#245F55", bgColor: "rgba(58,159,134,0.15)" }
        : isConfirming
          ? { label: "CONFIRMING", color: "#3F9C9B", borderColor: "#235757", bgColor: "rgba(63,156,155,0.15)" }
          : isMoving
            ? { label: "MOVING", color: "#7B61FF", borderColor: "#4E3FA6", bgColor: "rgba(123,97,255,0.15)" }
            : { label: "COOLDOWN", color: "#6F6F6F", borderColor: "#404040", bgColor: "rgba(111,111,111,0.15)" };

  return (
    <div className="w-full h-full flex flex-col gap-3">

      {/* SECTION 1: HEADER TITLE */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-[40px] h-[40px] rounded-full bg-[#3A9F86] border-[2px] border-[#245F55] flex items-center justify-center shadow-md shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-hind font-bold text-[12px] text-[#6F6F6F] tracking-widest uppercase">
            Detection
          </span>
          <span className="font-inter font-bold text-[20px] text-[#332C2C] tracking-[-0.03em] mt-1">
            Gesture Preview
          </span>
        </div>
      </div>

      {/* SECTION 2: LIVE VIEW — MJPEG dari Flask */}
      <div className="w-full aspect-[4/3] rounded-[14px] overflow-hidden shadow-lg border-[3px] border-[#54868A] bg-[#232323] relative shrink-0">
        {!videoError ? (
          <img
            src={FLASK_VIDEO_FEED}
            alt="Robot detection live view"
            className="w-full h-full object-cover"
            onError={() => setVideoError(true)}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#232323] to-[#344A41]">
            <div className="w-[75px] h-[75px] rounded-full bg-white/10 border-[2px] border-white/20 flex items-center justify-center animate-pulse">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <p className="font-inter font-semibold text-[14px] text-white/70 text-center px-4">
              Menunggu koneksi robot...
            </p>
            <p className="font-hind font-medium text-[11px] text-white/45 tracking-widest uppercase">
              Live Detection Standby
            </p>
          </div>
        )}

        {!videoError && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full">
            <div className="w-[7px] h-[7px] rounded-full bg-[#FF3838] animate-pulse"></div>
            <span className="font-hind font-bold text-[10px] text-white tracking-widest">LIVE</span>
          </div>
        )}
      </div>

      {/* SECTION 3: FSM STATE */}
      <div
        className="rounded-[12px] px-4 py-3 border-[2px] shadow-sm flex items-center justify-between shrink-0"
        style={{
          backgroundColor: stateBadge.bgColor,
          borderColor: stateBadge.borderColor,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-[10px] h-[10px] rounded-full animate-pulse" style={{ backgroundColor: stateBadge.color }}></div>
          <span className="font-hind font-bold text-[11px] text-[#6F6F6F] tracking-widest uppercase">
            State
          </span>
        </div>
        <span
          className="font-inter font-black text-[18px] tracking-[-0.03em] leading-none"
          style={{ color: stateBadge.color }}
        >
          {stateBadge.label}
        </span>
      </div>

      {/* SECTION 4: UNLOCK PROGRESS */}
      <div className="bg-white rounded-[14px] p-4 border-[1.5px] border-[#D5C5B0] shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full bg-[#3A9F86]"></div>
            <span className="font-hind font-bold text-[12px] text-[#332C2C] tracking-wider uppercase">
              Unlock Progress
            </span>
          </div>
          <span className="font-inter font-black text-[18px] text-[#3A9F86] tracking-[-0.03em]">
            {Math.round(unlockProgress * 100)}%
          </span>
        </div>
        <div className="w-full h-[12px] bg-[#E3D5D5] rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${unlockProgress * 100}%`,
              background: 'linear-gradient(90deg, #3A9F86 0%, #96E4A9 100%)',
              boxShadow: unlockProgress > 0 ? '0 0 8px rgba(58,159,134,0.6)' : 'none'
            }}
          />
        </div>
      </div>

      {/* SECTION 5: PRESET GRID */}
      <div className="flex-1 bg-white rounded-[14px] p-4 border-[1.5px] border-[#D5C5B0] shadow-sm flex flex-col gap-3 min-h-0">

        {/* MULAI card — center top */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-[62px] h-[62px]">
            <MiniGestureCard n={5} isStart startTriggered={startTriggered} />
          </div>
          <span className="font-hind font-bold text-[11px] text-[#3A9F86] tracking-[0.1em] uppercase leading-tight">
            ① Mulai
          </span>
        </div>

        {/* Divider — di atas label */}
        <div className="h-[1px] bg-[#D5C5B0] shrink-0"></div>

        {/* Label preset — center, stacked */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <span className="font-hind font-bold text-[12px] text-[#2B6E6A] tracking-[0.1em] uppercase leading-tight">
            ② Pilih Preset
          </span>
          <span className="font-hind font-semibold text-[11px] text-[#6F6F6F] tracking-wider">
            Angka 1 - 10
          </span>
        </div>

        {/* Preset grid 5x2 */}
        <div className="grid grid-cols-5 gap-2 flex-1 content-center">
          {PRESET_GESTURES.map(n => (
            <div key={n} className="min-h-[62px]">
              <MiniGestureCard n={n} isActive={activePreset === n} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SesiFotoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get("txn") || "";

  const [session, setSession] = useState<SessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(300);
  const [initialDuration, setInitialDuration] = useState(300);
  const [fotoDiambil, setFotoDiambil] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [showFlash, setShowFlash] = useState(false);
  const [isDummyCapturing, setIsDummyCapturing] = useState(false);
  const [simMode, setSimMode] = useState(false);

  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [startTriggered, setStartTriggered] = useState(false);

  // 🔒 FSM state dari backend
  const [fsmState, setFsmState] = useState<FsmStateType>("LOCKED");
  const [unlockProgress, setUnlockProgress] = useState(0);

  // 🎯 Preview foto setelah jepret
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewCountdown, setPreviewCountdown] = useState(PREVIEW_DURATION_SEC);
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewPhotoRef = useRef<string | null>(null);

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

  // ===== FSM AUDIO FLOW TRACKING =====
  const prevFsmStateRef = useRef<FsmStateType>("");
  const hasPlayedIntroRef = useRef(false); // Guard: jari_mulai belum pernah main
  const isPlayingLayarRef = useRef(false); // Guard: layar.mp3 lagi main

  const seqRef = useRef({ palm: 0, gesture: 0, preset: 0, done: 0, init: false });
  const simModeRef = useRef(false);
  const isCountingDownRef = useRef(false);

  useEffect(() => { isCountingDownRef.current = isCountingDown; }, [isCountingDown]);

  // 🎯 Ukur aspect ratio kamera container
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

  // ===== PRELOAD AUDIO =====
  useEffect(() => {
    const files: Record<string, string> = {
      // Countdown (existing di /sounds)
      "4": "/sounds/4.mp3",
      "tiga": "/sounds/hitungan%20tiga.mp3",
      "dua": "/sounds/hitungan%20dua.mp3",
      "satu": "/sounds/hitungan%20satu.mp3",
      // Narasi flow (di /fase)
      "layar": "/fase/layar.mp3",
      "jari_mulai": "/fase/jari_mulai.mp3",
      "unlocked": "/fase/unlocked.mp3",
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

  const playSound = (key: string, onEnded?: () => void) => {
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

    // Handler onEnded — dipanggil sekali doang
    const handleEnded = () => {
      if (DEBUG_STATE) console.log("🔊 [SOUND] ended:", key);
      a.removeEventListener("ended", handleEnded);
      if (onEnded) onEnded();
    };
    a.addEventListener("ended", handleEnded);

    try {
      a.pause();
      a.currentTime = 0;
      currentAudioRef.current = a;
      a.play()
        .then(() => { if (DEBUG_STATE) console.log("🔊 [SOUND] play:", key); })
        .catch((e) => {
          if (e?.name === "AbortError") return;
          console.warn("🔇 [SOUND] gagal play:", key, e?.message);
        });
    } catch (e) { console.warn("🔇 [SOUND] error:", key, e); }
  };

  // 🔊 AUDIO FLOW #1: Pas page load → play layar.mp3 → chain ke jari_mulai.mp3
  useEffect(() => {
    if (!isCameraActive) return;
    if (isPlayingLayarRef.current) return;
    isPlayingLayarRef.current = true;

    // Delay kecil biar audio preload settle
    const timeout = setTimeout(() => {
      if (DEBUG_STATE) console.log("🔊 [FLOW] Play layar.mp3");
      playSound("layar", () => {
        // Chain: setelah layar selesai → play jari_mulai
        if (!hasPlayedIntroRef.current) {
          hasPlayedIntroRef.current = true;
          if (DEBUG_STATE) console.log("🔊 [FLOW] Chain: layar ended → play jari_mulai");
          playSound("jari_mulai");
        }
      });
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive]);

  // 🔊 AUDIO FLOW #2: FSM transition → play unlocked.mp3 + jari_mulai.mp3
  useEffect(() => {
    const prev = prevFsmStateRef.current;
    const curr = fsmState;

    // Transition LOCKED/UNLOCKING → UNLOCKED → play "unlocked.mp3"
    if ((prev === "UNLOCKING" || prev === "LOCKED") && curr === "UNLOCKED") {
      if (DEBUG_STATE) console.log("🔊 [FLOW] FSM → UNLOCKED, play unlocked.mp3");
      playSound("unlocked");
    }

    // Transition UNLOCKED/COOLDOWN → LOCKED (setelah capture selesai) → replay jari_mulai
    // Cek: jangan trigger pas fresh mount (prev = "" atau LOCKED awal)
    if (prev !== "" && prev !== "LOCKED" && curr === "LOCKED") {
      if (DEBUG_STATE) console.log("🔊 [FLOW] FSM back to LOCKED, replay jari_mulai");
      // Delay kecil biar transition ke UI clear dulu
      setTimeout(() => {
        playSound("jari_mulai");
      }, 500);
    }

    prevFsmStateRef.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsmState]);

  // 🎯 Show foto preview selama 5 detik
  const showPreview = (photoUrl: string) => {
    if (DEBUG_STATE) console.log("🖼️ [PREVIEW] show:", photoUrl);
    setPreviewPhoto(photoUrl);
    previewPhotoRef.current = photoUrl;
    setPreviewCountdown(PREVIEW_DURATION_SEC);

    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
    }

    let remaining = PREVIEW_DURATION_SEC;
    previewTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(previewTimerRef.current!);
        previewTimerRef.current = null;
        setPreviewPhoto(null);
        previewPhotoRef.current = null;
        if (DEBUG_STATE) console.log("🖼️ [PREVIEW] hide");
      } else {
        setPreviewCountdown(remaining);
      }
    }, 1000);
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

  // ⏸️ Timer PAUSE saat countdown atau preview
  useEffect(() => {
    if (timeLeft <= 0) return;
    if (isCountingDown || previewPhoto) return;

    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isCountingDown, previewPhoto]);

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
      router.push(`/terima-kasih?txn=${txn}`);
    }
  }, [timeLeft, session, txn, router]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) {
        clearInterval(previewTimerRef.current);
      }
    };
  }, []);

  // ===== POLLING ROBOT STATE =====
  useEffect(() => {
    if (!isCameraActive) return;

    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/robot/state`);
        const s = await res.json();
        if (DEBUG_STATE) console.log("[STATE]", s);

        simModeRef.current = !!s.sim_enabled;
        setSimMode(!!s.sim_enabled);

        // 🔒 Update FSM state + unlock progress
        const newFsmState = (s.fsm_state as FsmStateType) || "LOCKED";
        setFsmState(newFsmState);
        setUnlockProgress(s.unlock_progress || 0);

        const prev = seqRef.current;
        if (!prev.init) {
          seqRef.current = { palm: s.palm_seq, gesture: s.gesture_seq, preset: s.preset_seq, done: s.done_seq, init: true };
          return;
        }

        if (s.palm_seq > prev.palm) {
          setStartTriggered(true);
          if (DEBUG_STATE) console.log("✋ [PALM] MULAI ter-trigger");
        }

        if (!isCountingDownRef.current && !previewPhotoRef.current && s.preset_seq > prev.preset) {
          playSound("4");
          if (typeof s.current_preset === 'number') {
            setActivePreset(s.current_preset);
          }
        }

        if (s.done_seq > prev.done && !isCountingDownRef.current && !previewPhotoRef.current) {
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

      const targetAspect = CAPTURE_ASPECT;
      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const srcAspect = srcW / srcH;
      let sx = 0, sy = 0, sw = srcW, sh = srcH;
      if (srcAspect > targetAspect) {
        sw = srcH * targetAspect;
        sx = (srcW - sw) / 2;
      } else if (srcAspect < targetAspect) {
        sh = srcW / targetAspect;
        sy = (srcH - sh) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) { await takePhoto(true); return; }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      showPreview(dataUrl);

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

        const photoPath = data.photo_url
          || data.photo_path
          || data.photo?.photo_path
          || data.photo?.photo_url
          || (data.session?.photos && data.session.photos.length > 0
            ? data.session.photos[data.session.photos.length - 1].photo_path
            : null);

        if (photoPath) {
          const fullUrl = photoPath.startsWith("http") ? photoPath : `${BACKEND_URL}${photoPath}`;
          showPreview(fullUrl);
        } else {
          if (DEBUG_STATE) console.warn("🖼️ [PREVIEW] photo path gak ketemu di response:", data);
        }
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
    <main className="h-screen flex flex-col select-none overflow-hidden" style={{ backgroundColor: "#E3D5D5" }}>
      {showFlash && <div className="fixed inset-0 bg-white z-[100] animate-pulse" />}

      <div className="w-full h-[12px] shrink-0 flex z-40">
        <div className="h-full w-[65%]" style={{ background: "linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)" }}></div>
        <div className="h-full flex-grow" style={{ background: "linear-gradient(90deg, #151515 0%, #252525 100%)", transform: "matrix(-1, 0, 0, 1, 0, 0)" }}></div>
      </div>

      <header className="w-full h-[80px] bg-white border-b-[1.5px] border-[#54868A] flex items-center justify-between px-8 shrink-0">
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

        <div className="flex items-center gap-4">
          {simMode && (
            <div className="px-4 h-[36px] bg-[#FFF1C2] border border-[#D29E38] rounded-[28px] flex items-center gap-2 shadow-inner">
              <span className="w-[10px] h-[10px] rounded-full bg-[#D29E38] animate-pulse"></span>
              <span className="font-hind font-bold text-[14px] text-[#9A6E1E] tracking-[-0.05em]">MODE SIMULASI</span>
            </div>
          )}

          <div className="h-[40px] bg-[#EAEAEA] border border-[#54868A] rounded-[28px] flex items-center px-4 gap-2 shadow-inner">
            <span className="text-[16px]">📸</span>
            <span className="font-hind font-semibold text-[16px] text-[#2E8040] tracking-[-0.05em]">
              {fotoDiambil} foto diambil
            </span>
          </div>

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

      <div className="flex-1 flex overflow-hidden">

        <div className="flex-1 pl-5 pt-5 pb-5 flex overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>
          <div
            ref={cameraContainerRef}
            className="w-full h-full relative overflow-hidden rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.25)] border-[3px] border-[#54868A]"
            style={{ background: 'linear-gradient(180deg, #232323 0%, #344A41 100%)' }}
          >
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

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse z-10">
                <span className="text-[80px] mb-3">📸</span>
                <span className="font-inter text-white/70 text-[22px] font-medium">Menyalakan kamera...</span>
              </div>
            )}

            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
                <span className="text-[240px] font-black text-white drop-shadow-2xl animate-ping-once">{countdownNumber}</span>
              </div>
            )}

            {previewPhoto && (
              <div className="absolute inset-0 z-[95] animate-fade-in" style={{ background: 'linear-gradient(180deg, #232323 0%, #344A41 100%)' }}>
                <img
                  src={previewPhoto}
                  alt="Hasil foto"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <div className="w-[400px] shrink-0 bg-[#E3D5D5] p-4 overflow-y-auto">
          <GestureDetectionPanel
            fsmState={fsmState}
            unlockProgress={unlockProgress}
            activePreset={activePreset}
            startTriggered={startTriggered}
          />
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;0,900;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
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