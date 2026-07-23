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
const JARI_MULAI_GAP_MS = 5000; // Jeda antar loop jari_mulai (ms)

// 🛟 Batas aman satu siklus jepret. Kalau lewat ini, tampilan dipaksa balik
//    ke kamera gesture — jaga-jaga kalau DSLR gagal merespons.
const SHOT_TIMEOUT_MS = 30000;

// 🔒 FSM state type dari backend
type FsmStateType = "LOCKED" | "UNLOCKING" | "UNLOCKED" | "CONFIRMING" | "MOVING" | "COOLDOWN" | "";

// 🎯 Camera feed mode
type FeedMode = "gesture" | "photo"; // gesture=Flask, photo=DSLR

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
// 🎯 SIDE PANEL — Detection info tanpa kamera preview
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
            ① Mulai (Gesture Angka 5)
          </span>
          <div className="w-[90px] h-[90px]">
            <MiniGestureCard n={5} isStart startTriggered={startTriggered} />
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
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewPhotoRef = useRef<string | null>(null);

  // ==========================================================================
  // 🎥 TAHAP JEPRET — SATU-SATUNYA penentu kamera mana yang tampil.
  //    "idle"     -> kamera GESTURE
  //    selain itu -> kamera DSLR
  //
  //    Sebelumnya ini dihitung dari enam kondisi bertumpuk (isCapturing,
  //    previewPhoto, fsmState, activePreset, dst). Kalau satu saja tidak
  //    sempat kembali ke nilai semula, tampilan nyangkut di DSLR. Sekarang
  //    hanya satu variabel, jadi tidak mungkin nyangkut.
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

  const feedMode: FeedMode = simMode || shotPhase !== "idle" ? "photo" : "gesture";

  // 🛟 Pengaman: kalau satu siklus jepret kelamaan (DSLR ngadat, dsb),
  //    paksa balik ke kamera gesture supaya layar tidak beku di DSLR.
  //    Overlay preview ikut dibersihkan — kalau tidak, gambar hasil foto
  //    bisa nyangkut menutupi layar walaupun fase sudah kembali idle.
  useEffect(() => {
    if (shotPhase === "idle") return;
    const t = setTimeout(() => {
      console.warn("🛟 [FASE] kelamaan, dipaksa balik ke gesture");
      if (previewTimerRef.current) {
        clearInterval(previewTimerRef.current);
        previewTimerRef.current = null;
      }
      goPhase("idle");
      setPreviewPhoto(null);
      previewPhotoRef.current = null;
    }, SHOT_TIMEOUT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shotPhase]);

  const [flaskVideoError, setFlaskVideoError] = useState(false);

  // 🔄 Nonce buat "nyegerin" koneksi stream gesture (Flask :5001).
  //    Pas robot gerak buat jepret, Flask berhenti kirim frame, jadi koneksi
  //    MJPEG-nya beku. Waktu balik dari preview, browser masih nampilin frame
  //    beku terakhir sampai stream jalan lagi — itu jeda "nyangkut di DSLR".
  //    Dengan nambah nonce ke URL tiap kali balik ke idle, browser buka koneksi
  //    baru dan langsung ambil frame live. Tampilan/posisi feed sama sekali
  //    nggak berubah — cuma stream-nya di-reconnect.
  const [gestureFeedNonce, setGestureFeedNonce] = useState(0);
  const prevShotPhaseForFeedRef = useRef<ShotPhase>("idle");
  useEffect(() => {
    if (prevShotPhaseForFeedRef.current !== "idle" && shotPhase === "idle") {
      setGestureFeedNonce((n) => n + 1);
      if (DEBUG_STATE) console.log("🔄 [GESTURE] reconnect feed biar nggak nampilin frame beku");
    }
    prevShotPhaseForFeedRef.current = shotPhase;
  }, [shotPhase]);

  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasEndedRef = useRef(false);

  // ===== AUDIO =====
  const audioRef = useRef<Record<string, HTMLAudioElement>>({});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<{ key: string; time: number }>({ key: "", time: 0 });

  const prevFsmStateRef = useRef<FsmStateType>("");
  const hasPlayedLayarRef = useRef(false);
  const jariMulaiLoopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jariMulaiLoopActiveRef = useRef(false);

  const seqRef = useRef({ palm: 0, gesture: 0, preset: 0, done: 0, init: false });
  const simModeRef = useRef(false);
  const isCountingDownRef = useRef(false);
  const isCapturingRef = useRef(false);

  useEffect(() => { isCountingDownRef.current = isCountingDown; }, [isCountingDown]);
  useEffect(() => { isCapturingRef.current = isCapturing; }, [isCapturing]);

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
    if (jariMulaiLoopActiveRef.current) return;
    jariMulaiLoopActiveRef.current = true;

    if (DEBUG_STATE) console.log("🔊 [FLOW] Start jari_mulai loop (with 5s gap)");

    const playLoop = () => {
      if (!jariMulaiLoopActiveRef.current) return;
      playSound("jari_mulai", () => {
        if (!jariMulaiLoopActiveRef.current) return;
        if (DEBUG_STATE) console.log("🔊 [FLOW] jari_mulai ended, wait 5s...");

        jariMulaiLoopTimerRef.current = setTimeout(() => {
          jariMulaiLoopTimerRef.current = null;
          if (jariMulaiLoopActiveRef.current) {
            playLoop();
          }
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
      setTimeout(() => {
        playSound("unlocked");
      }, 100);
    }

    if (prev !== "" && prev !== "LOCKED" && curr === "LOCKED") {
      if (DEBUG_STATE) console.log("🔊 [FLOW] FSM back to LOCKED, restart jari_mulai loop");
      setTimeout(() => {
        startJariMulaiLoop();
      }, 500);
    }

    prevFsmStateRef.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsmState]);

  // ==========================================================================
  // 🖼️ PREVIEW FOTO
  //
  //    Urutan setState di sini sengaja dibalik dari versi sebelumnya:
  //    - Saat MULAI  : overlay dipasang DULU, baru fase diganti. Jadi tidak
  //                    pernah ada frame di mana DSLR sudah dilepas tapi
  //                    overlay belum naik.
  //    - Saat SELESAI: fase dikembalikan ke idle DULU, baru overlay dibuka.
  //                    Jadi tidak pernah ada frame di mana overlay sudah
  //                    hilang tapi DSLR masih ter-mount — ini yang bikin
  //                    layar sempat "balik ke DSLR" sebelum pindah gesture.
  // ==========================================================================
  const showPreview = (photoUrl: string) => {
    if (DEBUG_STATE) console.log("🖼️ [PREVIEW] show:", photoUrl);

    setPreviewPhoto(photoUrl);        // ⬅️ overlay naik duluan
    previewPhotoRef.current = photoUrl;
    goPhase("preview");               // ⬅️ baru ganti fase, sudah ketutup overlay

    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
    }

    let remaining = PREVIEW_DURATION_SEC;
    previewTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(previewTimerRef.current!);
        previewTimerRef.current = null;

        goPhase("idle");              // ⬅️ DSLR di-unmount duluan
        setPreviewPhoto(null);        // ⬅️ baru overlay dibuka
        previewPhotoRef.current = null;

        if (DEBUG_STATE) console.log("🖼️ [PREVIEW] selesai → kamera gesture");
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
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
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

  // ⏸️ Timer PAUSE selama satu siklus jepret berlangsung
  useEffect(() => {
    if (timeLeft <= 0) return;
    if (shotPhase === "shooting" || shotPhase === "preview") return;

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
        if (DEBUG_STATE) console.log("[STATE]", s);

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

        if (!isCountingDownRef.current && !isCapturingRef.current && !previewPhotoRef.current && s.preset_seq > prev.preset) {
          playSound("4");
          // Preset dipilih → robot mulai nge-frame, tampilkan DSLR
          goPhase("framing");
          const picked = s.current_preset;
          if (typeof picked === 'number') {
            setActivePreset(picked);
            activePresetRef.current = picked;
          }
        }

        if (s.done_seq > prev.done && !isCountingDownRef.current && !isCapturingRef.current && !previewPhotoRef.current) {
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
    if (DEBUG_STATE) console.log("⏱️ [COUNTDOWN] mulai 3-2-1");
    goPhase("shooting");
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
        // Tutup overlay hitungan SEKARANG supaya angka "1" tidak nyangkut
        // selama DSLR memotret dan mengunduh.
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

    // Tandai preset kepake SEKARANG, sebelum menunggu kamera selesai.
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
      goPhase("idle");
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
      setIsCapturing(false);
      isCapturingRef.current = false;
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
      goPhase("idle");
      return;
    }

    let previewShown = false;

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

    // Kalau preview gagal tampil (jepret error / path kosong), jangan biarkan
    // layar tertinggal di DSLR — langsung balik ke kamera gesture.
    if (!previewShown) goPhase("idle");
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

        {/* KAMERA UTAMA — kiri */}
        <div className="flex-1 pl-5 pt-5 pb-5 flex overflow-hidden" style={{ backgroundColor: '#E3D5D5' }}>
          <div
            className="w-full h-full relative overflow-hidden rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.25)] border-[3px] border-[#54868A]"
            style={{ background: 'linear-gradient(180deg, #232323 0%, #344A41 100%)' }}
          >

            {/* GESTURE MODE — Flask MJPEG.
                Selalu terpasang DAN selalu terlihat, di lapisan paling bawah.
                DSLR dan preview cuma menumpuk di atasnya.

                Sebelumnya lapisan ini disembunyikan pakai visibility:hidden
                selama jepret. Akibatnya browser menghentikan paint MJPEG-nya,
                dan saat preview selesai butuh waktu untuk menampilkan frame
                baru — itulah jeda "diem sebentar di DSLR" yang terlihat.
                Dengan dibiarkan selalu terlihat, feed-nya tidak pernah dingin. */}
            <div className="absolute inset-0 z-0">
              {!flaskVideoError ? (
                <img
                  src={isCameraActive ? `${FLASK_VIDEO_FEED}?g=${gestureFeedNonce}` : undefined}
                  alt="Gesture detection feed"
                  className="w-full h-full object-cover"
                  onError={() => setFlaskVideoError(true)}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#232323] to-[#344A41]">
                  <div className="w-[100px] h-[100px] rounded-full bg-white/10 border-[2px] border-white/20 flex items-center justify-center animate-pulse">
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </div>
                  <p className="font-inter font-semibold text-[20px] text-white/70 text-center px-4">
                    Menunggu koneksi kamera...
                  </p>
                  <p className="font-hind font-medium text-[14px] text-white/45 tracking-widest uppercase">
                    Feed Not Available
                  </p>
                </div>
              )}

              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
                <div className="w-[9px] h-[9px] rounded-full bg-[#3A9F86] animate-pulse"></div>
                <span className="font-hind font-bold text-[12px] text-white tracking-widest">DETEKSI GESTURE</span>
              </div>
            </div>

            {/* PHOTO MODE — hanya dirender saat fase jepret berlangsung.
                Karena benar-benar dilepas dari DOM, mustahil tersisa di layar. */}
            {feedMode === "photo" && (
              <div className="absolute inset-0 z-20">
                {simMode ? (
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img
                    ref={imgRef}
                    src={isCameraActive ? `${BACKEND_URL}/api/camera/stream` : undefined}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
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
            )}

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