"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = "http://localhost:8080";
const DEBUG_STATE = true;

// 🎯 Gesture config
const START_GESTURE = 5;
const PRESET_GESTURES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const NUMBER_NAMES: Record<number, string> = {
  1: "satu", 2: "dua", 3: "tiga", 4: "empat", 5: "lima",
  6: "enam", 7: "tujuh", 8: "delapan", 9: "sembilan", 10: "sepuluh"
};

// 🎯 CAPTURE AREA GUIDE
const CAPTURE_ASPECT = 3 / 2;
const PREVIEW_DURATION_SEC = 3;

// 🎯 Audio loop config
const JARI_MULAI_GAP_MS = 5000;

// 🛟 Batas aman satu siklus jepret. Dinaikkan jadi 45 detik karena capture
//    DSLR sendiri sudah makan ~6 detik (shutter → tulis kartu → transfer USB).
const SHOT_TIMEOUT_MS = 45000;

// 🔌 Reconnect feed gesture setelah tiap siklus jepret.
//    CATATAN JUJUR: belum terbukti perlu. Diagnosis terakhir menunjukkan yang
//    bikin layar "nyangkut" adalah jeda capture DSLR (~6 detik), bukan feed
//    Flask yang beku. Kalau setelah overlay "Menyimpan foto..." dipasang
//    tampilan sudah mulus, set GESTURE_RECONNECT = false untuk memangkas
//    600ms tambahan di akhir tiap siklus.
const GESTURE_RECONNECT = true;
const GESTURE_KILL_MS = 250;
const GESTURE_WARMUP_MS = 350;

// 🧪 SIM ON → LANGSUNG tampil webcam (bypass feed gesture Flask), biar pas
//    `curl /api/sim/on` layar langsung pindah ke mode simulasi, nggak nyangkut
//    di gesture. Ini perilaku yang diinginkan buat tes jepret via curl.
const SIM_BYPASS_GESTURE = true;

type FsmStateType = "LOCKED" | "UNLOCKING" | "UNLOCKED" | "CONFIRMING" | "MOVING" | "COOLDOWN" | "";
type FeedMode = "gesture" | "photo";

const FLASK_URL = "http://localhost:5001";
const FLASK_VIDEO_FEED = `${FLASK_URL}/video_feed`;

interface SessionData {
  id: number;
  transaction_id: string;
  template_name: string;
  frame_id: string;
}

