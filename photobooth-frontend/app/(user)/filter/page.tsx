"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageSound } from "@/hooks/usePageSound";

const BACKEND_URL = "http://localhost:8080";
const TIMER_SECONDS = 180;

interface PlacedSticker {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  emoji: string;
}

interface ApiFilter {
  id: number;
  name: string;
  css: string;
  bg_color: string;
  is_active: boolean;
}

// 🎯 NEW transform: zoom + fx/fy fractions
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
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const MOVE_THRESHOLD = 4;
const PAN_HEADROOM = 1.15;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function computeImageLayout(cw: number, ch: number, imgW: number, imgH: number, transform: PhotoTransform) {
  const cover = Math.max(cw / imgW, ch / imgH);
  const z = cover * transform.zoom;
  const renderedW = imgW * z;
  const renderedH = imgH * z;
  const halfX = Math.max(1, (renderedW - cw) / 2);
  const halfY = Math.max(1, (renderedH - ch) / 2);
  const offsetX = (cw - renderedW) / 2 + transform.fx * halfX;
  const offsetY = (ch - renderedH) / 2 + transform.fy * halfY;
  return { renderedW, renderedH, halfX, halfY, offsetX, offsetY };
}

// 🎯 Migrate old transform format ({scale, x, y}) → new ({zoom, fx, fy})
function migrateTransform(t: any): PhotoTransform {
  if (!t) return { ...DEFAULT_TRANSFORM };
  if (typeof t.zoom === 'number') return { zoom: t.zoom, fx: t.fx ?? 0, fy: t.fy ?? 0 };
  if (typeof t.scale === 'number') return { zoom: t.scale, fx: 0, fy: 0 };
  return { ...DEFAULT_TRANSFORM };
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

function FilterStickerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get('txn') || "";

  const [framePath, setFramePath] = useState<string>("");
  const [overlayStyle, setOverlayStyle] = useState<any>({});
  const [photoSlots, setPhotoSlots] = useState<SlotState[]>([]);
  const [dbFilters, setDbFilters] = useState<ApiFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [frameAspect, setFrameAspect] = useState<number>(0.667);

  const [selectedFilter, setSelectedFilter] = useState("ORIGINAL");
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [isBefore, setIsBefore] = useState(true);
  const [stickerCategory, setStickerCategory] = useState("Ekspresi");
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [activelyPanning, setActivelyPanning] = useState<number | null>(null);
  const [slotDims, setSlotDims] = useState<Record<number, { w: number; h: number }>>({});
  const slotElsRef = useRef<Record<number, HTMLDivElement>>({});
  usePageSound("/fase/filter.mp3");

  // 🎯 Drag & drop sticker dari grid ke frame
  const [draggingEmoji, setDraggingEmoji] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragActiveRef = useRef<boolean>(false);

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

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ id: number; type: "move" | "resize" | "rotate"; startX: number; startY: number; startSize: number; startLeft: number; startTop: number; startRotation: number; } | null>(null);

  const stateSnapshotRef = useRef({ photoSlots, selectedFilter, filterIntensity, placedStickers, dbFilters });
  useEffect(() => {
    stateSnapshotRef.current = { photoSlots, selectedFilter, filterIntensity, placedStickers, dbFilters };
  }, [photoSlots, selectedFilter, filterIntensity, placedStickers, dbFilters]);

  useEffect(() => {
    const fetchData = async () => {
      if (!txn) {
        setErrorMsg("Transaksi tidak valid. Mulai dari awal lagi.");
        setLoading(false);
        return;
      }
      try {
        const resSession = await fetch(`${BACKEND_URL}/api/photo-session/by-transaction/${txn}`);
        const sessionData = await resSession.json();
        if (!resSession.ok) {
          setErrorMsg(sessionData.error || "Sesi tidak ditemukan");
          setLoading(false);
          return;
        }
        const template = sessionData.template;
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
          const photos = sessionData.session?.photos || [];
          slots = Array.from({ length: slotCount }).map((_, i) => ({
            id: i + 1,
            photo: photos[i]?.photo_path || null,
            transform: { ...DEFAULT_TRANSFORM },
          }));
        }
        setPhotoSlots(slots);

        const resFilters = await fetch(`${BACKEND_URL}/api/filters`);
        const filtersData: ApiFilter[] = await resFilters.json();
        setDbFilters(filtersData || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setErrorMsg("Gagal konek ke server");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [txn]);

  const saveStateToSession = () => {
    const snap = stateSnapshotRef.current;
    sessionStorage.setItem("arranged_slots", JSON.stringify(snap.photoSlots));
    const selectedFilterObj = snap.dbFilters.find(f => f.name.toUpperCase() === snap.selectedFilter);
    sessionStorage.setItem("applied_filter", snap.selectedFilter);
    sessionStorage.setItem("applied_filter_css", selectedFilterObj?.css || "none");
    sessionStorage.setItem("filter_intensity", snap.filterIntensity.toString());
    sessionStorage.setItem("applied_stickers", JSON.stringify(snap.placedStickers));
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      saveStateToSession();
      router.push(`/result?txn=${txn}`);
      return;
    }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, router, txn]);

  // ResizeObserver
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
  }, [photoSlots.length, frameAspect]);

  // Global mouse listener for pan
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const ps = panStateRef.current;
      if (!ps || !ps.imgW || !ps.imgH) return;
      const dx = e.clientX - ps.startX;
      const dy = e.clientY - ps.startY;
      if (!ps.moved && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
        ps.moved = true;
        setActivelyPanning(ps.slotId);
      }
      if (ps.moved) {
        const layout = computeImageLayout(ps.containerW, ps.containerH, ps.imgW, ps.imgH,
          { zoom: ps.zoom, fx: ps.baseFx, fy: ps.baseFy });
        const newFx = clamp(ps.baseFx + dx / layout.halfX, -1, 1);
        const newFy = clamp(ps.baseFy + dy / layout.halfY, -1, 1);
        setPhotoSlots(prev => prev.map(s =>
          s.id === ps.slotId ? { ...s, transform: { ...s.transform, fx: newFx, fy: newFy } } : s
        ));
      }
    };
    const onMouseUp = () => {
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

  // Pan/zoom handlers
  const handleSlotMouseDown = (e: React.MouseEvent, slot: SlotState) => {
    if (!slot.photo || !slot.imgW || !slot.imgH) return;
    // 🎯 Kalo lagi drag sticker dari grid, skip pan
    if (dragActiveRef.current) return;
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

  const handleSlotWheel = (e: React.WheelEvent, slot: SlotState) => {
    if (!slot.photo) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = clamp(slot.transform.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    setPhotoSlots(prev => prev.map(s =>
      s.id === slot.id ? { ...s, transform: { ...s.transform, zoom: newZoom } } : s
    ));
  };

  const handleSlotTouchStart = (e: React.TouchEvent, slot: SlotState) => {
    if (!slot.photo || !slot.imgW || !slot.imgH) return;
    // 🎯 Kalo lagi drag sticker dari grid, skip pan
    if (dragActiveRef.current) return;
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
      setPhotoSlots(prev => prev.map(s =>
        s.id === ps.slotId ? { ...s, transform: { ...s.transform, zoom: newZoom } } : s
      ));
    } else if (e.touches.length === 1 && panStateRef.current) {
      const ps = panStateRef.current;
      const dx = e.touches[0].clientX - ps.startX;
      const dy = e.touches[0].clientY - ps.startY;
      if (!ps.moved && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
        ps.moved = true;
        setActivelyPanning(ps.slotId);
      }
      if (ps.moved) {
        const layout = computeImageLayout(ps.containerW, ps.containerH, ps.imgW, ps.imgH,
          { zoom: ps.zoom, fx: ps.baseFx, fy: ps.baseFy });
        const newFx = clamp(ps.baseFx + dx / layout.halfX, -1, 1);
        const newFy = clamp(ps.baseFy + dy / layout.halfY, -1, 1);
        setPhotoSlots(prev => prev.map(s =>
          s.id === ps.slotId ? { ...s, transform: { ...s.transform, fx: newFx, fy: newFy } } : s
        ));
      }
    }
  };

  const handleSlotTouchEnd = () => {
    panStateRef.current = null;
    pinchStateRef.current = null;
    setActivelyPanning(null);
  };

  const handleImgLoad = (slotId: number, imgEl: HTMLImageElement) => {
    if (!imgEl.naturalWidth || !imgEl.naturalHeight) return;
    setPhotoSlots(prev => prev.map(s =>
      s.id === slotId && (s.imgW !== imgEl.naturalWidth || s.imgH !== imgEl.naturalHeight)
        ? { ...s, imgW: imgEl.naturalWidth, imgH: imgEl.naturalHeight }
        : s
    ));
  };

  const stickerCategories = [
    { name: "Ekspresi", icon: "🤩" },
    { name: "Love", icon: "❤️" },
    { name: "Alam", icon: "🏞️" },
    { name: "Party", icon: "🎉" },
    { name: "Teks", icon: "🔠" }
  ];

  const stickersMap: Record<string, string[]> = {
    "Ekspresi": ["😊", "😎", "😂", "😍", "🤔", "😴", "🥳", "😭", "🥺", "😡", "🤫", "🤯"],
    "Love": ["❤️", "💖", "💕", "💔", "💌", "💘", "💝", "💞", "🫶", "💋"],
    "Alam": ["🌸", "🍀", "🌻", "🍁", "🍄", "🌎", "🌙", "⭐", "🌈", "⚡"],
    "Party": ["🎉", "🎈", "🎊", "🎁", "🍾", "🥂", "🎂", "🎇", "🪩", "✨"],
    "Teks": ["OMG", "WOW", "YAY", "COOL", "LOL", "SWAG", "LIT", "BFF", "BEST", "VIBE"]
  };

  const handleFilterSelect = (name: string) => { setSelectedFilter(name.toUpperCase()); setIsBefore(false); };
  const handleIntensityChange = (val: number) => { setFilterIntensity(val); setIsBefore(false); };

  // 🎯 Drag from grid → drop di frame
  const LONG_PRESS_MS = 300;
  const DRAG_MOVE_THRESHOLD = 5;

  const startStickerDrag = (
    e: React.MouseEvent | React.TouchEvent,
    emoji: string
  ) => {
    const isTouch = 'touches' in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    dragStartPosRef.current = { x: clientX, y: clientY };
    dragActiveRef.current = false;

    // Long press timer — activate drag mode kalo hold 300ms
    dragLongPressRef.current = setTimeout(() => {
      if (dragStartPosRef.current) {
        setDraggingEmoji(emoji);
        setDragPos({ x: dragStartPosRef.current.x, y: dragStartPosRef.current.y });
        dragActiveRef.current = true;
      }
    }, LONG_PRESS_MS);
  };

  const cancelStickerDrag = useCallback(() => {
    if (dragLongPressRef.current) {
      clearTimeout(dragLongPressRef.current);
      dragLongPressRef.current = null;
    }
    dragStartPosRef.current = null;
    dragActiveRef.current = false;
    setDraggingEmoji(null);
    setDragPos(null);
  }, []);

  const onStickerGridDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const isTouch = 'touches' in e;
    if (isTouch && (e as TouchEvent).touches.length === 0) return;
    const clientX = isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

    // Kalo drag belum active (belum lewat long press), cek kalo user geser jauh → cancel drag intent
    if (!dragActiveRef.current && dragStartPosRef.current) {
      const dx = Math.abs(clientX - dragStartPosRef.current.x);
      const dy = Math.abs(clientY - dragStartPosRef.current.y);
      if (dx > DRAG_MOVE_THRESHOLD || dy > DRAG_MOVE_THRESHOLD) {
        cancelStickerDrag();
      }
      return;
    }

    // Drag active → update posisi ghost + prevent default (biar gak scroll)
    if (dragActiveRef.current) {
      if (isTouch) e.preventDefault();
      setDragPos({ x: clientX, y: clientY });
    }
  }, [cancelStickerDrag]);

  const onStickerGridDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    // Kalo drag gak active → tap fallback, biarin onClick fire, cukup cleanup
    if (!dragActiveRef.current) {
      if (dragLongPressRef.current) {
        clearTimeout(dragLongPressRef.current);
        dragLongPressRef.current = null;
      }
      dragStartPosRef.current = null;
      return;
    }

    // Drag active → cek drop position
    let clientX: number, clientY: number;
    if ('changedTouches' in e && (e as TouchEvent).changedTouches.length > 0) {
      clientX = (e as TouchEvent).changedTouches[0].clientX;
      clientY = (e as TouchEvent).changedTouches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    } else {
      cancelStickerDrag();
      return;
    }

    // Cek apakah drop di dalam frame preview
    if (frameRef.current && draggingEmoji) {
      const rect = frameRef.current.getBoundingClientRect();
      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (inside) {
        // Convert ke persentase relatif ke frame
        const xPct = ((clientX - rect.left) / rect.width) * 100;
        const yPct = ((clientY - rect.top) / rect.height) * 100;

        setIsBefore(false);
        setPlacedStickers(prev => [
          ...prev,
          { id: Date.now(), x: xPct, y: yPct, size: 60, rotation: 0, emoji: draggingEmoji }
        ]);
      }
    }

    cancelStickerDrag();
  }, [draggingEmoji, cancelStickerDrag]);

  // Global listeners untuk drag sticker dari grid
  useEffect(() => {
    window.addEventListener("mousemove", onStickerGridDragMove);
    window.addEventListener("mouseup", onStickerGridDragEnd);
    window.addEventListener("touchmove", onStickerGridDragMove, { passive: false });
    window.addEventListener("touchend", onStickerGridDragEnd);
    window.addEventListener("touchcancel", cancelStickerDrag);
    return () => {
      window.removeEventListener("mousemove", onStickerGridDragMove);
      window.removeEventListener("mouseup", onStickerGridDragEnd);
      window.removeEventListener("touchmove", onStickerGridDragMove);
      window.removeEventListener("touchend", onStickerGridDragEnd);
      window.removeEventListener("touchcancel", cancelStickerDrag);
    };
  }, [onStickerGridDragMove, onStickerGridDragEnd, cancelStickerDrag]);

  const addSticker = (emoji: string) => {
    setIsBefore(false);
    setPlacedStickers(prev => [...prev, { id: Date.now(), x: 50, y: 50, size: 60, rotation: 0, emoji }]);
  };
  const removeSticker = (id: number) => setPlacedStickers(prev => prev.filter(s => s.id !== id));

  const applyPreset = (preset: string) => {
    setIsBefore(false);
    const findFilter = (keyword: string) => {
      const found = dbFilters.find(f => f.name.toUpperCase().includes(keyword.toUpperCase()));
      return found ? found.name.toUpperCase() : keyword.toUpperCase();
    };
    if (preset === 'FAMILY') { setSelectedFilter(findFilter('WARM')); setFilterIntensity(80); addSticker("👨‍👩‍👧‍👦"); }
    else if (preset === 'PARTY') { setSelectedFilter(findFilter('VIVID')); setFilterIntensity(100); addSticker("🎉"); }
    else if (preset === 'CINEMA') { setSelectedFilter(findFilter('DRAMA')); setFilterIntensity(95); addSticker("🎬"); }
    else if (preset === 'VINTAGE') { setSelectedFilter(findFilter('VINTAGE')); setFilterIntensity(90); addSticker("📻"); }
  };

  const handleLanjut = () => {
    saveStateToSession();
    router.push(`/result?txn=${txn}`);
  };

  const getFilterCSS = () => {
    if (isBefore || selectedFilter === "ORIGINAL") return "none";
    const filterObj = dbFilters.find(f => f.name.toUpperCase() === selectedFilter);
    if (!filterObj || !filterObj.css || filterObj.css === "none") return "none";
    return filterObj.css;
  };
  const getFilterOpacity = () => (isBefore || selectedFilter === "ORIGINAL") ? 1 : filterIntensity / 100;

  const onStartAction = (e: React.MouseEvent, s: PlacedSticker, type: "move" | "resize" | "rotate") => {
    e.stopPropagation(); e.preventDefault();
    dragInfo.current = { id: s.id, type, startX: e.clientX, startY: e.clientY, startSize: s.size, startLeft: s.x, startTop: s.y, startRotation: s.rotation };
  };
  const onGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!dragInfo.current || !frameRef.current) return;
    const info = dragInfo.current;
    const frameRect = frameRef.current.getBoundingClientRect();
    if (info.type === "move") {
      const dx = ((e.clientX - info.startX) / frameRect.width) * 100;
      const dy = ((e.clientY - info.startY) / frameRect.height) * 100;
      setPlacedStickers(prev => prev.map(s => s.id === info.id ? { ...s, x: info.startLeft + dx, y: info.startTop + dy } : s));
    } else if (info.type === "resize") {
      const dx = e.clientX - info.startX;
      const dy = e.clientY - info.startY;
      const newSize = Math.max(30, Math.min(150, info.startSize + Math.max(dx, dy)));
      setPlacedStickers(prev => prev.map(s => s.id === info.id ? { ...s, size: newSize } : s));
    } else if (info.type === "rotate") {
      const stickerEl = document.getElementById(`sticker-${info.id}`);
      if (stickerEl) {
        const rect = stickerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        setPlacedStickers(prev => prev.map(s => s.id === info.id ? { ...s, rotation: angle * (180 / Math.PI) + 90 } : s));
      }
    }
  }, []);
  const onGlobalMouseUp = useCallback(() => { dragInfo.current = null; }, []);
  useEffect(() => {
    window.addEventListener("mousemove", onGlobalMouseMove);
    window.addEventListener("mouseup", onGlobalMouseUp);
    return () => { window.removeEventListener("mousemove", onGlobalMouseMove); window.removeEventListener("mouseup", onGlobalMouseUp); };
  }, [onGlobalMouseMove, onGlobalMouseUp]);

  if (loading) {
    return (
      <main className="relative flex h-screen flex-col items-center justify-center" style={{ backgroundColor: '#E3D5D5' }}>
        <p className="font-inter font-semibold text-[24px] text-[#395350]">Memuat editor filter...</p>
      </main>
    );
  }
  if (errorMsg) {
    return (
      <main className="relative flex h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: '#E3D5D5' }}>
        <div className="bg-white rounded-[18px] shadow-lg p-10 text-center max-w-[500px]">
          <h1 className="font-inter font-bold text-[32px] text-[#332C2C] mb-3">Gagal Memuat</h1>
          <p className="font-inter text-[16px] text-[#6F6F6F] mb-6">{errorMsg}</p>
          <button onClick={() => router.push(txn ? `/print-preview?txn=${txn}` : "/pilih-paket")} 
          className="bg-white [#38635A] text-white px-6 py-3 rounded-full font-bold text-[16px] hover:bg-[#2c4e47] transition-colors">← Kembali</button>      
        </div>
      </main>
    );
  }

  const filterButtons = dbFilters.length > 0 ? dbFilters.map(f => f.name.toUpperCase()) : ["ORIGINAL"];

  const MAX_W = 400;
  const MAX_H = 600;
  let dispW = MAX_W;
  let dispH = MAX_W / frameAspect;
  if (dispH > MAX_H) { dispH = MAX_H; dispW = MAX_H * frameAspect; }

  // 🎯 Frame rect untuk drop zone highlight (dihitung real-time)
  const frameRect = frameRef.current?.getBoundingClientRect();

  return (
    <main className="relative flex h-screen flex-col items-center pt-4 overflow-hidden select-none" style={{ backgroundColor: '#E3D5D5' }}>

      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex flex-shrink-0">
        <div className="h-full w-[95%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
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

      <div className="w-full flex justify-center items-center mt-6 mb-6 z-10 px-4 relative flex-shrink-0">
        <div className="flex flex-col items-center">
          <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">Sentuhan Akhir</p>
          <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">Filter & Stiker</h1>
        </div>
      </div>

      <div className="w-full max-w-[1500px] flex-1 flex flex-row gap-16 justify-center px-4 md:px-8 overflow-hidden pb-2">

        <div className="flex flex-col items-center flex-shrink-0 h-full z-50 w-[480px] relative">

          <div className="w-[200px] h-[44px] bg-[#393B3A] border-[1px] border-[#ACFFC1] rounded-[19.5px] flex relative shadow-sm mb-3 self-center overflow-hidden shrink-0">
            <div className="absolute top-1/2 -translate-y-1/2 h-[34px] w-[95px] bg-[#FFA600] rounded-[14px] transition-all duration-300 pointer-events-none" style={{ left: isBefore ? '5px' : '98px' }} />
            <button onClick={() => setIsBefore(true)} className={`flex-1 flex items-center justify-center z-10 font-inter font-bold italic text-[14px] transition-colors ${isBefore ? 'text-[#343030]' : 'text-[#6A6868]'}`}>SEBELUM</button>
            <button onClick={() => setIsBefore(false)} className={`flex-1 flex items-center justify-center z-10 font-inter font-bold italic text-[14px] transition-colors ${!isBefore ? 'text-[#343030]' : 'text-[#6A6868]'}`}>SESUDAH</button>
          </div>

          <p className="font-hind font-medium text-[12px] text-[#5A7470] tracking-[-0.04em] leading-tight italic mb-2 text-center px-4">
            ✥ Geser foto untuk atur posisi · tahan stiker, lalu drag ke sini
          </p>

          <div className="relative shrink-0">
            <div className="bg-white border-[1.5px] border-[#54868A] rounded-[24px] flex items-center justify-center shadow-md p-4" style={{ width: `${dispW + 40}px`, height: `${dispH + 40}px` }}>
              <div className="bg-[#545151] border-[1.5px] border-[#54868A] rounded-[11px] flex items-center justify-center relative overflow-hidden" style={{ width: `${dispW}px`, height: `${dispH}px` }}>
                <div ref={frameRef} className="relative w-full h-full">

                  <div className="absolute inset-0 z-10 transition-all duration-300" style={{ filter: getFilterCSS(), opacity: getFilterOpacity(), ...overlayStyle }}>
                    {photoSlots.map((slot) => {
                      const isPanning = activelyPanning === slot.id;
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
                          onMouseDown={(e) => handleSlotMouseDown(e, slot)}
                          onWheel={(e) => handleSlotWheel(e, slot)}
                          onTouchStart={(e) => handleSlotTouchStart(e, slot)}
                          onTouchMove={(e) => handleSlotTouchMove(e, slot)}
                          onTouchEnd={handleSlotTouchEnd}
                          className={`w-full h-full bg-[#979797] overflow-hidden flex items-center justify-center relative ${slot.photo ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""}`}
                          style={{ touchAction: slot.photo ? "none" : "auto" }}
                        >
                          {slot.photo ? (
                            <img
                              src={slot.photo}
                              onLoad={(e) => handleImgLoad(slot.id, e.currentTarget)}
                              style={haveLayout ? imgStyle : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
                              draggable={false}
                              alt="Slot"
                            />
                          ) : (
                            <span className="text-[#264E45] font-hind font-bold text-[36px] opacity-30">{slot.id}</span>
                          )}

                          {slot.photo && isZoomed && (
                            <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md pointer-events-none flex items-center gap-1">
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

                  {framePath && (
                    <img
                      src={framePath}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) setFrameAspect(img.naturalWidth / img.naturalHeight);
                      }}
                      className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none"
                      alt="Frame"
                    />
                  )}

                  <div className="absolute inset-0 z-30 pointer-events-none">
                    {!isBefore && placedStickers.map(s => (
                      <div key={s.id} id={`sticker-${s.id}`} className="absolute pointer-events-auto select-none group" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}px`, height: `${s.size}px`, transform: `translate(-50%, -50%) rotate(${s.rotation}deg)` }}>
                        <div className="w-full h-full border-2 border-transparent group-hover:border-[#00FFA2] flex items-center justify-center cursor-grab active:cursor-grabbing" onMouseDown={(e) => onStartAction(e, s, "move")}>
                          {s.emoji.length > 2 ? <span style={{ fontSize: `${s.size * 0.4}px`, fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{s.emoji}</span> : <span style={{ fontSize: `${s.size * 0.8}px` }}>{s.emoji}</span>}
                        </div>
                        <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 w-6 h-6 bg-[#00FFA2] rounded-full cursor-alias opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md" onMouseDown={(e) => onStartAction(e, s, "rotate")}><span className="text-[12px] text-black">⟳</span></div>
                        <div className="absolute bottom-[-5px] right-[-5px] w-5 h-5 bg-[#00FFA2] rounded-sm cursor-nwse-resize opacity-0 group-hover:opacity-100 shadow-md" onMouseDown={(e) => onStartAction(e, s, "resize")} />
                        <button onClick={(e) => { e.stopPropagation(); removeSticker(s.id) }} className="absolute top-[-15px] left-[-15px] w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[12px] text-white opacity-0 group-hover:opacity-100 shadow-md">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {selectedFilter === "ORIGINAL" && (
              <div className="absolute top-[45%] -right-[95px] bg-[#624E38] border-[1.5px] border-[#CCAE19] px-3 py-1.5 rounded-full shadow-md z-50 flex items-center gap-1.5 animate-fade-in">
                <span className="text-[#F6AA06] text-[16px] leading-none pt-0.5">★</span>
                <span className="font-inter font-bold text-white text-[13px]">Original</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 w-[856px] flex-shrink-0 h-full relative z-40">
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pr-2 pb-4">

            <div className="w-full flex-shrink-0 bg-white border-[1.5px] border-[#54868A] rounded-[17px] p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center px-2 mb-4">
                <h2 className="font-inter font-bold text-[25px] tracking-[-0.05em] text-[#434343] leading-none uppercase">Filter</h2>
                <span className="font-hind font-semibold text-[18px] tracking-[-0.08em] text-[#3E8C7B]">{filterButtons.length} Pilihan</span>
              </div>
              <div className="grid grid-cols-3 gap-x-6 gap-y-4 px-2">
                {filterButtons.map(f => {
                  const isActive = selectedFilter === f;
                  return (
                    <button key={f} onClick={() => handleFilterSelect(f)} className={`w-full h-[40px] rounded-[20px] border-[1.5px] font-inter font-bold italic text-[16px] tracking-[-0.02em] transition-all flex items-center justify-center shadow-sm ${isActive ? "bg-[#499F84] text-white border-[#54868A]" : "bg-white text-[#585858] border-[#54868A] hover:bg-[#F5F5F5]"}`}>
                      {isActive && f === "ORIGINAL" && <span className="mr-2 text-white">★</span>}
                      {f}
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-col gap-2 mt-6 px-2 pb-2">
                <div className="flex justify-between items-end">
                  <span className="font-inter font-bold text-[23px] text-[#434343] tracking-[-0.05em]">Intensitas Filter</span>
                  <span className="font-inter font-bold text-[18px] text-[#BF7D32] tracking-[-0.05em]">{filterIntensity} %</span>
                </div>
                <div className="relative w-full h-[40px] flex items-center mt-2">
                  <div className="absolute w-full h-[20px] rounded-[80px] top-1/2 -translate-y-1/2" style={{ background: 'linear-gradient(90deg, #442C18 0%, #FF9100 100%)' }}></div>
                  <div className="absolute w-[40px] h-[40px] bg-[#F3AF6F] border-[2px] border-black rounded-full pointer-events-none z-10 shadow-md top-0" style={{ left: `calc(${filterIntensity}% - 20px)` }}></div>
                  <input type="range" min="0" max="100" value={filterIntensity} onChange={(e) => handleIntensityChange(Number(e.target.value))} className="w-full h-full absolute opacity-0 cursor-pointer z-20 m-0 p-0" />
                </div>
              </div>
            </div>

            <div className="w-full h-[351px] flex-shrink-0 bg-white border-[1.5px] border-[#54868A] rounded-[17px] p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center px-2 mb-4">
                <h2 className="font-inter font-bold text-[25px] tracking-[-0.05em] text-[#434343] leading-none uppercase">STIKER</h2>
                <span className="font-hind font-semibold text-[18px] tracking-[-0.08em] text-[#3E8C7B]">
                  {placedStickers.length} terpasang · {draggingEmoji ? "🎯 lepas di frame" : "Tap stiker atau tahan lalu drag ke frame"}
                </span>
              </div>
              <div className="flex gap-4 px-2 mb-4">
                {stickerCategories.map(cat => {
                  const isActive = stickerCategory === cat.name;
                  return (
                    <button key={cat.name} onClick={() => setStickerCategory(cat.name)} className={`w-[120px] h-[36px] rounded-[20px] border-[1.5px] border-[#54868A] font-inter font-bold italic text-[14px] tracking-[-0.02em] transition-all flex items-center justify-center gap-2 shadow-sm ${isActive ? "bg-[#499F84] text-white" : "bg-white text-[#585858] hover:bg-gray-50"}`}>
                      <span>{cat.icon}</span> {cat.name}
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-1 overflow-hidden px-2 gap-4">
                <div ref={scrollRef} onScroll={() => setScrollProgress(scrollRef.current ? scrollRef.current.scrollTop / (scrollRef.current.scrollHeight - scrollRef.current.clientHeight) : 0)} className="flex-1 grid grid-cols-5 gap-4 overflow-y-auto no-scrollbar content-start pb-2">
                  {stickersMap[stickerCategory].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => addSticker(s)}
                      onMouseDown={(e) => startStickerDrag(e, s)}
                      onTouchStart={(e) => startStickerDrag(e, s)}
                      className="w-[120px] h-[120px] bg-white border-[1.5px] border-[#54868A] rounded-[20px] text-5xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                      style={{ touchAction: 'none' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="w-[14px] h-full bg-[#7A7A7A] rounded-[69px] relative flex justify-center py-1 flex-shrink-0">
                  <div className="w-[14px] h-[80px] bg-[#51B4AF] rounded-[69px] absolute transition-all duration-75" style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 80}px)` }} />
                </div>
              </div>
            </div>

            <div className="w-full h-[453px] flex-shrink-0 bg-white border-[1.5px] border-[#54868A] rounded-[17px] p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center px-2 mb-6">
                <h2 className="font-inter font-bold text-[25px] tracking-[-0.05em] text-[#434343] leading-none uppercase">PRESET COMBO</h2>
                <span className="font-hind font-semibold text-[18px] tracking-[-0.08em] text-[#3E8C7B]">4 option ready</span>
              </div>
              <div className="grid grid-cols-2 gap-4 px-2 flex-1">
                <button onClick={() => applyPreset('FAMILY')} className="w-full h-[155px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-3 flex flex-col cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform shadow-sm group text-left">
                  <div className="w-full h-[66px] rounded-[16px] mb-3 opacity-90 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #FED2A3 0%, #FDB68A 100%)' }}></div>
                  <div className="px-2 flex flex-col justify-center">
                    <h4 className="font-inter font-bold text-[20px] tracking-[-0.05em] text-[#434343] leading-none flex items-center gap-2"><span className="text-lg">👨‍👩‍👧‍👦</span> FAMILY</h4>
                    <p className="font-inter font-normal text-[14px] tracking-[-0.05em] text-[#434343] mt-1">Warm + Soft + Love stickers</p>
                  </div>
                </button>
                <button onClick={() => applyPreset('PARTY')} className="w-full h-[155px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-3 flex flex-col cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform shadow-sm group text-left">
                  <div className="w-full h-[66px] rounded-[16px] mb-3 opacity-90 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #F8B2DA 0%, #BE8FF8 100%)' }}></div>
                  <div className="px-2 flex flex-col justify-center">
                    <h4 className="font-inter font-bold text-[20px] tracking-[-0.05em] text-[#434343] leading-none flex items-center gap-2"><span className="text-lg">🎉</span> PARTY</h4>
                    <p className="font-inter font-normal text-[14px] tracking-[-0.05em] text-[#434343] mt-1">Vivid + Party stickers</p>
                  </div>
                </button>
                <button onClick={() => applyPreset('CINEMA')} className="w-full h-[155px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-3 flex flex-col cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform shadow-sm group text-left">
                  <div className="w-full h-[66px] rounded-[16px] mb-3 opacity-90 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #556A69 0%, #293933 100%)' }}></div>
                  <div className="px-2 flex flex-col justify-center">
                    <h4 className="font-inter font-bold text-[20px] tracking-[-0.05em] text-[#434343] leading-none flex items-center gap-2"><span className="text-lg">🎬</span> CINEMA</h4>
                    <p className="font-inter font-normal text-[14px] tracking-[-0.05em] text-[#434343] mt-1">Drama + Vignette</p>
                  </div>
                </button>
                <button onClick={() => applyPreset('VINTAGE')} className="w-full h-[155px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-3 flex flex-col cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform shadow-sm group text-left">
                  <div className="w-full h-[66px] rounded-[16px] mb-3 opacity-90 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #CF9F5E 0%, #957445 100%)' }}></div>
                  <div className="px-2 flex flex-col justify-center">
                    <h4 className="font-inter font-bold text-[20px] tracking-[-0.05em] text-[#434343] leading-none flex items-center gap-2"><span className="text-lg">📻</span> VINTAGE</h4>
                    <p className="font-inter font-normal text-[14px] tracking-[-0.05em] text-[#434343] mt-1">Sepia + Film grain</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      <div className="w-full flex justify-center items-center shrink-0 py-3 px-4 z-50">
        <button onClick={handleLanjut} className="flex items-center justify-center gap-3 w-[265px] h-[53px] bg-[#3A9F86] border-3 border-[#E3D5D5] rounded-[23px] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer">
          <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em]">Lanjut</span>
          <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </div>
        </button>
      </div>

      {/* 🎯 Ghost sticker follow cursor pas drag */}
      {draggingEmoji && dragPos && (
        <div
          className="fixed pointer-events-none z-[9999] flex items-center justify-center"
          style={{
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
            width: '60px',
            height: '60px',
            transform: 'translate(-50%, -50%)',
            opacity: 0.6,
          }}
        >
          {draggingEmoji.length > 2 ? (
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {draggingEmoji}
            </span>
          ) : (
            <span style={{ fontSize: '48px' }}>{draggingEmoji}</span>
          )}
        </div>
      )}

      {/* Highlight frame drop zone pas drag */}
      {draggingEmoji && frameRect && (
        <div className="fixed inset-0 pointer-events-none z-[9998]">
          <div
            className="absolute border-4 border-dashed border-[#00FFA2] rounded-[11px] animate-pulse"
            style={{
              left: `${frameRect.left}px`,
              top: `${frameRect.top}px`,
              width: `${frameRect.width}px`,
              height: `${frameRect.height}px`,
            }}
          />
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,700&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </main>
  );
}

export default function FilterStickerPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#E3D5D5]">Loading...</div>}>
      <FilterStickerContent />
    </Suspense>
  );
}