"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";
const TIMER_SECONDS = 180; // 3 menit

interface ApiPhoto { id: number; session_id: number; photo_path: string; slot_number: number; }
interface ApiSession { id: number; transaction_id: string; frame_id: string; template_name: string; photos: ApiPhoto[]; }
interface ApiTemplate {
  id: number; name: string; layout_type: string; frame_path: string; slot_count: number;
  overlay_top: number; overlay_left: number; overlay_right: number; overlay_bottom: number;
  overlay_gap: number; overlay_cols: number;
}

// 🎯 NEW transform: zoom + fx/fy fractions (-1..1). Image always covers slot.
interface PhotoTransform {
  zoom: number; // 1..4
  fx: number;   // -1..1 (horizontal position fraction)
  fy: number;   // -1..1 (vertical position fraction)
}

interface SlotState {
  id: number;
  photo: string | null;
  transform: PhotoTransform;
  imgW?: number; // image naturalWidth
  imgH?: number; // image naturalHeight
}

const DEFAULT_TRANSFORM: PhotoTransform = { zoom: 1, fx: 0, fy: 0 };
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const MOVE_THRESHOLD = 4;
const PAN_HEADROOM = 1.15;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// 🎯 Hitung image render dimensions + offset (cover-based, foto selalu fill slot)
function computeImageLayout(cw: number, ch: number, imgW: number, imgH: number, transform: PhotoTransform) {
  const cover = Math.max(cw / imgW, ch / imgH) * PAN_HEADROOM;  // 🎯 pan headroom biar bisa geser 2 arah
  const z = cover * transform.zoom;
  const renderedW = imgW * z;
  const renderedH = imgH * z;
  const halfX = Math.max(1, (renderedW - cw) / 2);
  const halfY = Math.max(1, (renderedH - ch) / 2);
  const offsetX = (cw - renderedW) / 2 + transform.fx * halfX;
  const offsetY = (ch - renderedH) / 2 + transform.fy * halfY;
  return { renderedW, renderedH, halfX, halfY, offsetX, offsetY };
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

function getOverlayStyle(template: ApiTemplate | null, slotCount: number): React.CSSProperties {
  const top = template?.overlay_top || 10;
  const left = template?.overlay_left || 10;
  const right = template?.overlay_right || 10;
  const bottom = template?.overlay_bottom || 10;
  const gap = template?.overlay_gap ?? 4;
  const cols = Math.max(1, Math.min(template?.overlay_cols || 1, 4));
  const rows = Math.ceil(slotCount / cols);
  return {
    position: 'absolute',
    top: `${top}%`,
    left: `${left}%`,
    right: `${right}%`,
    bottom: `${bottom}%`,
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: `${gap}%`,
  };
}

function PrintReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get('txn') || "";

  const [session, setSession] = useState<ApiSession | null>(null);
  const [template, setTemplate] = useState<ApiTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [slots, setSlots] = useState<SlotState[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const [frameAspect, setFrameAspect] = useState<number>(0.42);

  const [draggingPhoto, setDraggingPhoto] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const [activelyPanning, setActivelyPanning] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  // 🎯 Slot DOM dimensions (tracked via ResizeObserver)
  const [slotDims, setSlotDims] = useState<Record<number, { w: number; h: number }>>({});
  const slotElsRef = useRef<Record<number, HTMLDivElement>>({});

  usePageSound("/fase/pilih.mp3");

  const panStateRef = useRef<{
    slotId: number;
    startX: number; startY: number;
    baseFx: number; baseFy: number;
    moved: boolean;
    containerW: number; containerH: number;
    imgW: number; imgH: number;
    zoom: number;
  } | null>(null);

  const pinchStateRef = useRef<{
    slotId: number;
    startDist: number;
    baseZoom: number;
  } | null>(null);

  const justDraggedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef(slots);
  useEffect(() => { slotsRef.current = slots; }, [slots]);

  // 🎯 Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!txn) {
        setErrorMsg("Transaksi tidak valid");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/photo-session/by-transaction/${txn}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Gagal load sesi");
          setLoading(false);
          return;
        }
        setSession(data.session);
        setTemplate(data.template);
        const slotCount = data.template?.slot_count || 4;
        setSlots(
          Array.from({ length: slotCount }).map((_, i) => ({
            id: i + 1,
            photo: null,
            transform: { ...DEFAULT_TRANSFORM },
          }))
        );
      } catch (err) {
        console.error("Fetch error:", err);
        setErrorMsg("Gagal konek ke server");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [txn]);

  // 🎯 Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      sessionStorage.setItem("arranged_slots", JSON.stringify(slotsRef.current));
      router.push(`/filter?txn=${txn}`);
      return;
    }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, router, txn]);

  // 🎯 ResizeObserver — track slot dimensions
  useEffect(() => {
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
    return () => observer.disconnect();
  }, [slots.length, frameAspect]);

  // 🎯 Global mouse listener
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const ps = panStateRef.current;
      if (!ps || !ps.imgW || !ps.imgH) return;
      const dx = e.clientX - ps.startX;
      const dy = e.clientY - ps.startY;
      if (!ps.moved && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
        ps.moved = true;
        setActivelyPanning(ps.slotId);
        setSelectedSlot(null);
      }
      if (ps.moved) {
        const layout = computeImageLayout(ps.containerW, ps.containerH, ps.imgW, ps.imgH,
          { zoom: ps.zoom, fx: ps.baseFx, fy: ps.baseFy });
        const newFx = clamp(ps.baseFx + dx / layout.halfX, -1, 1);
        const newFy = clamp(ps.baseFy + dy / layout.halfY, -1, 1);
        setSlots(prev => prev.map(s =>
          s.id === ps.slotId ? { ...s, transform: { ...s.transform, fx: newFx, fy: newFy } } : s
        ));
      }
    };
    const onMouseUp = () => {
      const ps = panStateRef.current;
      if (ps?.moved) {
        justDraggedRef.current = true;
        setTimeout(() => { justDraggedRef.current = false; }, 100);
      }
      panStateRef.current = null;
      setActivelyPanning(null);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const capturedPhotos = session?.photos?.map((p) => p.photo_path) || [];

  const handlePrevPhoto = () => {
    if (previewIndex !== null) setPreviewIndex(previewIndex === 0 ? capturedPhotos.length - 1 : previewIndex - 1);
  };
  const handleNextPhoto = () => {
    if (previewIndex !== null) setPreviewIndex(previewIndex === capturedPhotos.length - 1 ? 0 : previewIndex + 1);
  };

  const assignSlot = (slotId: number) => {
    if (previewIndex === null) return;
    const currentPhoto = capturedPhotos[previewIndex];
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, photo: currentPhoto, transform: { ...DEFAULT_TRANSFORM }, imgW: undefined, imgH: undefined } : s
    ));
    setPreviewIndex(null);
    setSelectedSlot(null);
  };

  const removePhotoFromSlot = (slotId: number) => {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, photo: null, transform: { ...DEFAULT_TRANSFORM }, imgW: undefined, imgH: undefined } : s
    ));
    setSelectedSlot(null);
  };

  // 🎯 Drag-drop gallery
  const handleDragStart = (e: React.DragEvent, photoUrl: string) => {
    setDraggingPhoto(photoUrl);
    e.dataTransfer.effectAllowed = "copy";
    if (e.dataTransfer.setDragImage) {
      const img = e.currentTarget.querySelector('img');
      if (img) e.dataTransfer.setDragImage(img, 50, 50);
    }
  };
  const handleDragEnd = () => { setDraggingPhoto(null); setDragOverSlot(null); };
  const handleSlotDragOver = (e: React.DragEvent, slotId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverSlot(slotId);
  };
  const handleSlotDragLeave = () => setDragOverSlot(null);
  const handleSlotDrop = (e: React.DragEvent, slotId: number) => {
    e.preventDefault();
    if (!draggingPhoto) return;
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, photo: draggingPhoto, transform: { ...DEFAULT_TRANSFORM }, imgW: undefined, imgH: undefined } : s
    ));
    setDraggingPhoto(null);
    setDragOverSlot(null);
    setSelectedSlot(null);
  };

  // 🎯 PAN mouse
  const handleSlotMouseDown = (e: React.MouseEvent, slot: SlotState) => {
    if (!slot.photo || !slot.imgW || !slot.imgH) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    panStateRef.current = {
      slotId: slot.id,
      startX: e.clientX, startY: e.clientY,
      baseFx: slot.transform.fx, baseFy: slot.transform.fy,
      moved: false,
      containerW: rect.width, containerH: rect.height,
      imgW: slot.imgW, imgH: slot.imgH,
      zoom: slot.transform.zoom,
    };
  };

  // 🎯 ZOOM (wheel) — multiplicative kayak reference
  const handleSlotWheel = (e: React.WheelEvent, slot: SlotState) => {
    if (!slot.photo) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = clamp(slot.transform.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    setSlots(prev => prev.map(s =>
      s.id === slot.id ? { ...s, transform: { ...s.transform, zoom: newZoom } } : s
    ));
  };

  // 🎯 TOUCH
  const handleSlotTouchStart = (e: React.TouchEvent, slot: SlotState) => {
    if (!slot.photo || !slot.imgW || !slot.imgH) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pinchStateRef.current = { slotId: slot.id, startDist: dist, baseZoom: slot.transform.zoom };
      panStateRef.current = null;
    } else if (e.touches.length === 1) {
      panStateRef.current = {
        slotId: slot.id,
        startX: e.touches[0].clientX, startY: e.touches[0].clientY,
        baseFx: slot.transform.fx, baseFy: slot.transform.fy,
        moved: false,
        containerW: rect.width, containerH: rect.height,
        imgW: slot.imgW, imgH: slot.imgH,
        zoom: slot.transform.zoom,
      };
      pinchStateRef.current = null;
    }
  };

  const handleSlotTouchMove = (e: React.TouchEvent, slot: SlotState) => {
    if (!slot.photo) return;
    e.preventDefault();
    if (e.touches.length === 2 && pinchStateRef.current) {
      const ps = pinchStateRef.current;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / ps.startDist;
      const newZoom = clamp(ps.baseZoom * ratio, MIN_ZOOM, MAX_ZOOM);
      setSlots(prev => prev.map(s =>
        s.id === ps.slotId ? { ...s, transform: { ...s.transform, zoom: newZoom } } : s
      ));
    } else if (e.touches.length === 1 && panStateRef.current) {
      const ps = panStateRef.current;
      const dx = e.touches[0].clientX - ps.startX;
      const dy = e.touches[0].clientY - ps.startY;
      if (!ps.moved && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
        ps.moved = true;
        setActivelyPanning(ps.slotId);
        setSelectedSlot(null);
      }
      if (ps.moved) {
        const layout = computeImageLayout(ps.containerW, ps.containerH, ps.imgW, ps.imgH,
          { zoom: ps.zoom, fx: ps.baseFx, fy: ps.baseFy });
        const newFx = clamp(ps.baseFx + dx / layout.halfX, -1, 1);
        const newFy = clamp(ps.baseFy + dy / layout.halfY, -1, 1);
        setSlots(prev => prev.map(s =>
          s.id === ps.slotId ? { ...s, transform: { ...s.transform, fx: newFx, fy: newFy } } : s
        ));
      }
    }
  };

  const handleSlotTouchEnd = (slot: SlotState) => {
    const ps = panStateRef.current;
    if (ps && !ps.moved && slot.photo) {
      setSelectedSlot(selectedSlot === slot.id ? null : slot.id);
    }
    panStateRef.current = null;
    pinchStateRef.current = null;
    setActivelyPanning(null);
  };

  const handleSlotClick = (slot: SlotState) => {
    if (justDraggedRef.current) return;
    if (!slot.photo) return;
    setSelectedSlot(selectedSlot === slot.id ? null : slot.id);
  };

  const handleImgLoad = (slotId: number, imgEl: HTMLImageElement) => {
    if (!imgEl.naturalWidth || !imgEl.naturalHeight) return;
    setSlots(prev => prev.map(s =>
      s.id === slotId && (s.imgW !== imgEl.naturalWidth || s.imgH !== imgEl.naturalHeight)
        ? { ...s, imgW: imgEl.naturalWidth, imgH: imgEl.naturalHeight }
        : s
    ));
  };

  const isComplete = slots.length > 0 && slots.every(s => s.photo !== null);
  const slotsRemaining = slots.filter(s => s.photo === null).length;

  if (loading) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: '#E3D5D5' }}>
        <p className="font-inter font-semibold text-[24px] text-[#395350]">Memuat data sesi...</p>
      </main>
    );
  }
  if (errorMsg || !session) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: '#E3D5D5' }}>
        <div className="bg-white rounded-[18px] shadow-lg p-10 text-center max-w-[500px]">
          <h1 className="font-inter font-bold text-[32px] text-[#332C2C] mb-3">Sesi Tidak Ditemukan</h1>
          <p className="font-inter text-[16px] text-[#6F6F6F] mb-6">{errorMsg || "Belum ada sesi foto untuk transaksi ini."}</p>
          <button onClick={() => router.push(txn ? `/frame?txn=${txn}` : "/pilih-paket")} className="bg-[#38635A] text-white px-6 py-3 rounded-full font-bold text-[16px] hover:bg-[#2c4e47] transition-colors">← Pilih Template</button>
        </div>
      </main>
    );
  }
  if (capturedPhotos.length === 0) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: '#E3D5D5' }}>
        <div className="bg-white rounded-[18px] shadow-lg p-10 text-center max-w-[500px]">
          <h1 className="font-inter font-bold text-[32px] text-[#332C2C] mb-3">Belum Ada Foto</h1>
          <p className="font-inter text-[16px] text-[#6F6F6F] mb-6">Kamu belum ngambil foto. Mulai jepret dulu di halaman kamera!</p>
          <button onClick={() => router.push(`/kamera?txn=${txn}`)} className="bg-[#38635A] text-white px-6 py-3 rounded-full font-bold text-[16px] hover:bg-[#2c4e47] transition-colors">📸 Mulai Foto</button>
        </div>
      </main>
    );
  }

  const slotCount = slots.length;
  const overlayStyle = getOverlayStyle(template, slotCount);

  const MAX_W = 400;
  const MAX_H = 600;
  let dispW = MAX_W;
  let dispH = MAX_W / frameAspect;
  if (dispH > MAX_H) { dispH = MAX_H; dispW = MAX_H * frameAspect; }

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-4 pb-10 overflow-x-hidden select-none" style={{ backgroundColor: '#E3D5D5' }}>

      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[85%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
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

      <div className="w-full flex justify-center items-center mt-6 mb-4 z-10 px-4 relative min-h-[80px]">
        <div className="flex flex-col items-center leading-none">
          <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">Atur posisi fotomu!</p>
          <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">Pilih {slotCount} Foto untuk Slot Frame</h1>
        </div>
      </div>

  <div className="flex justify-center px-6 mb-6 z-10">
  <div className="inline-flex bg-gradient-to-r from-[#F4E5C2] to-[#FFEFD0] border-[1.5px] border-[#D29E38] rounded-[16px] py-3 px-5 items-center gap-3 shadow-sm">
    <div className="shrink-0 w-[44px] h-[44px] bg-[#D29E38] rounded-full flex items-center justify-center shadow-inner">
      <span className="text-[22px]">💡</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-[26px] h-[26px] bg-[#3A9F86] rounded-full flex items-center justify-center text-white font-bold text-[13px] shadow-sm shrink-0">1</div>
        <span className="font-hind font-semibold text-[14px] text-[#7A5A1F] tracking-[-0.04em] leading-tight">Tap foto buat preview</span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-[26px] h-[26px] bg-[#3A9F86] rounded-full flex items-center justify-center text-white font-bold text-[13px] shadow-sm shrink-0">2</div>
        <span className="font-hind font-semibold text-[14px] text-[#7A5A1F] tracking-[-0.04em] leading-tight"><strong>Drag &amp; drop</strong> atau klik <strong>"+ Pilih"</strong></span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-[26px] h-[26px] bg-[#3A9F86] rounded-full flex items-center justify-center text-white font-bold text-[13px] shadow-sm shrink-0">3</div>
        <span className="font-hind font-semibold text-[14px] text-[#7A5A1F] tracking-[-0.04em] leading-tight">1 foto bisa <strong>banyak slot</strong></span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-[26px] h-[26px] bg-[#3A9F86] rounded-full flex items-center justify-center text-white font-bold text-[13px] shadow-sm shrink-0">4</div>
        <span className="font-hind font-semibold text-[14px] text-[#7A5A1F] tracking-[-0.04em] leading-tight"><strong>Geser & zoom</strong></span>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-[26px] h-[26px] bg-[#3A9F86] rounded-full flex items-center justify-center text-white font-bold text-[13px] shadow-sm shrink-0">5</div>
        <span className="font-hind font-semibold text-[14px] text-[#7A5A1F] tracking-[-0.04em] leading-tight"><strong>klik ✕</strong> untuk hapus</span>
      </div>
    </div>
  </div>
</div>

      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-10 items-start justify-center px-6 flex-grow">

        <div className="flex flex-col gap-3 items-center">
          <div className="flex flex-col gap-1 items-start self-stretch ml-4">
            <h2 className="font-hind font-semibold text-[24px] tracking-[-0.08em] text-[#3E8C7B] uppercase drop-shadow-md">Preview Frame</h2>
          </div>

          <div className="bg-white border-[1.5px] border-[#54868A] rounded-[24px] flex items-center justify-center relative shadow-sm p-4 scale-[0.95] origin-top mt-1">
            <div className="relative" style={{ width: `${dispW}px`, height: `${dispH}px` }}>

              <div style={overlayStyle} className="z-10">
                {slots.map((slot) => {
                  const isDragOver = dragOverSlot === slot.id;
                  const isPanning = activelyPanning === slot.id;
                  const isSelected = selectedSlot === slot.id;
                  const isZoomed = slot.transform.zoom > 1.01;
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
                      transition: isPanning || pinchStateRef.current?.slotId === slot.id ? 'none' : 'all 0.12s ease-out',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      maxWidth: 'none',
                      maxHeight: 'none',
                    };
                  }

                  return (
                    <div
                      key={slot.id}
                      ref={(el) => { if (el) { slotElsRef.current[slot.id] = el; el.dataset.slotId = String(slot.id); } }}
                      data-slot-id={slot.id}
                      onDragOver={(e) => handleSlotDragOver(e, slot.id)}
                      onDragLeave={handleSlotDragLeave}
                      onDrop={(e) => handleSlotDrop(e, slot.id)}
                      onMouseDown={(e) => handleSlotMouseDown(e, slot)}
                      onClick={() => handleSlotClick(slot)}
                      onWheel={(e) => handleSlotWheel(e, slot)}
                      onTouchStart={(e) => handleSlotTouchStart(e, slot)}
                      onTouchMove={(e) => handleSlotTouchMove(e, slot)}
                      onTouchEnd={() => handleSlotTouchEnd(slot)}
                      className={`w-full h-full overflow-hidden relative group transition-all ${
                        isDragOver
                          ? "bg-[#3A9F86]/30 ring-4 ring-[#3A9F86] ring-inset"
                          : isSelected
                          ? "ring-4 ring-[#FBB400] ring-inset bg-[#FFF1C2]/10"
                          : "bg-[#E5E5E5]"
                      } ${slot.photo ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-pointer"}`}
                      style={{ touchAction: slot.photo ? "none" : "auto" }}
                    >
                      {slot.photo && (
                        <img
                          src={slot.photo}
                          onLoad={(e) => handleImgLoad(slot.id, e.currentTarget)}
                          style={haveLayout ? imgStyle : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
                          draggable={false}
                          alt={`Slot ${slot.id}`}
                        />
                      )}
                      {!slot.photo && (
                        <span className={`absolute inset-0 flex items-center justify-center font-bold opacity-40 text-4xl drop-shadow-sm pointer-events-none ${isDragOver ? "text-white" : "text-[#54868A]"}`}>
                          {isDragOver ? "+" : slot.id}
                        </span>
                      )}

                      {isSelected && slot.photo && (
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); removePhotoFromSlot(slot.id); }}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[44px] h-[44px] bg-red-500/95 hover:bg-red-600 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.4)] z-20 border-[3px] border-white animate-pop-in cursor-pointer backdrop-blur-sm"
                          title="Hapus foto"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      )}

                      {slot.photo && isZoomed && (
                        <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 pointer-events-none flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                          {slot.transform.zoom.toFixed(1)}×
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {template?.frame_path && (
                <img
                  src={template.frame_path}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) setFrameAspect(img.naturalWidth / img.naturalHeight);
                  }}
                  className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none drop-shadow-md"
                  alt="Frame"
                />
              )}
            </div>
          </div>

          <div className="w-full max-w-[420px] h-[55px] bg-white border-[1.5px] border-[#CCAE19] rounded-full flex items-center justify-center shadow-sm -mt-7">
            <span className="font-hind font-semibold text-[22px] tracking-[-0.08em] text-[#FDAD00] drop-shadow-sm">
              {slots.filter(s => s.photo).length} / {slotCount} Slot foto terisi
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-hind font-semibold text-[24px] tracking-[-0.08em] text-[#3E8C7B] uppercase self-start ml-4 drop-shadow-md">
            ({capturedPhotos.length}) Foto
          </h2>
          <div className="flex gap-4">
            <div className="w-[625px] h-[600px] bg-[#A9A6A6] border-[1.5px] border-[#54868A] rounded-[23px] p-6 relative shadow-inner">
              <div
                ref={scrollRef}
                onScroll={() => setScrollProgress(scrollRef.current ? scrollRef.current.scrollTop / (scrollRef.current.scrollHeight - scrollRef.current.clientHeight) : 0)}
                className="grid grid-cols-4 gap-4 h-full overflow-y-auto pr-2 no-scrollbar content-start"
              >
                {capturedPhotos.map((photo, i) => {
                  const usedInSlots = slots.filter(s => s.photo === photo).map(s => s.id);
                  const isUsed = usedInSlots.length > 0;
                  const isDragging = draggingPhoto === photo;
                  return (
                    <div key={i} className="relative group aspect-[4/3]">
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, photo)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setPreviewIndex(i)}
                        className={`w-full h-full rounded-[15px] border-[2px] border-[#54868A] overflow-hidden bg-white transition-all cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 shadow-sm ${isUsed ? "opacity-90" : ""} ${isDragging ? "opacity-30 scale-95" : ""}`}
                      >
                        <img src={photo} className="w-full h-full object-cover pointer-events-none" alt="Captured" />
                        {isUsed && (
                          <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-0.5 pointer-events-none">
                            <div className="bg-[#FBB400] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white shadow-md">
                              {usedInSlots.length > 1 ? `${usedInSlots.length}× SLOT` : `SLOT ${usedInSlots[0]}`}
                            </div>
                            {usedInSlots.length > 1 && (
                              <div className="bg-white/95 text-[#FBB400] text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                #{usedInSlots.join(",")}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                            <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="w-[12px] h-[600px] bg-[#202020] border-[1.5px] border-[#54868A] rounded-full relative flex justify-center shadow-inner">
              <div className="w-[12px] h-[100px] bg-[#006E68] border-[1.5px] border-[#54868A] rounded-full absolute transition-all duration-75" style={{ top: `${scrollProgress * (600 - 100)}px` }} />
            </div>
          </div>
          <div className="flex gap-10 mt-2 self-start ml-4 font-hind font-semibold text-[18px] text-[#3E8C7B] tracking-[-0.08em]">
            <div className="flex items-center gap-3"><div className="w-6 h-6 bg-[#FBB400] rounded-full shadow-sm"></div><span>SUDAH DIPILIH</span></div>
            <div className="flex items-center gap-3"><div className="w-6 h-6 bg-white border border-[#54868A] rounded-full shadow-sm"></div><span>BELUM DIPILIH</span></div>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-3 items-center px-8 mt-5 mb-4">
        <div className="flex justify-start">
          <button 
            onClick={() => router.push(`/frame?txn=${txn}`)} 
            className="flex items-center gap-2 px-8 h-[53px] bg-white border-[1.5px] border-[#54868A] rounded-full shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <span className="font-inter font-bold italic text-[20px] tracking-[-0.06em] text-[#0E1E1A]">
              ← Kembali
            </span>
          </button>
        </div>
        <div className="flex items-center justify-center">
          <button
            onClick={() => { sessionStorage.setItem("arranged_slots", JSON.stringify(slots)); router.push(`/filter?txn=${txn}`); }}
            disabled={!isComplete}
            className={`flex items-center justify-center gap-3 w-full sm:w-[265px] h-[53px] border-[3px] border-[#E3D5D5] rounded-[23px] shadow-md transition-all ${isComplete ? 'bg-[#3A9F86] hover:scale-105 active:scale-95 cursor-pointer' : 'bg-gray-400 opacity-60 grayscale cursor-not-allowed'}`}
          >
            <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em]">Filter & Stiker</span>
            <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        </div>
        <div className="hidden sm:block"></div>
      </div>

      {previewIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-[#878787]/95 backdrop-blur-md flex flex-col p-6 animate-fade-in items-center justify-center">
          <div className="flex justify-between items-center mb-6 w-full max-w-[1100px]">
            <div className="px-4 py-1.5 bg-[#B7D4CD] border border-[#54868A] rounded-full shadow-sm flex items-center gap-2">
              <span className="font-inter font-bold text-[14px] text-[#245D4C]">STUDIO BOOTH</span>
            </div>
            <div className="px-6 py-2 bg-white/40 border border-white/50 rounded-full shadow-sm">
              <span className="font-inter font-bold text-white tracking-wide">Pilih Foto &bull; {previewIndex + 1} dari {capturedPhotos.length}</span>
            </div>
            <button onClick={() => setPreviewIndex(null)} className="w-10 h-10 bg-white/40 border border-white/50 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="relative flex items-center justify-center rounded-[24px] overflow-hidden shadow-2xl border-[3px] border-[#54868A]" style={{ maxHeight: '55vh', maxWidth: '900px' }}>
            <img src={capturedPhotos[previewIndex]} className="block max-h-[55vh] max-w-full h-auto w-auto object-contain" alt="Preview" style={{ display: 'block' }} />
            <button onClick={handlePrevPhoto} className="absolute left-6 w-14 h-14 bg-[#424242]/80 hover:bg-[#54868A] border-2 border-white/20 rounded-full flex items-center justify-center transition-all shadow-md">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={handleNextPhoto} className="absolute right-6 w-14 h-14 bg-[#424242]/80 hover:bg-[#54868A] border-2 border-white/20 rounded-full flex items-center justify-center transition-all shadow-md">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
            <div className="absolute top-6 left-6 px-4 py-1.5 bg-[#2B2B2B]/80 text-white font-bold rounded-full border border-white/20">Foto {previewIndex + 1}</div>
          </div>
          <div className="mt-8 flex flex-col gap-3 w-full max-w-[1100px]">
            <div className="bg-[#B9CAC6] rounded-[20px] p-3 flex items-center border-[2px] border-[#54868A] shadow-md gap-3 w-full">
              <div className="flex items-center gap-3 shrink-0 md:pr-4 md:border-r border-[#54868A]/30">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#3A9F86] rounded-xl flex items-center justify-center shadow-inner">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-inter font-bold text-[16px] md:text-[18px] text-[#245D4C] whitespace-nowrap">Pilih slot simpan</span>
                  <span className="font-inter text-[#467664] text-[13px] md:text-[14px] whitespace-nowrap">Klik slot, langsung tertutup.</span>
                </div>
              </div>
              <div className="flex flex-1 gap-2 md:gap-3 justify-between min-w-0 flex-wrap">
                {slots.map((slot) => {
                  const currentPhotoUrl = capturedPhotos[previewIndex];
                  const isCurrentPhotoSelected = slot.photo === currentPhotoUrl;
                  const isFilledByOther = slot.photo !== null && slot.photo !== currentPhotoUrl;
                  return (
                    <button key={slot.id} onClick={() => assignSlot(slot.id)} className={`flex-1 min-w-[120px] flex items-center justify-between bg-white px-2 py-2 rounded-[12px] border-[2px] transition-all hover:scale-105 active:scale-95 ${isCurrentPhotoSelected ? 'border-[#FBB400] shadow-[0_0_10px_rgba(251,180,0,0.4)]' : isFilledByOther ? 'border-white' : 'border-white hover:border-[#3A9F86]'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-md font-bold text-xl overflow-hidden shadow-inner ${isCurrentPhotoSelected || isFilledByOther ? 'bg-transparent' : 'bg-[#E1EAE8] text-[#3A9F86]'}`}>
                          {slot.photo ? <img src={slot.photo} className="w-full h-full object-cover" /> : '+'}
                        </div>
                        <div className="flex-col text-left leading-tight min-w-0 hidden sm:flex">
                          <span className="font-inter font-bold text-[14px] text-[#2D2D2D] truncate">Slot {slot.id}</span>
                          <span className={`font-inter text-[11px] truncate ${isCurrentPhotoSelected || isFilledByOther ? 'text-[#FBB400] font-bold' : 'text-[#696969]'}`}>
                            {isCurrentPhotoSelected ? 'Terpilih' : isFilledByOther ? 'Sudah Terisi' : 'Kosong'}
                          </span>
                        </div>
                      </div>
                      <div className={`shrink-0 ml-1 px-3 py-1.5 rounded-full font-bold text-[11px] transition-colors ${isCurrentPhotoSelected ? 'bg-[#FBB400] text-white' : isFilledByOther ? 'bg-white text-[#FBB400] border border-[#FBB400]' : 'bg-[#3A9F86] text-white'}`}>
                        {isCurrentPhotoSelected ? 'TERPILIH' : isFilledByOther ? 'GANTI' : '+ PILIH'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={`w-full px-5 py-3 rounded-full border-[1.5px] flex items-center gap-3 transition-colors duration-300 ${slotsRemaining === 0 ? 'bg-[#FFF9E6] border-[#FBB400]' : 'bg-[#B9CAC6] border-[#54868A]'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${slotsRemaining === 0 ? 'bg-[#FBB400]' : 'bg-[#3A9F86]'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {slotsRemaining === 0 ? <path d="M20 6L9 17l-5-5" /> : <polyline points="20 6 9 17 4 12" />}
                </svg>
              </div>
              <span className={`font-inter text-[15px] ${slotsRemaining === 0 ? 'text-[#B8860B]' : 'text-[#245D4C]'}`}>
                {slotsRemaining === 0 ?
                  <><strong className="font-bold text-[#FBB400]">Semua slot sudah terisi!</strong> Tutup tampilan ini dan klik tombol Lanjut.</> :
                  <>Pilih slot di atas — modal akan tertutup otomatis. Sisa <strong className="font-bold">{slotsRemaining} slot kosong</strong>.</>
                }
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        @keyframes pop-in { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        .animate-pop-in { animation: pop-in 0.15s ease-out forwards; }
      `}</style>
    </main>
  );
}

export default function PrintReviewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <PrintReviewContent />
    </Suspense>
  );
}