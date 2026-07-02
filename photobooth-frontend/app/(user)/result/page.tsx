"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { QRCodeSVG } from "qrcode.react";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";
const LIVE_PREVIEW_MAX = 10;
const TIMER_SECONDS = 180; // 3 menit

// 🎯 NEW transform: zoom + fx/fy fractions (-1..1). Image always covers slot.
interface PhotoTransform {
  zoom: number;
  fx: number;
  fy: number;
}

interface SlotState {
  id: number;
  photo: string | null;
  transform: PhotoTransform;
  imgW?: number;
  imgH?: number;
}

const DEFAULT_TRANSFORM: PhotoTransform = { zoom: 1, fx: 0, fy: 0 };
const PAN_HEADROOM = 1.15;

// 🎯 Migrate old transform ({scale, x, y}) → new ({zoom, fx, fy})
function migrateTransform(t: any): PhotoTransform {
  if (!t) return { ...DEFAULT_TRANSFORM };
  if (typeof t.zoom === 'number') return { zoom: t.zoom, fx: t.fx ?? 0, fy: t.fy ?? 0 };
  if (typeof t.scale === 'number') return { zoom: t.scale, fx: 0, fy: 0 };
  return { ...DEFAULT_TRANSFORM };
}

// 🎯 Cover-based image layout: foto SELALU fill slot, no gray area
function computeImageLayout(cw: number, ch: number, imgW: number, imgH: number, transform: PhotoTransform) {
  const cover = Math.max(cw / imgW, ch / imgH) * PAN_HEADROOM;  // 🎯 pan headroom biar posisi foto konsisten sama print-preview & filter
  const z = cover * transform.zoom;
  const renderedW = imgW * z;
  const renderedH = imgH * z;
  const halfX = Math.max(1, (renderedW - cw) / 2);
  const halfY = Math.max(1, (renderedH - ch) / 2);
  const offsetX = (cw - renderedW) / 2 + transform.fx * halfX;
  const offsetY = (ch - renderedH) / 2 + transform.fy * halfY;
  return { renderedW, renderedH, halfX, halfY, offsetX, offsetY };
}