// ============================================================================
// 🔢 MINI GESTURE CARD
// ============================================================================
function MiniGestureCard({
  n,
  isStart,
  isActive,
  isUsed,
  startTriggered,
}: {
  n: number;
  isStart?: boolean;
  isActive?: boolean;
  isUsed?: boolean;
  startTriggered?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgName = NUMBER_NAMES[n];

  return (
    <div
      className={`
        aspect-square rounded-[10px] flex items-center justify-center relative
        transition-all shadow-sm p-1.5
        ${isStart
          ? `bg-[#3A9F86] border-[2px] border-white shadow-[0_2px_6px_rgba(58,159,134,0.5)] ${startTriggered ? 'ring-2 ring-[#3A9F86]/60' : ''}`
          : isActive
            ? 'bg-[#57D6AF] border-[2px] border-[#1D5A4B] scale-110 shadow-[0_4px_0_0_#1D5A4B,0_8px_14px_rgba(29,90,75,0.5),inset_0_2px_5px_rgba(255,255,255,0.55)]'
            : isUsed
              ? 'bg-[#3A9F86] border-[2px] border-white shadow-[0_2px_6px_rgba(58,159,134,0.5)]'
              : 'bg-[#48665C] border border-[#6E6E6E]'
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
          style={{ fontSize: '28px', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
        >
          {n}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// 🎯 SIDE PANEL
// ============================================================================
function SidePanel({
  fsmState,
  unlockProgress,
  activePreset,
  usedPresets,
  startTriggered,
}: {
  fsmState: FsmStateType;
  unlockProgress: number;
  activePreset: number | null;
  usedPresets: number[];
  startTriggered: boolean;
}) {
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
    <div className="w-full h-full flex flex-col gap-3 overflow-y-auto">

      {/* SECTION 1: HEADER TITLE */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-[40px] h-[40px] rounded-full bg-[#3A9F86] border-[2px] border-[#245F55] flex items-center justify-center shadow-md shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"></path>
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-hind font-bold text-[15px] text-[#6F6F6F] tracking-widest uppercase">
            Detection Panel
          </span>
          <span className="font-inter font-bold text-[20px] text-[#332C2C] tracking-[-0.03em] mt-1">
            Kontrol Kamera
          </span>
        </div>
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
          <span className="font-hind font-bold text-[13px] text-[#6F6F6F] tracking-widest uppercase">
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
            <span className="font-hind font-bold text-[15px] text-[#332C2C] tracking-wider uppercase">
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

      {/* SECTION 5: PRESET SECTION */}
      <div className="bg-white rounded-[14px] p-3 border-[1.5px] border-[#D5C5B0] shadow-sm flex flex-col gap-2.5 shrink-0">

        <div className="flex flex-col items-center gap-1.5 pb-2 border-b border-[#D5C5B0]">
          <span className="font-hind font-bold text-[13px] text-[#3A9F86] tracking-[0.1em] uppercase leading-tight">
            ① Mulai (Gesture Angka {START_GESTURE})
          </span>
          <div className="w-[90px] h-[90px]">
            <MiniGestureCard n={START_GESTURE} isStart startTriggered={startTriggered} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="font-hind font-bold text-[13px] text-[#2B6E6A] tracking-[0.1em] uppercase leading-tight">
            ② Pilih Preset
          </span>
          <span className="font-hind font-semibold text-[12px] text-[#6F6F6F] tracking-wider">
            Angka 1 - 10
          </span>
          <span className="font-hind font-bold text-[13px] text-[#2B6E6A] tracking-[0.1em] uppercase leading-tight text-center mt-1">
            Ijo Cerah = Preset Sudah Dipakai
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-[200px] mx-auto w-full">
          {PRESET_GESTURES.map(n => (
            <div key={n}>
              <MiniGestureCard n={n} isActive={activePreset === n} isUsed={usedPresets.includes(n)} />
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
  const [isCapturing, setIsCapturing] = useState(false);

  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [usedPresets, setUsedPresets] = useState<number[]>([]);
  const activePresetRef = useRef<number | null>(null);
  const [startTriggered, setStartTriggered] = useState(false);

  const [fsmState, setFsmState] = useState<FsmStateType>("LOCKED");
  const [unlockProgress, setUnlockProgress] = useState(0);

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  // Frame live view DSLR dikirim backend APA ADANYA (natural) — efek cermin
  // diurus CSS scaleX(-1). Preview snapshot DSLR ikut di-mirror biar sama
  // persis kayak yang barusan keliatan; foto tersimpan/print tetap natural.
  const [previewMirrored, setPreviewMirrored] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewPhotoRef = useRef<string | null>(null);

  // ===== REFS UMUM =====
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasEndedRef = useRef(false);
  const simModeRef = useRef(false);
  const isCountingDownRef = useRef(false);
  const isCapturingRef = useRef(false);
  const seqRef = useRef({ palm: 0, gesture: 0, preset: 0, done: 0, init: false });

  // ==========================================================================
  // 🎥 TAHAP JEPRET — penentu tunggal kamera mana yang tampil.
  //
  //    idle     → kamera GESTURE (Flask)
  //    framing  → DSLR  (preset terkonfirmasi, robot nge-frame)
  //    shooting → DSLR  (hitungan 3-2-1, LALU jeda capture ~6 detik)
  //    preview  → hasil foto nutup layar
  // ==========================================================================
  type ShotPhase = "idle" | "framing" | "shooting" | "preview";
  const [shotPhase, setShotPhase] = useState<ShotPhase>("idle");
  const shotPhaseRef = useRef<ShotPhase>("idle");

  const goPhase = (p: ShotPhase) => {
    if (shotPhaseRef.current === p) return;
    if (DEBUG_STATE) console.log(`🎥 [FASE] ${shotPhaseRef.current} → ${p}`);
    shotPhaseRef.current = p;
    setShotPhase(p);
  };

  const feedMode: FeedMode =
    (SIM_BYPASS_GESTURE && simMode) || shotPhase !== "idle" ? "photo" : "gesture";

  // ===== KONTROL FEED GESTURE =====
  const [flaskVideoError, setFlaskVideoError] = useState(false);
  const [gestureAlive, setGestureAlive] = useState(true);
  const [gestureKey, setGestureKey] = useState(0);

  const reconnectTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const endingCycleRef = useRef(false);

  const clearReconnectTimers = () => {
    reconnectTimersRef.current.forEach((t) => clearTimeout(t));
    reconnectTimersRef.current = [];
  };

  // ===== AUDIO =====
  const audioRef = useRef<Record<string, HTMLAudioElement>>({});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<{ key: string; time: number }>({ key: "", time: 0 });
  // 🩹 Simpan listener 'ended' yang masih nempel per audio, supaya bisa dilepas.
  //    Sebelumnya listener cuma dilepas kalau audio selesai normal — kalau
  //    di-pause di tengah, listener-nya nempel selamanya dan menumpuk tiap
  //    pemutaran. Gejalanya: satu suara memicu callback berkali-kali.
  const endedHandlersRef = useRef<Record<string, () => void>>({});

  const prevFsmStateRef = useRef<FsmStateType>("");
  const hasPlayedLayarRef = useRef(false);
  const jariMulaiLoopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jariMulaiLoopActiveRef = useRef(false);
  const pendingJariMulaiRef = useRef(false);

  useEffect(() => { isCountingDownRef.current = isCountingDown; }, [isCountingDown]);
  useEffect(() => { isCapturingRef.current = isCapturing; }, [isCapturing]);

  // ==========================================================================
  // 🔚 TUTUP SIKLUS JEPRET — dipanggil saat preview 3 detik selesai.
  // ==========================================================================
  const endShotCycle = () => {
    if (endingCycleRef.current) return;
    endingCycleRef.current = true;

    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    const finish = () => {
      previewPhotoRef.current = null;
      setPreviewPhoto(null);
      goPhase("idle");
      endingCycleRef.current = false;
      if (DEBUG_STATE) console.log("🖼️ [PREVIEW] selesai → kamera gesture");
    };

    if (!GESTURE_RECONNECT) { finish(); return; }

    if (DEBUG_STATE) console.log("🔌 [GESTURE] putus koneksi lama...");
    setGestureAlive(false);

    const t1 = setTimeout(() => {
      setGestureKey((k) => k + 1);
      setFlaskVideoError(false);
      setGestureAlive(true);
      if (DEBUG_STATE) console.log("🔌 [GESTURE] koneksi baru dibuka");

      const t2 = setTimeout(finish, GESTURE_WARMUP_MS);
      reconnectTimersRef.current.push(t2);
    }, GESTURE_KILL_MS);
    reconnectTimersRef.current.push(t1);
  };

  // 🛟 Pengaman kalau satu siklus jepret kelamaan
  useEffect(() => {
    if (shotPhase === "idle") return;
    const t = setTimeout(() => {
      console.warn("🛟 [FASE] kelamaan, dipaksa balik ke gesture");
      setIsCountingDown(false);
      isCountingDownRef.current = false;
      setIsCapturing(false);
      isCapturingRef.current = false;
      endShotCycle();
    }, SHOT_TIMEOUT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shotPhase]);

  // ===== PRELOAD AUDIO =====
  useEffect(() => {
    const files: Record<string, string> = {
      "4": "/sounds/4.mp3",
      "tiga": "/sounds/hitungan%20tiga.mp3",
      "dua": "/sounds/hitungan%20dua.mp3",
      "satu": "/sounds/hitungan%20satu.mp3",
      "layar": "/fase/layar.mp3",
      "jari_mulai": "/fase/jari_mulai.mp3",
      "unlocked": "/fase/unlocked.mp3",
    };
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
    if (last.key === key && now - last.time < 500) {
      if (DEBUG_STATE) console.log("🔇 [SOUND] skip duplicate:", key);
      return;
    }
    lastPlayedRef.current = { key, time: now };

    if (currentAudioRef.current && currentAudioRef.current !== a) {
      try { currentAudioRef.current.pause(); currentAudioRef.current.currentTime = 0; } catch (e) { }
    }

    // 🩹 Lepas listener lama dulu — ini yang bocor di versi sebelumnya.
    const stale = endedHandlersRef.current[key];
    if (stale) {
      a.removeEventListener("ended", stale);
      delete endedHandlersRef.current[key];
    }

    const handleEnded = () => {
      if (DEBUG_STATE) console.log("🔊 [SOUND] ended:", key);
      a.removeEventListener("ended", handleEnded);
      delete endedHandlersRef.current[key];
      if (onEnded) onEnded();
    };
    endedHandlersRef.current[key] = handleEnded;
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

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) { }
      currentAudioRef.current = null;
    }
  };

  const startJariMulaiLoop = () => {
    // 🔇 Jangan bunyi "angkat jari buat mulai" pas orangnya lagi difoto.
    //    FSM sempat balik ke LOCKED di tengah shooting, dan tanpa penjaga ini
    //    suaranya kedengeran persis waktu shutter.
    if (shotPhaseRef.current !== "idle") {
      pendingJariMulaiRef.current = true;
      if (DEBUG_STATE) console.log("🔇 [FLOW] jari_mulai ditunda, lagi fase:", shotPhaseRef.current);
      return;
    }
    if (jariMulaiLoopActiveRef.current) return;
    jariMulaiLoopActiveRef.current = true;
    pendingJariMulaiRef.current = false;

    if (DEBUG_STATE) console.log("🔊 [FLOW] Start jari_mulai loop (with 5s gap)");

    const playLoop = () => {
      if (!jariMulaiLoopActiveRef.current) return;
      if (shotPhaseRef.current !== "idle") return;
      playSound("jari_mulai", () => {
        if (!jariMulaiLoopActiveRef.current) return;
        if (DEBUG_STATE) console.log("🔊 [FLOW] jari_mulai ended, wait 5s...");

        jariMulaiLoopTimerRef.current = setTimeout(() => {
          jariMulaiLoopTimerRef.current = null;
          if (jariMulaiLoopActiveRef.current) playLoop();
        }, JARI_MULAI_GAP_MS);
      });
    };

    playLoop();
  };

  const stopJariMulaiLoop = () => {
    if (!jariMulaiLoopActiveRef.current) return;
    if (DEBUG_STATE) console.log("🔊 [FLOW] Stop jari_mulai loop (interrupted)");
    jariMulaiLoopActiveRef.current = false;

    if (jariMulaiLoopTimerRef.current) {
      clearTimeout(jariMulaiLoopTimerRef.current);
      jariMulaiLoopTimerRef.current = null;
    }

    if (currentAudioRef.current === audioRef.current["jari_mulai"]) {
      stopCurrentAudio();
    }
  };

  // 🔊 Begitu balik ke idle, baru loop yang tadi ditunda boleh jalan.
  useEffect(() => {
    if (shotPhase !== "idle") {
      stopJariMulaiLoop();
      return;
    }
    if (pendingJariMulaiRef.current) {
      const t = setTimeout(() => startJariMulaiLoop(), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shotPhase]);

  // 🔊 AUDIO FLOW #1
  useEffect(() => {
    if (!isCameraActive || hasPlayedLayarRef.current) return;
    hasPlayedLayarRef.current = true;

    const timeout = setTimeout(() => {
      if (DEBUG_STATE) console.log("🔊 [FLOW] Play layar.mp3");
      playSound("layar", () => {
        if (DEBUG_STATE) console.log("🔊 [FLOW] Chain: layar → jari_mulai loop");
        startJariMulaiLoop();
      });
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive]);

  // 🔊 AUDIO FLOW #2
  useEffect(() => {
    const prev = prevFsmStateRef.current;
    const curr = fsmState;

    if ((prev === "UNLOCKING" || prev === "LOCKED") && curr === "UNLOCKED") {
      if (DEBUG_STATE) console.log("🔊 [FLOW] FSM → UNLOCKED, stop jari_mulai + play unlocked");
      stopJariMulaiLoop();
      if (shotPhaseRef.current === "idle") {
        setTimeout(() => playSound("unlocked"), 100);
      }
    }

    if (prev !== "" && prev !== "LOCKED" && curr === "LOCKED") {
      if (DEBUG_STATE) console.log("🔊 [FLOW] FSM back to LOCKED, restart jari_mulai loop");
      setTimeout(() => startJariMulaiLoop(), 500);
    }

    prevFsmStateRef.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsmState]);

  // ==========================================================================
  // 🖼️ PREVIEW FOTO — 3 detik, lalu tutup siklus
  // ==========================================================================
  const showPreview = (photoUrl: string, mirrored = false) => {
    if (DEBUG_STATE) console.log("🖼️ [PREVIEW] show:", photoUrl, mirrored ? "(mirror)" : "");

    setPreviewPhoto(photoUrl);
    setPreviewMirrored(mirrored);
    previewPhotoRef.current = photoUrl;
    goPhase("preview");

    if (previewTimerRef.current) clearInterval(previewTimerRef.current);

    let remaining = PREVIEW_DURATION_SEC;
    previewTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) endShotCycle();
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
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        const track = stream.getVideoTracks()[0];
        if (track) {
          const s = track.getSettings();
          console.log(`🎥 [WEBCAM] resolusi didapat: ${s.width}x${s.height}`);
        }
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.warn("Webcam gagal dibuka (sim):", e);
      }
    })();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [simMode]);

  // ⏸️ Timer PAUSE selama siklus jepret
  useEffect(() => {
    if (timeLeft <= 0) return;
    if (shotPhase !== "idle") return;

    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, shotPhase]);

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
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
      clearReconnectTimers();
      stopJariMulaiLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== POLLING ROBOT STATE =====
  useEffect(() => {
    if (!isCameraActive) return;

    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/robot/state`);
        const s = await res.json();
        if (DEBUG_STATE) console.log("[STATE]", s, "| fase:", shotPhaseRef.current);

        simModeRef.current = !!s.sim_enabled;
        setSimMode(!!s.sim_enabled);

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

        // ✅ Preset terkonfirmasi → pindah ke DSLR
        if (shotPhaseRef.current === "idle" && !endingCycleRef.current && s.preset_seq > prev.preset) {
          playSound("4");
          goPhase("framing");
          const picked = s.current_preset;
          if (typeof picked === 'number') {
            setActivePreset(picked);
            activePresetRef.current = picked;
          }
        }

        // ✅ Robot selesai posisi → hitungan + jepret
        if (
          s.done_seq > prev.done &&
          !endingCycleRef.current &&
          (shotPhaseRef.current === "idle" || shotPhaseRef.current === "framing")
        ) {
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
    if (isCountingDownRef.current || isCapturingRef.current) return;
    if (shotPhaseRef.current === "shooting" || shotPhaseRef.current === "preview") return;

    if (DEBUG_STATE) console.log("⏱️ [COUNTDOWN] mulai 3-2-1");
    goPhase("shooting");
    stopJariMulaiLoop();
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
        setIsCountingDown(false);
        isCountingDownRef.current = false;
        setIsCapturing(true);
        isCapturingRef.current = true;
        doCapture();
      }
    }, 1000);
  };

  const doCapture = async () => {
    const preset = activePresetRef.current;

    if (typeof preset === 'number') {
      setUsedPresets((list) => list.includes(preset) ? list : [...list, preset]);
      setActivePreset(null);
      activePresetRef.current = null;
      if (DEBUG_STATE) console.log("🟢 [PRESET] ditandain kepake:", preset);
    }

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
      setIsCapturing(false);
      isCapturingRef.current = false;
      endShotCycle();
      return;
    }

    let previewShown = false;

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

      // Webcam sim: preview instan, upload jalan di belakang layar.
      setIsCapturing(false);
      isCapturingRef.current = false;
      showPreview(dataUrl);
      previewShown = true;

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
      setIsCapturing(false);
      isCapturingRef.current = false;
      if (!previewShown) endShotCycle();
    }
  };

  const takePhoto = async (isDummy: boolean) => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    if (!session) {
      setIsCountingDown(false);
      isCountingDownRef.current = false;
      setIsCapturing(false);
      isCapturingRef.current = false;
      endShotCycle();
      return;
    }

    // ========================================================================
    // 🚀 DSLR ASLI — PREVIEW INSTAN, tapi capture full-res DI-SERIALIZE.
    //    Preview langsung pakai snapshot live view (pose orangnya) → user nggak
    //    nunggu. TAPI `isCapturing` SENGAJA dibiarin TRUE sampai /capture beneran
    //    kelar, biar jepretan BERIKUTNYA nggak nembak shutter sebelum file shot
    //    ini selesai ditransfer.
    //
    //    ⚠️ Kenapa wajib: capture DSLR ~6 dtk, preview cuma 3 dtk. Kalau izin
    //    jepret dilepas pas preview kelar (3 dtk), dua TriggerCapture tumpang
    //    tindih → rebutan file /lastcaptured → foto ketuker/"delay" & sebagian
    //    ilang (12 jepret → 9 masuk Drive). Serialisasi ini yang bikin gdrive
    //    bener di versi lama. Yang "nunggu" cuma izin shot berikutnya, BUKAN preview.
    // ========================================================================
    if (!isDummy) {
      // Preview instan = frame TERAKHIR yang tampil di layar pas cekrek
      // (backend nge-cache frame stream, bukan fetch baru ke digiCamControl —
      // jadi pose preview pasti sama kayak yang barusan keliatan).
      // mirrored=true biar orientasinya sama kayak live view yang di-mirror CSS.
      setIsCountingDown(false);
      isCountingDownRef.current = false;
      showPreview(`${BACKEND_URL}/api/camera/snapshot?t=${Date.now()}`, true);

      // 🔒 isCapturing TETAP true di sini (di-set di startSession) → startSession
      //    blokir jepretan berikutnya sampai capture ini kelar (lihat finally).
      const t0 = performance.now();
      const ctrl = new AbortController();
      const safety = setTimeout(() => ctrl.abort(), 25000); // pengaman kalau backend nyangkut
      try {
        const res = await fetch(`${BACKEND_URL}/api/photo-session/${session.id}/capture`, {
          method: "POST",
          signal: ctrl.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (DEBUG_STATE) console.log(`⏱️ [CAPTURE] full-res kelar ${Math.round(performance.now() - t0)} ms`);
        if (!res.ok) {
          console.error("Capture DSLR gagal:", data.error);
        } else {
          console.log("📸 DSLR Jepret!", data);
          if (data.total_photos !== undefined) setFotoDiambil(data.total_photos);
        }
      } catch (err) {
        console.error("Capture DSLR error:", err);
      } finally {
        clearTimeout(safety);
        // Capture kelar → lepas izin buat jepretan berikutnya.
        setIsCapturing(false);
        isCapturingRef.current = false;
      }
      return;
    }

    // ========================================================================
    // 🧪 DUMMY — backend balik instan (picsum), jadi tetap ditunggu seperti biasa.
    // ========================================================================
    let previewShown = false;

    try {
      const url = `${BACKEND_URL}/api/photo-session/${session.id}/capture?dummy=true`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        console.error("Capture gagal:", data.error);
      } else {
        console.log("🧪 DUMMY Jepret!", data);
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
          previewShown = true;
        } else {
          if (DEBUG_STATE) console.warn("🖼️ [PREVIEW] photo path gak ketemu di response:", data);
        }
      }
    } catch (err) {
      console.error("Capture error:", err);
    }

    setIsCountingDown(false);
    isCountingDownRef.current = false;
    setIsCapturing(false);
    isCapturingRef.current = false;

    if (!previewShown) endShotCycle();
  };

  const handleDummyCapture = async () => {
    if (isDummyCapturing) return;
    if (shotPhaseRef.current !== "idle") return;
    setIsDummyCapturing(true);
    goPhase("shooting");
    setIsCapturing(true);
    isCapturingRef.current = true;
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

        {/* KAMERA UTAMA — kiri */}
        <div className="flex-1 pl-5 pt-5 pb-5 flex overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>
          <div
            className="w-full h-full relative overflow-hidden rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.25)] border-[3px] border-[#54868A]"
            style={{ background: 'linear-gradient(180deg, #232323 0%, #344A41 100%)' }}
          >

            {/* LAPISAN 1 (z-0) — GESTURE / Flask MJPEG */}
            <div className="absolute inset-0 z-0">
              {gestureAlive && !flaskVideoError ? (
                <img
                  key={`gesture-${gestureKey}`}
                  src={isCameraActive ? `${FLASK_VIDEO_FEED}?r=${gestureKey}` : undefined}
                  alt="Gesture detection feed"
                  className="w-full h-full object-cover"
                  onError={() => setFlaskVideoError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#232323] to-[#344A41]">
                  <div className="w-[100px] h-[100px] rounded-full bg-white/10 border-[2px] border-white/20 flex items-center justify-center animate-pulse">
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </div>
                  <p className="font-inter font-semibold text-[20px] text-white/70 text-center px-4">
                    Menyambungkan kamera...
                  </p>
                </div>
              )}

              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
                <div className="w-[9px] h-[9px] rounded-full bg-[#3A9F86] animate-pulse"></div>
                <span className="font-hind font-bold text-[12px] text-white tracking-widest">DETEKSI GESTURE</span>
              </div>
            </div>

            {/* LAPISAN 2 (z-20) — DSLR / webcam sim. Selalu ter-mount. */}
            <div
              className="absolute inset-0 z-20 transition-opacity duration-200"
              style={{
                opacity: feedMode === "photo" ? 1 : 0,
                pointerEvents: feedMode === "photo" ? "auto" : "none",
              }}
            >
              {simMode ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img
                  ref={imgRef}
                  src={isCameraActive ? `${BACKEND_URL}/api/camera/stream` : undefined}
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                  alt="Live View DSLR"
                />
              )}

              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
                <div className="w-[9px] h-[9px] rounded-full bg-[#FF3838] animate-pulse"></div>
                <span className="font-hind font-bold text-[12px] text-white tracking-widest">
                  {simMode ? "SIAP FOTO (SIMULASI WEBCAM)" : "SIAP FOTO"}
                </span>
              </div>
            </div>

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse z-10">
                <span className="text-[80px] mb-3">📸</span>
                <span className="font-inter text-white/70 text-[22px] font-medium">Menyalakan kamera...</span>
              </div>
            )}

            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
                <span key={countdownNumber} className="text-[280px] font-black text-white drop-shadow-2xl animate-count-pop">{countdownNumber}</span>
              </div>
            )}

            {/* ⚡ Preview foto — muncul INSTAN dari snapshot live view (pose orangnya).
                Overlay "Menyimpan foto... / Tahan pose dulu ya" sudah dibuang: file
                full-res disimpan di background, jadi nggak ada lagi jeda nunggu. */}
            {previewPhoto && (
              <div className="absolute inset-0 z-[95] animate-fade-in" style={{ background: 'linear-gradient(180deg, #232323 0%, #344A41 100%)' }}>
                <img
                  src={previewPhoto}
                  alt="Hasil foto"
                  className="w-full h-full object-cover"
                  style={previewMirrored ? { transform: "scaleX(-1)" } : undefined}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                />
              </div>
            )}
          </div>
        </div>

        {/* SIDE PANEL — kanan */}
        <div className="w-[360px] shrink-0 bg-[#E3D5D5] p-4 overflow-y-auto">
          <SidePanel
            fsmState={fsmState}
            unlockProgress={unlockProgress}
            activePreset={activePreset}
            usedPresets={usedPresets}
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
        @keyframes count-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          30%  { transform: scale(1.15); opacity: 1; }
          60%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.85; }
        }
        .animate-count-pop { animation: count-pop 0.9s ease-out 1 both; }
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