function seededShuffle<T>(array: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get('txn') || "";

  const [framePath, setFramePath] = useState<string>("");
  const [overlayStyle, setOverlayStyle] = useState<any>({});
  const [photoSlots, setPhotoSlots] = useState<SlotState[]>([]);
  const [allCaptured, setAllCaptured] = useState<string[]>([]);
  const [livePreviewPhotos, setLivePreviewPhotos] = useState<string[]>([]);

  const [filterCSS, setFilterCSS] = useState("none");
  const [intensity, setIntensity] = useState(100);
  const [stickers, setStickers] = useState<any[]>([]);

  const [frameAspect, setFrameAspect] = useState<number>(0.667);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(500);

  const [activeModal, setActiveModal] = useState<'cetak' | 'digital' | null>(null);
  const [cetakStep, setCetakStep] = useState<'options' | 'printing'>('options');
  const [printStatus, setPrintStatus] = useState<'idle' | 'rendering' | 'printing' | 'done' | 'error'>('idle');
  const [printErrorMsg, setPrintErrorMsg] = useState<string>("");
  const [extraCetak, setExtraCetak] = useState(0);
  const hargaPerTambahan = 10000;

  const [isSnapLoaded, setIsSnapLoaded] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  usePageSound("/fase/result.mpeg");

  // 🎯 Galeri QR + frame upload
  const [galleryURL, setGalleryURL] = useState<string>("");
  const [isUploadingFrame, setIsUploadingFrame] = useState(false);
  const [frameUploaded, setFrameUploaded] = useState(false);
  const [frameUploadError, setFrameUploadError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // 🎯 Slot dimensions for cover-based rendering
  const [slotDims, setSlotDims] = useState<Record<number, { w: number; h: number }>>({});
  const slotElsRef = useRef<Record<number, HTMLDivElement>>({});

  const printRef = useRef<HTMLDivElement>(null);

   const playEventSound = (path: string) => {
    try {
      const audio = new Audio(path);
      audio.play().catch((err) => {
        console.warn(`🔇 [SOUND] ${path} gagal play:`, err?.message);
      });
    } catch (e) {
      console.warn(`🔇 [SOUND] error:`, e);
    }
  };

  // 🎯 TIMER COUNTDOWN
  useEffect(() => {
    if (timeLeft <= 0) {
      if (printStatus === 'rendering' || printStatus === 'printing' || isPaying || isZipping) {
        return;
      }
      sessionStorage.clear();
      router.push("/");
      return;
    }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, router, printStatus, isPaying, isZipping]);

  // 🔊 Play sound sesuai status print
  useEffect(() => {
    if (printStatus === 'printing') {
      playEventSound("/fase/print d.mp3");
    } else if (printStatus === 'done') {
      playEventSound("/fase/berhasil.mp3");
    }
  }, [printStatus]);

  // 🎯 ResizeObserver — track slot dimensions
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      setSlotDims(prev => {
        const next = { ...prev };
        for (const entry of entries) {
          const id = Number((entry.target as HTMLElement).dataset.slotId);
          if (id) next[id] = { w: entry.contentRect.width, h: entry.contentRect.height };
        }
        return next;
      });
    });
    Object.values(slotElsRef.current).forEach(el => observer.observe(el));
    // initial measure
    setTimeout(() => {
      setSlotDims(prev => {
        const next = { ...prev };
        for (const [idStr, el] of Object.entries(slotElsRef.current)) {
          const rect = el.getBoundingClientRect();
          if (rect.width && rect.height) next[Number(idStr)] = { w: rect.width, h: rect.height };
        }
        return next;
      });
    }, 50);
    return () => observer.disconnect();
  }, [photoSlots.length, frameAspect]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).snap?.pay) {
      setIsSnapLoaded(true);
      return;
    }
    const interval = setInterval(() => {
      if ((window as any).snap?.pay) {
        setIsSnapLoaded(true);
        clearInterval(interval);
      }
    }, 300);
    const stopAfter = setTimeout(() => clearInterval(interval), 15000);
    return () => { clearInterval(interval); clearTimeout(stopAfter); };
  }, []);

  const waitForSnap = async (timeoutMs = 5000): Promise<boolean> => {
    if ((window as any).snap?.pay) return true;
    return new Promise((resolve) => {
      const start = Date.now();
      const id = setInterval(() => {
        if ((window as any).snap?.pay) {
          clearInterval(id);
          resolve(true);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(id);
          resolve(false);
        }
      }, 200);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!txn) {
        setErrorMsg("Transaksi tidak valid. Mulai dari awal lagi.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/photo-session/by-transaction/${txn}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Sesi tidak ditemukan");
          setLoading(false);
          return;
        }
        const template = data.template;
        const slotCount = template?.slot_count || 4;
        if (template?.frame_path) setFramePath(template.frame_path);

        const top = template?.overlay_top || 10;
        const left = template?.overlay_left || 10;
        const right = template?.overlay_right || 10;
        const bottom = template?.overlay_bottom || 10;
        const gap = template?.overlay_gap ?? 4;
        const cols = Math.max(1, Math.min(template?.overlay_cols || 1, 4));
        const rows = Math.ceil(slotCount / cols);

        setOverlayStyle({
          position: 'absolute',
          top: `${top}%`,
          left: `${left}%`,
          right: `${right}%`,
          bottom: `${bottom}%`,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: `${gap}%`,
        });

        const capturedUrls: string[] = (data.session?.photos || []).map((p: any) => p.photo_path);
        setAllCaptured(capturedUrls);

        let slots: SlotState[] = [];
        try {
          const saved = sessionStorage.getItem("arranged_slots");
          if (saved) {
            const parsed = JSON.parse(saved);
            slots = parsed.map((s: any) => ({
              id: s.id,
              photo: s.photo,
              transform: migrateTransform(s.transform),
              imgW: s.imgW,
              imgH: s.imgH,
            }));
          }
        } catch (e) { }
        if (!slots || slots.length === 0) {
          slots = Array.from({ length: slotCount }).map((_, i) => ({
            id: i + 1,
            photo: capturedUrls[i] || null,
            transform: { ...DEFAULT_TRANSFORM },
          }));
        }
        setPhotoSlots(slots);

        const framePhotoUrls = slots.filter(s => s.photo).map(s => s.photo as string);
        const others = capturedUrls.filter(url => !framePhotoUrls.includes(url));
        const shuffledOthers = seededShuffle(others, txn);
        const fillCount = Math.max(0, LIVE_PREVIEW_MAX - framePhotoUrls.length);
        const fill = shuffledOthers.slice(0, fillCount);
        const combined = seededShuffle([...framePhotoUrls, ...fill], txn + "_display");
        setLivePreviewPhotos(combined);

        const savedCSS = sessionStorage.getItem("applied_filter_css");
        const savedIntensity = sessionStorage.getItem("filter_intensity");
        const savedStickers = sessionStorage.getItem("applied_stickers");
        if (savedCSS) setFilterCSS(savedCSS);
        if (savedIntensity) setIntensity(Number(savedIntensity));
        if (savedStickers) {
          try { setStickers(JSON.parse(savedStickers)); } catch (e) { }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setErrorMsg("Gagal konek ke server");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [txn]);

  useEffect(() => {
    if (!isPlaying || livePreviewPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % livePreviewPhotos.length);
    }, speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, livePreviewPhotos.length]);

  useEffect(() => { setCurrentIdx(0); }, [livePreviewPhotos.length]);

  // 🎯 Compute gallery URL (pakai NEXT_PUBLIC_GALLERY_BASE_URL kalo di-set, else window.origin)
  useEffect(() => {
    if (typeof window === "undefined" || !txn) return;
    const base = process.env.NEXT_PUBLIC_GALLERY_BASE_URL || window.location.origin;
    setGalleryURL(`${base}/galeri/${txn}`);
  }, [txn]);

  // 🎯 Image onLoad → capture naturalWidth/Height
  const handleSlotImgLoad = (slotId: number, imgEl: HTMLImageElement) => {
    if (!imgEl.naturalWidth || !imgEl.naturalHeight) return;
    setPhotoSlots(prev => prev.map(s =>
      s.id === slotId && (s.imgW !== imgEl.naturalWidth || s.imgH !== imgEl.naturalHeight)
        ? { ...s, imgW: imgEl.naturalWidth, imgH: imgEl.naturalHeight }
        : s
    ));
  };

  const getFilterCSS = () => (!filterCSS || filterCSS === "none") ? "none" : filterCSS;
  const getFilterOpacity = () => (!filterCSS || filterCSS === "none") ? 1 : intensity / 100;

  const handleNewSession = () => {
  sessionStorage.clear();
  window.location.href = "/";  // 🎯 Force full reload — bypass Turbopack routing bug
};

  const framePhotoSet = new Set(photoSlots.filter(s => s.photo).map(s => s.photo));

  const renderFrameImage = async (): Promise<string | null> => {
    if (!printRef.current) return null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(printRef.current, {
        scale: 5,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      return canvas.toDataURL("image/jpeg", 0.95);
    } catch (err) {
      console.error("Render frame error:", err);
      return null;
    }
  };

  const executePrint = async (qty: number): Promise<boolean> => {
    setPrintStatus('rendering');
    const imageBase64 = await renderFrameImage();
    if (!imageBase64) {
      setPrintStatus('error');
      setPrintErrorMsg("Gagal render gambar frame");
      return false;
    }
    setPrintStatus('printing');
    try {
      const res = await fetch(`${BACKEND_URL}/api/print/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: txn, qty, image_base64: imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPrintStatus('error');
        setPrintErrorMsg(data.error || "Gagal mencetak");
        return false;
      }
      setPrintStatus('done');
      return true;
    } catch (err) {
      console.error("Print execute error:", err);
      setPrintStatus('error');
      setPrintErrorMsg("Gagal konek ke server");
      return false;
    }
  };

  const markPrintDone = async (qty: number) => {
    try {
      await fetch(`${BACKEND_URL}/api/print/done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: txn, qty }),
      });
    } catch (err) {
      console.error("Mark print done error (lanjut aja):", err);
    }
  };

  const handleCetak = async () => {
    const totalQty = 1 + extraCetak;
    if (extraCetak > 0) {
      // 🔊 Play qris sound pas user pilih bayar (sebelum popup Midtrans muncul)
      playEventSound("/fase/qris.mp3");
      
      const snapReady = await waitForSnap(5000);
      if (!snapReady) {
        alert("Pembayaran tidak bisa dimuat. Cek koneksi internet atau refresh halaman.");
        return;
      }
      setIsPaying(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/print/extra`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_id: txn, qty: extraCetak }),
        });
        const data = await res.json();
        if (!res.ok || !data.token) {
          alert(data.error || "Gagal generate pembayaran");
          setIsPaying(false);
          return;
        }
        (window as any).snap.pay(data.token, {
          onSuccess: async function () {
            setIsPaying(false);
            await markPrintDone(extraCetak);
            setCetakStep('printing');
            await executePrint(totalQty);
          },
          onPending: function () { setIsPaying(false); },
          onError: function () { alert("Pembayaran gagal!"); setIsPaying(false); },
          onClose: function () { setIsPaying(false); },
        });
      } catch (err) {
        console.error("Print payment error:", err);
        alert("Gagal konek ke server");
        setIsPaying(false);
      }
      return;
    }
    await markPrintDone(0);
    setCetakStep('printing');
    await executePrint(1);
  };

  const handleOpenDigital = async () => {
    setActiveModal('digital');
    // 🎯 Fire & forget — upload frame editan ke backend buat galeri
    uploadFrameToBackend();
    try {
      await fetch(`${BACKEND_URL}/api/digital/done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: txn, qty: 0 }),
      });
    } catch (err) { }
  };

  // 🎯 Upload frame editan (hasil html2canvas) ke backend buat galeri publik
  const uploadFrameToBackend = async () => {
    if (frameUploaded || isUploadingFrame) return;
    setIsUploadingFrame(true);
    setFrameUploadError(null);
    try {
      const imageBase64 = await renderFrameImage();
      if (!imageBase64) {
        setFrameUploadError("Gagal render frame");
        return;
      }
      const res = await fetch(`${BACKEND_URL}/api/gallery/save-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: txn, image_base64: imageBase64 }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFrameUploadError(err.error || "Upload gagal");
        return;
      }
      setFrameUploaded(true);
    } catch (err) {
      console.error("Upload frame error:", err);
      setFrameUploadError("Gagal konek ke server");
    } finally {
      setIsUploadingFrame(false);
    }
  };

  // 🎯 Copy galeri link ke clipboard (dengan fallback buat browser lama)
  const copyGalleryLink = async () => {
    if (!galleryURL) return;
    try {
      await navigator.clipboard.writeText(galleryURL);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback untuk browser tanpa Clipboard API
      const ta = document.createElement('textarea');
      ta.value = galleryURL;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (e) {
        alert("Gagal copy. Pilih manual lalu Ctrl+C ya bro.");
      }
      document.body.removeChild(ta);
    }
  };

  const handleDownloadZip = async () => {
    if (allCaptured.length === 0) {
      alert("Belum ada foto buat di-download");
      return;
    }
    setIsZipping(true);
    setZipProgress(0);
    try {
      const JSZip = (await import("jszip")).default;
      const { saveAs } = await import("file-saver");
      const zip = new JSZip();
      const folder = zip.folder("Glambot-Foto") || zip;
      for (let i = 0; i < allCaptured.length; i++) {
        const url = allCaptured[i];
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const ext = (url.split('.').pop() || "jpg").split('?')[0].slice(0, 4);
          folder.file(`foto_${String(i + 1).padStart(2, '0')}.${ext}`, blob);
        } catch (e) {
          console.warn("Skip foto gagal fetch:", url);
        }
        setZipProgress(Math.round(((i + 1) / allCaptured.length) * 100));
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Glambot-${txn}.zip`);
    } catch (err) {
      console.error("ZIP error:", err);
      alert("Gagal bikin ZIP. Pastiin package jszip & file-saver udah ke-install.");
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  const closeCetakModal = () => {
    if (isPaying || printStatus === 'rendering' || printStatus === 'printing') return;
    setActiveModal(null);
    setExtraCetak(0);
    setCetakStep('options');
    setPrintStatus('idle');
    setPrintErrorMsg("");
  };

  // 🎯 FRAME PREVIEW — pake computeImageLayout (cover-based, foto SELALU fill slot)
  const FramePreview = ({ className = "", innerRef }: { className?: string; innerRef?: React.Ref<HTMLDivElement> }) => {
    const MAX_W = 300;
    const MAX_H = 450;
    let dispW = MAX_W;
    let dispH = MAX_W / frameAspect;
    if (dispH > MAX_H) { dispH = MAX_H; dispW = MAX_H * frameAspect; }

    return (
      <div ref={innerRef} className={`relative overflow-hidden ${className}`} style={{ width: `${dispW}px`, height: `${dispH}px`, backgroundColor: '#545151' }}>
        <div className="absolute inset-0 z-10 transition-all duration-300" style={{ filter: getFilterCSS(), opacity: getFilterOpacity(), ...overlayStyle }}>
          {photoSlots.map((slot) => {
            const dims = slotDims[slot.id];
            const haveLayout = !!(slot.photo && slot.imgW && slot.imgH && dims);

            let imgStyle: React.CSSProperties = {};
            if (haveLayout) {
              const layout = computeImageLayout(dims!.w, dims!.h, slot.imgW!, slot.imgH!, slot.transform);
              imgStyle = {
                position: 'absolute',
                width: `${layout.renderedW}px`,
                height: `${layout.renderedH}px`,
                left: `${layout.offsetX}px`,
                top: `${layout.offsetY}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                pointerEvents: 'none',
                userSelect: 'none',
              };
            }

            return (
              <div
                key={slot.id}
                ref={(el) => { if (el) { slotElsRef.current[slot.id] = el; el.dataset.slotId = String(slot.id); } }}
                data-slot-id={slot.id}
                className="w-full h-full bg-[#979797] overflow-hidden relative"
              >
                {slot.photo ? (
                  <img
                    src={slot.photo}
                    crossOrigin="anonymous"
                    onLoad={(e) => handleSlotImgLoad(slot.id, e.currentTarget)}
                    style={haveLayout ? imgStyle : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
                    draggable={false}
                    alt={`Slot ${slot.id}`}
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[#264E45] font-hind font-bold text-[36px] opacity-30">{slot.id}</span>
                )}
              </div>
            );
          })}
        </div>
        {framePath && (
          <img
            src={framePath}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) setFrameAspect(img.naturalWidth / img.naturalHeight);
            }}
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none"
            alt="Frame"
          />
        )}
        <div className="absolute inset-0 z-30 pointer-events-none">
          {stickers.map((stk: any) => (
            <div key={stk.id} style={{ position: 'absolute', left: `${stk.x}%`, top: `${stk.y}%`, transform: `translate(-50%, -50%) rotate(${stk.rotation}deg)`, width: `${stk.size}px`, height: `${stk.size}px` }} className="flex items-center justify-center drop-shadow-md">
              {stk.emoji.length > 2 ? <span style={{ fontSize: `${stk.size * 0.4}px`, fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{stk.emoji}</span> : <span style={{ fontSize: `${stk.size * 0.8}px` }}>{stk.emoji}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: '#E3D5D5' }}>
        <p className="font-inter font-semibold text-[24px] text-[#395350]">Memuat hasil foto...</p>
      </main>
    );
  }
  if (errorMsg) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: '#E3D5D5' }}>
        <div className="bg-white rounded-[18px] shadow-lg p-10 text-center max-w-[500px]">
          <h1 className="font-inter font-bold text-[32px] text-[#332C2C] mb-3">Gagal Memuat</h1>
          <p className="font-inter text-[16px] text-[#6F6F6F] mb-6">{errorMsg}</p>
          <button onClick={() => router.push("/")} className="bg-[#38635A] text-white px-6 py-3 rounded-full font-bold text-[16px] hover:bg-[#2c4e47] transition-colors">← Ke Beranda</button>
        </div>
      </main>
    );
  }

  const currentPhoto = livePreviewPhotos[currentIdx] || "";
  const currentIsFrame = framePhotoSet.has(currentPhoto);

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="Mid-client-BD4ZMoqqW6WahlgZ"
        strategy="afterInteractive"
        onLoad={() => setIsSnapLoaded(true)}
      />

      <main className="relative flex min-h-screen flex-col items-center pt-4 pb-[115px] overflow-x-hidden select-none" style={{ backgroundColor: '#E3D5D5' }}>

        <div className="absolute top-0 left-0 w-full h-[12px] z-[100] flex">
          <div className="h-full w-full" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        </div>

        <div className="fixed top-6 right-6 z-[80] px-4 h-[52px] bg-white border-[1.5px] border-[#54868A] rounded-[28px] shadow-md flex items-center gap-3">
          <div className="w-[32px] h-[32px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center shadow-inner shrink-0">
            <img src="/icon1.png" alt="timer" className="w-[16px] h-[16px] object-contain" />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="font-hind font-semibold text-[10px] tracking-widest text-[#7A7979]">SISA WAKTU</span>
            <span className="font-inter font-bold text-[22px] text-[#FFAE00] tracking-[-0.05em] leading-none" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.2)" }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="w-full flex flex-col items-center mt-10 mb-6 z-10 px-4 text-center">
          <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">Hasil Foto</h1>
          <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mt-1">Foto Kamu Siap</p>
        </div>

        <div className="w-full max-w-[1800px] flex flex-col xl:flex-row gap-8 items-stretch justify-center px-8 z-10">

          <div className="flex-1 max-w-[790px] min-h-[740px] rounded-[23px] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden border border-[#54868A]/30"
            style={{ background: 'radial-gradient(circle at 46% -40%, #004D40 0%, #044C40 55.8%, #434343 100%)' }}>
            <div className="w-full flex items-center justify-center relative mb-8 shrink-0">
              <div className="absolute left-0 w-[50px] h-[50px] bg-[#008787] rounded-[17px] flex items-center justify-center shadow-inner">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              </div>
              <div className="flex flex-col items-center text-center">
                <h2 className="font-inter font-bold text-[36px] text-[#EAEAEA] leading-none tracking-[-0.05em] drop-shadow-sm">Hasil Frame Foto</h2>
                <p className="font-inter font-normal text-[20px] text-white leading-none mt-1 tracking-[-0.05em]">Frame akan dicetak dalam ukuran <strong className="font-bold">4R</strong></p>
              </div>
            </div>
            <div className="flex-1 w-full flex items-center justify-center relative pb-6 scale-100 xl:scale-105 origin-center">
              <FramePreview className="shadow-2xl" innerRef={printRef} />
            </div>
          </div>

          <div className="flex-1 max-w-[970px] flex flex-col gap-6">

            <div className="w-full h-[565px] rounded-[23px] p-6 flex flex-col shadow-xl relative overflow-hidden border border-[#54868A]/30"
              style={{ background: 'radial-gradient(circle at 49% 5%, #002E2E 25%, #1E2221 73%)' }}>
              <div className="w-full flex items-center justify-center relative mb-4 shrink-0">
                <div className="absolute left-0 w-[50px] h-[50px] bg-[#00876A] rounded-[17px] flex items-center justify-center shadow-inner">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                </div>
                <div className="flex flex-col items-center text-center">
                  <h2 className="font-inter font-bold text-[36px] text-[#EAEAEA] leading-none tracking-[-0.05em] drop-shadow-sm">Live Preview Photo</h2>
                  <p className="font-inter font-normal text-[20px] text-white leading-none mt-1 tracking-[-0.05em]">Foto pilihan kamu</p>
                </div>
                <div className="absolute right-0 px-4 h-[50px] bg-[#008787] rounded-[17px] flex items-center justify-center shadow-inner">
                  <span className="font-inter font-bold text-[28px] text-[#F1F1F1] tracking-[-0.05em] leading-none pt-1">
                    {livePreviewPhotos.length === 0 ? "0 / 0" : `${currentIdx + 1} / ${livePreviewPhotos.length}`}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-black/30 rounded-[16px] border border-white/10 relative overflow-hidden flex items-center justify-center">
                {livePreviewPhotos.length === 0 ? (
                  <div className="text-white/30 font-bold">Belum ada foto</div>
                ) : (
                  <>
                    <img key={currentIdx} src={currentPhoto} alt={`Foto ${currentIdx + 1}`} className="w-full h-full object-cover live-blink" />
                    {currentIsFrame && (
                      <div className="absolute top-4 right-4 bg-[#FBB400] px-3 py-1 rounded-full text-white text-[12px] font-bold shadow-md border border-white z-20">★ Frame</div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full h-[5px] bg-white/10 z-20">
                      <div className="h-full bg-[#00FFA2] transition-all duration-200" style={{ width: `${((currentIdx + 1) / livePreviewPhotos.length) * 100}%` }}></div>
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/55 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 z-20 shadow-lg">
                      <button onClick={() => setIsPlaying(p => !p)} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors text-[16px]" title="Play/Pause">
                        {isPlaying ? "⏸" : "▶"}
                      </button>
                      <div className="flex gap-1">
                        {[{ label: "Slow", val: 1000 }, { label: "Normal", val: 500 }, { label: "Fast", val: 250 }].map((s) => (
                          <button key={s.val} onClick={() => setSpeed(s.val)} className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${speed === s.val ? "bg-[#00FFA2] text-[#002E2E]" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full shrink-0">
              <button
                onClick={() => {
                  playEventSound("/fase/cetak.mp3");
                  setActiveModal('cetak');
                  setCetakStep('options');
                  setExtraCetak(0);
                  setPrintStatus('idle');
                  setPrintErrorMsg("");
                }}
                className="relative h-[95px] w-full bg-white border-[1.5px] border-[#54868A] rounded-[23px] flex items-center p-3 gap-4 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left group"
              >
                <div className="w-[70px] h-[70px] bg-[#2E706D] border-[1.5px] border-[#54868A] rounded-[17px] flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:bg-[#3E8C7B] transition-colors p-3">
                  <img src="/print.png" className="w-full h-full object-contain" alt="print" />
                </div>
                <div className="flex-1 flex flex-col justify-center pr-8 pt-1">
                  <h3 className="font-inter font-bold text-[26px] text-[#545454] tracking-[-0.05em] leading-tight mb-0.5">Cetak Photo</h3>
                  <p className="font-hind font-semibold text-[17px] text-[#3E8C7B] tracking-[-0.05em] leading-tight">Print di mesin studio.</p>
                </div>
                <span className="absolute right-6 text-[#54868A] opacity-50 text-3xl group-hover:translate-x-2 transition-transform">→</span>
              </button>

              <button onClick={handleOpenDigital} className="relative h-[95px] w-full bg-white border-[1.5px] border-[#54868A] rounded-[23px] flex items-center p-3 gap-4 shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left group">
                <div className="w-[70px] h-[70px] bg-[#2E706D] border-[1.5px] border-[#54868A] rounded-[17px] flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:bg-[#3E8C7B] transition-colors p-3">
                  <img src="/expor.png" className="w-full h-full object-contain" alt="export" />
                </div>
                <div className="flex-1 flex flex-col justify-center pr-8 pt-1">
                  <h3 className="font-inter font-bold text-[26px] text-[#545454] tracking-[-0.05em] leading-tight mb-0.5">Kirim Digital</h3>
                  <p className="font-hind font-semibold text-[17px] text-[#3E8C7B] tracking-[-0.05em] leading-tight">QR ke Drive</p>
                </div>
                <span className="absolute right-6 text-[#54868A] opacity-50 text-3xl group-hover:translate-x-2 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full h-[115px] bg-white z-[60] flex items-center justify-center shadow-[0_-5px_15px_rgba(0,0,0,0.05)] border-t border-gray-200">
          <div className="w-full max-w-[1800px] flex items-center justify-center px-8">
            <button onClick={handleNewSession} className="w-[240px] h-[60px] bg-[#3A9F86] rounded-[13px] flex items-center justify-center gap-3 hover:bg-[#2E706D] shadow-md transition-all active:scale-95 group">
              <div className="w-6 h-6 flex items-center justify-center text-white opacity-90 group-hover:-rotate-180 transition-transform duration-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
              </div>
              <span className="font-inter font-bold text-[22px] text-white tracking-[-0.05em] leading-none">Sesi Baru</span>
            </button>
          </div>
        </div>

        {/* ===== MODAL SYSTEM ===== */}
        {activeModal && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={closeCetakModal}></div>

            {activeModal === 'cetak' && (
              <div className="bg-white w-full max-w-[420px] rounded-[28px] shadow-2xl relative z-10 overflow-hidden border border-[#54868A]">

                {cetakStep === 'options' && (
                  <div className="flex flex-col items-center w-full p-6">
                    <div className="w-[64px] h-[64px] bg-[#E3D5D5] border border-[#54868A] rounded-[20px] flex items-center justify-center mb-4 shadow-sm">
                      <img src="/print.png" className="w-[30px] h-[30px]" alt="print" />
                    </div>
                    <h2 className="font-inter font-extrabold text-[24px] text-[#332C2C] mb-1.5 tracking-[-0.03em] leading-none text-center">Tambah cetakan personal?</h2>
                    <p className="font-hind text-[15px] text-[#545454] text-center px-2 mb-6 leading-tight">Setiap anggota grup bisa pulang dengan cetakan sendiri. Paket utama sudah termasuk 1 cetakan.</p>

                    <div className="w-full bg-[#F4F9F8] rounded-[16px] p-3 flex items-center justify-between mb-4 border border-[#54868A]/30 shadow-sm">
                      <div className="bg-[#3A9F86] text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm">Termasuk paket</div>
                      <span className="font-inter font-bold text-[14px] text-[#332C2C]">Paket Foto · 1 cetakan</span>
                    </div>

                    <div className="w-full bg-white border-[1.5px] border-[#54868A] rounded-[20px] p-5 flex flex-col items-center mb-4 shadow-sm relative">
                      <div className="flex items-center justify-between w-full mb-1 px-2">
                        <button onClick={() => setExtraCetak(Math.max(0, extraCetak - 1))} className="w-[45px] h-[45px] bg-[#E3D5D5] hover:bg-[#d8c7c7] border border-[#54868A] text-[#2E706D] rounded-xl font-bold text-3xl flex items-center justify-center active:scale-95 pb-1 transition-colors">-</button>
                        <div className="flex flex-col items-center">
                          <span className="font-inter font-black text-[64px] leading-none text-[#332C2C] mb-1">{extraCetak}</span>
                          <span className="font-inter font-bold text-[10px] text-[#3A9F86] tracking-widest leading-none">CETAKAN TAMBAHAN</span>
                        </div>
                        <button onClick={() => setExtraCetak(Math.min(5, extraCetak + 1))} className="w-[45px] h-[45px] bg-[#3A9F86] hover:bg-[#2E706D] text-white border border-[#54868A] rounded-xl font-bold text-3xl flex items-center justify-center active:scale-95 pb-1 transition-colors">+</button>
                      </div>
                      <span className="font-hind text-[13px] text-[#545454] mt-2">x <strong className="text-[#3A9F86]">Rp {(hargaPerTambahan).toLocaleString('id-ID')}</strong> per cetakan · maksimal 5</span>
                    </div>

                    <div className="w-full bg-[#2E706D] rounded-[16px] p-5 flex items-center justify-between mb-4 shadow-md border border-[#54868A]">
                      <div className="flex flex-col">
                        <span className="font-inter font-bold text-[13px] text-white/70 tracking-widest">TOTAL CETAK</span>
                        <span className="font-inter font-bold text-[20px] text-white">{1 + extraCetak} lembar</span>
                      </div>
                      <span className="font-inter font-bold text-[24px] text-[#F6AA06]">Rp {(extraCetak * hargaPerTambahan).toLocaleString('id-ID')}</span>
                    </div>

                    <div className="w-full bg-[#FFF6E5] rounded-[14px] p-3 flex gap-3 items-start border-l-[4px] border-[#D29E38] mb-6 shadow-sm">
                      <span className="text-lg leading-none pt-0.5">💡</span>
                      <p className="font-hind font-medium text-[13px] text-[#BF7D32] leading-tight">Cetakan tambahan dibayar via QRIS. Bisa dilewati bila tidak perlu.</p>
                    </div>

                    <div className="w-full flex gap-3">
                      <button disabled={isPaying} onClick={closeCetakModal} className="flex-1 h-[53px] bg-white border border-[#54868A] rounded-[16px] font-inter font-bold italic text-[18px] text-[#545454] active:scale-95 hover:bg-[#F9F9F9] transition-colors shadow-sm pt-0.5 disabled:opacity-50">Batal</button>
                      <button disabled={isPaying} onClick={handleCetak} className="flex-[1.5] h-[53px] bg-[#3A9F86] rounded-[16px] font-inter font-bold italic text-[18px] text-white active:scale-95 hover:bg-[#2E706D] border border-[#54868A] transition-colors shadow-sm pt-0.5 disabled:opacity-50">
                        {isPaying ? "Memproses..." : extraCetak > 0 ? "Bayar & Cetak" : "Cetak Sekarang"}
                      </button>
                    </div>
                  </div>
                )}

                {cetakStep === 'printing' && (
                  <div className="flex flex-col items-center w-full p-8">
                    <div className="w-[80px] h-[80px] bg-[#E3D5D5] border border-[#54868A] rounded-[24px] flex items-center justify-center mb-5 shadow-sm relative">
                      <img src="/print.png" className="w-[36px] h-[36px]" alt="print" />
                      {(printStatus === 'rendering' || printStatus === 'printing') && (
                        <div className="absolute -bottom-1 -right-1 w-[28px] h-[28px] bg-white rounded-full border border-[#54868A] flex items-center justify-center shadow-md">
                          <div className="w-[14px] h-[14px] border-[2.5px] border-[#3A9F86] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {printStatus === 'done' && (
                        <div className="absolute -bottom-1 -right-1 w-[28px] h-[28px] bg-[#3A9F86] rounded-full flex items-center justify-center shadow-md text-white font-bold">✓</div>
                      )}
                      {printStatus === 'error' && (
                        <div className="absolute -bottom-1 -right-1 w-[28px] h-[28px] bg-[#D85A5A] rounded-full flex items-center justify-center shadow-md text-white font-bold">!</div>
                      )}
                    </div>

                    <h2 className="font-inter font-extrabold text-[24px] text-[#332C2C] mb-1.5 tracking-[-0.03em] leading-none text-center">
                      {printStatus === 'rendering' && "Menyiapkan gambar..."}
                      {printStatus === 'printing' && "Mengirim ke printer..."}
                      {printStatus === 'done' && "Berhasil dicetak!"}
                      {printStatus === 'error' && "Gagal mencetak"}
                    </h2>

                    <p className="font-hind text-[15px] text-[#545454] text-center px-2 mb-5 leading-tight">
                      {printStatus === 'rendering' && "Render frame foto resolusi tinggi"}
                      {printStatus === 'printing' && `${1 + extraCetak} lembar lagi diproses oleh printer`}
                      {printStatus === 'done' && `Cetak ${1 + extraCetak} lembar selesai · ambil foto di printer`}
                      {printStatus === 'error' && printErrorMsg}
                    </p>

                    {printStatus === 'done' && (
                      <div className="bg-[#E6F5EE] border border-[#3A9F86] px-5 py-2 rounded-full mb-6 shadow-sm">
                        <span className="font-inter font-bold text-[13px] text-[#2E706D]">✓ {1 + extraCetak} lembar selesai dicetak</span>
                      </div>
                    )}

                    {printStatus === 'error' && (
                      <div className="w-full bg-[#FFF1F1] border border-[#D85A5A] rounded-[12px] p-3 mb-5 text-left">
                        <p className="font-hind font-semibold text-[12px] text-[#A93030] mb-1">💡 Coba:</p>
                        <ul className="font-hind text-[12px] text-[#A93030] list-disc pl-4 leading-tight">
                          <li>Pastiin printer nyala & terhubung</li>
                          <li>Cek nama printer di backend (services/printer.go)</li>
                          <li>Lihat detail error di terminal backend</li>
                        </ul>
                      </div>
                    )}

                    <div className="w-full flex gap-3">
                      {printStatus === 'error' && (
                        <button onClick={() => { setCetakStep('options'); setPrintStatus('idle'); }} className="flex-1 h-[53px] bg-white border border-[#54868A] rounded-[16px] font-inter font-bold italic text-[16px] text-[#545454] active:scale-95 hover:bg-[#F9F9F9] transition-colors shadow-sm pt-0.5">← Kembali</button>
                      )}
                      <button
                        onClick={closeCetakModal}
                        disabled={printStatus === 'rendering' || printStatus === 'printing'}
                        className="flex-1 h-[53px] bg-[#3A9F86] rounded-[16px] border border-[#54868A] font-inter font-bold italic text-[18px] text-white active:scale-95 hover:bg-[#2E706D] transition-colors shadow-sm pt-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {(printStatus === 'rendering' || printStatus === 'printing') ? "Tunggu..." : "Tutup"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeModal === 'digital' && (
              <div className="bg-white w-full max-w-[500px] rounded-[24px] shadow-2xl relative z-10 overflow-hidden border border-[#54868A] flex flex-col p-6">
                <div className="flex items-center justify-center relative mb-6 shrink-0 w-full">
                  <div className="absolute left-0 w-[50px] h-[50px] bg-[#EAF5F3] border border-[#54868A]/30 rounded-[17px] flex items-center justify-center shadow-md">
                    <img src="/expor.png" className="w-[22px] h-[22px]" alt="export" />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <h2 className="font-inter font-bold text-[32px] text-[#332C2C] tracking-[-0.05em] leading-none mb-0.5">Kirim Digital</h2>
                    <p className="font-hind font-semibold text-[20px] text-[#3E8C7B] tracking-[-0.08em] leading-none">pilih cara menerima</p>
                  </div>
                </div>

                <div className="flex flex-col gap-5 overflow-y-auto no-scrollbar pr-1 pb-2 flex-1">
                  {/* <div className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-[20px] p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-[40px] h-[40px] bg-[#EAF5F3] border border-[#54868A]/30 rounded-full flex items-center justify-center shadow-md">
                        <img src="/wa.png" className="w-[24px] h-[24px] object-contain" alt="wa" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-inter font-bold text-[16px] text-[#332C2C] leading-tight">Kirim ke WhatsApp</span>
                        <span className="font-hind font-semibold text-[13px] text-[#3A9F86] leading-tight">Aktif setelah booth online (hosting)</span>
                      </div>
                    </div>
                    <input type="tel" placeholder="+62 8xx-xxxx-xxxx" className="w-full h-[45px] rounded-[10px] border border-[#54868A] bg-white px-4 font-inter text-[15px] outline-none focus:border-[#2E706D] mb-4 text-[#332C2C]" />
                    <button onClick={() => alert('Fitur WhatsApp aktif nanti pas booth udah di-hosting bro 🙏')} className="w-full h-[45px] bg-[#3A9F86] hover:bg-[#2E706D] rounded-[10px] flex items-center justify-center gap-2 transition-colors active:scale-[0.98] shadow-sm border border-[#54868A]">
                      <img src="/wa.png" className="w-[18px] h-[18px] filter brightness-0 invert" alt="wa-icon" />
                      <span className="font-inter font-bold italic text-[16px] text-white pt-0.5">Kirim ke WhatsApp</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 w-full px-2">
                    <div className="h-[1px] bg-[#54868A]/30 flex-1"></div>
                    <span className="font-hind font-bold italic text-[16px] text-[#D29E38]">atau</span>
                    <div className="h-[1px] bg-[#54868A]/30 flex-1"></div>
                  </div> */}

                  <div className="w-full bg-[#FFF6E5] border border-[#F2E0C4] rounded-[20px] p-5 flex flex-col items-center">
                    <div className="flex items-center gap-3 w-full mb-4">
                      <div className="w-[40px] h-[40px] bg-[#FFF6E5] rounded-xl flex items-center justify-center shadow-sm border border-[#F2E0C4]">
                        <img src="/scan.png" className="w-[22px] h-[22px]" alt="qr" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="font-inter font-bold text-[16px] text-[#332C2C] leading-tight">Scan QR ke Galeri</span>
                        <span className="font-hind font-semibold text-[13px] text-[#D29E38] leading-tight">Foto editan + foto mentah di HP</span>
                      </div>
                    </div>
                    <div className="w-[160px] h-[160px] bg-white rounded-xl shadow-md border border-[#54868A] p-3 flex items-center justify-center mb-3">
                      {galleryURL ? (
                        <QRCodeSVG value={galleryURL} size={134} bgColor="#ffffff" fgColor="#000000" level="M" />
                      ) : (
                        <span className="text-gray-400 text-xs">Generating QR...</span>
                      )}
                    </div>

                    {/* Status upload frame editan */}
                    {isUploadingFrame && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 border-2 border-[#D29E38] border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-hind text-[12px] text-[#D29E38]">Frame editan lagi di-upload...</span>
                      </div>
                    )}
                    {frameUploaded && !isUploadingFrame && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#3A9F86]">✓</span>
                        <span className="font-hind text-[12px] text-[#3A9F86] font-semibold">Frame editan siap di galeri</span>
                      </div>
                    )}
                    {frameUploadError && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#D85A5A]">⚠️</span>
                        <span className="font-hind text-[12px] text-[#D85A5A]">{frameUploadError}</span>
                      </div>
                    )}

                    {/* URL + Copy Button (kalo QR ga ke-scan, bisa copy manual) */}
                    {galleryURL && (
                      <div className="w-full flex flex-col gap-2 mt-1">
                        <div className="w-full bg-white border border-[#54868A]/30 px-3 py-2 rounded-lg flex items-center gap-2">
                          <span className="text-[14px] shrink-0">🔗</span>
                          <p className="font-mono text-[10px] text-[#5A7470] break-all leading-tight flex-1 text-left">{galleryURL}</p>
                        </div>
                        <button
                          onClick={copyGalleryLink}
                          className={`w-full h-[40px] rounded-lg font-inter font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm border ${
                            linkCopied
                              ? "bg-[#3A9F86] text-white border-[#3A9F86]"
                              : "bg-white hover:bg-[#F4F9F8] text-[#2E706D] border-[#54868A]"
                          }`}
                        >
                          {linkCopied ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Tersalin ke Clipboard!
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              Salin Link Galeri
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <img src="/scan.png" className="w-[16px] h-[16px] opacity-70" alt="scan" />
                      <span className="font-hind text-[12px] text-[#545454] text-center">Scan QR dari HP atau copy link → buka di browser HP</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="w-full h-[48px] bg-[#3A9F86] hover:bg-[#2E706D] border-[1.5px] border-[#54868A] rounded-[10px] flex items-center justify-center gap-2 transition-colors active:scale-[0.98] group disabled:opacity-60"
                  >
                    <span className="text-white text-xl leading-none pt-0.5">📥</span>
                    <span className="font-inter font-bold text-[15px] text-white">
                      {isZipping ? `Menyiapkan ZIP... ${zipProgress}%` : `Download Semua (${allCaptured.length} foto) sebagai ZIP`}
                    </span>
                  </button>
                </div>

                <div className="mt-4 shrink-0 w-full pt-4 border-t border-[#54868A]/30">
                  <button onClick={() => setActiveModal(null)} className="w-full h-[53px] bg-white border border-[#54868A] hover:bg-red-50 rounded-[23px] flex items-center justify-center active:scale-[0.98] transition-colors">
                    <span className="font-inter font-bold italic text-[20px] text-[#545454] pt-0.5">Tutup</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,400;0,500;0,700;1,700&display=swap');
          .font-hind { font-family: 'Hind Vadodara', sans-serif; }
          .font-inter { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes liveBlink {
            0%   { opacity: 0.1; transform: scale(1.04); }
            45%  { opacity: 1;   transform: scale(1); }
            100% { opacity: 1;   transform: scale(1); }
          }
          .live-blink { animation: liveBlink 0.22s ease-out; }
        `}</style>
      </main>
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}