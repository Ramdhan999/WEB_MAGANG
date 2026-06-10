"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = "http://localhost:8080";

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

interface SlotState {
  id: number;
  photo: string | null;
}

function FilterStickerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txn = searchParams.get('txn') || "";

  // ===== DATA DARI DB =====
  const [framePath, setFramePath] = useState<string>("");
  const [overlayStyle, setOverlayStyle] = useState<any>({});
  const [photoSlots, setPhotoSlots] = useState<SlotState[]>([]);
  const [dbFilters, setDbFilters] = useState<ApiFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ===== STATE FILTER & STIKER (preserve) =====
  const [selectedFilter, setSelectedFilter] = useState("ORIGINAL");
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [isBefore, setIsBefore] = useState(true);
  const [stickerCategory, setStickerCategory] = useState("Ekspresi");
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ id: number; type: "move" | "resize" | "rotate"; startX: number; startY: number; startSize: number; startLeft: number; startTop: number; startRotation: number; } | null>(null);

  // ===== FETCH SEMUA DATA: session+template (frame), filters =====
  useEffect(() => {
    const fetchData = async () => {
      if (!txn) {
        setErrorMsg("Transaksi tidak valid. Mulai dari awal lagi.");
        setLoading(false);
        return;
      }

      try {
        // 1. Ambil session + template (buat frame & overlay config)
        const resSession = await fetch(`${BACKEND_URL}/api/photo-session/by-transaction/${txn}`);
        const sessionData = await resSession.json();

        if (!resSession.ok) {
          setErrorMsg(sessionData.error || "Sesi tidak ditemukan");
          setLoading(false);
          return;
        }

        const template = sessionData.template;
        const slotCount = template?.slot_count || 4;

        // Set frame PNG path
        if (template?.frame_path) setFramePath(template.frame_path);

        // Build overlay style dari config DB (sama kayak print-preview)
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

        // 2. Ambil slot arrangement dari sessionStorage (di-set di print-preview)
        let slots: SlotState[] = [];
        try {
          const saved = sessionStorage.getItem("arranged_slots");
          if (saved) {
            slots = JSON.parse(saved);
          }
        } catch (e) { }

        // Fallback: kalo gak ada arrangement, pake foto dari DB urut
        if (!slots || slots.length === 0) {
          const photos = sessionData.session?.photos || [];
          slots = Array.from({ length: slotCount }).map((_, i) => ({
            id: i + 1,
            photo: photos[i]?.photo_path || null,
          }));
        }
        setPhotoSlots(slots);

        // 3. Ambil filter aktif dari DB
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

  const handleFilterSelect = (name: string) => {
    setSelectedFilter(name.toUpperCase());
    setIsBefore(false);
  };

  const handleIntensityChange = (val: number) => {
    setFilterIntensity(val);
    setIsBefore(false);
  };

  const addSticker = (emoji: string) => {
    setIsBefore(false);
    setPlacedStickers(prev => [...prev, { id: Date.now(), x: 50, y: 50, size: 60, rotation: 0, emoji }]);
  };

  const removeSticker = (id: number) => {
    setPlacedStickers(prev => prev.filter(s => s.id !== id));
  };

  const applyPreset = (preset: string) => {
    setIsBefore(false);
    // Cari filter di DB yang namanya match preset, fallback ke nama langsung
    const findFilter = (keyword: string) => {
      const found = dbFilters.find(f => f.name.toUpperCase().includes(keyword.toUpperCase()));
      return found ? found.name.toUpperCase() : keyword.toUpperCase();
    };

    if (preset === 'FAMILY') {
      setSelectedFilter(findFilter('WARM')); setFilterIntensity(80); addSticker("👨‍👩‍👧‍👦");
    } else if (preset === 'PARTY') {
      setSelectedFilter(findFilter('VIVID')); setFilterIntensity(100); addSticker("🎉");
    } else if (preset === 'CINEMA') {
      setSelectedFilter(findFilter('DRAMA')); setFilterIntensity(95); addSticker("🎬");
    } else if (preset === 'VINTAGE') {
      setSelectedFilter(findFilter('VINTAGE')); setFilterIntensity(90); addSticker("📻");
    }
  };

  const handleLanjut = () => {
    // Simpen pilihan filter/sticker buat dibawa ke /result (atau cetak)
    const selectedFilterObj = dbFilters.find(f => f.name.toUpperCase() === selectedFilter);
    sessionStorage.setItem("applied_filter", selectedFilter);
    sessionStorage.setItem("applied_filter_css", selectedFilterObj?.css || "none");
    sessionStorage.setItem("filter_intensity", filterIntensity.toString());
    sessionStorage.setItem("applied_stickers", JSON.stringify(placedStickers));
    router.push(`/result?txn=${txn}`);
  };

  // ===== APPLY FILTER CSS DARI DB =====
  const getFilterCSS = () => {
    if (isBefore || selectedFilter === "ORIGINAL") return "none";

    // Cari CSS dari DB filter
    const filterObj = dbFilters.find(f => f.name.toUpperCase() === selectedFilter);
    if (!filterObj || !filterObj.css || filterObj.css === "none") return "none";

    // Apply intensity via opacity-like scaling — kita bungkus pake CSS langsung
    // Karena CSS filter string dari admin udah lengkap, intensity di-handle via wrapper opacity
    return filterObj.css;
  };

  // Intensity di-apply sebagai opacity layer (karena CSS string dari DB gak bisa di-scale per-fungsi)
  const getFilterOpacity = () => {
    if (isBefore || selectedFilter === "ORIGINAL") return 1;
    return filterIntensity / 100;
  };

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

  // ===== LOADING / ERROR STATES =====
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
          <button
            onClick={() => router.push(txn ? `/print-preview?txn=${txn}` : "/pilih-paket")}
            className="bg-[#38635A] text-white px-6 py-3 rounded-full font-bold text-[16px] hover:bg-[#2c4e47] transition-colors"
          >
            ← Kembali
          </button>
        </div>
      </main>
    );
  }

  // List filter buat tombol (dari DB)
  const filterButtons = dbFilters.length > 0 ? dbFilters.map(f => f.name.toUpperCase()) : ["ORIGINAL"];

  return (
    <main className="relative flex h-screen flex-col items-center pt-4 overflow-hidden select-none" style={{ backgroundColor: '#E3D5D5' }}>

      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex flex-shrink-0">
        <div className="h-full w-[95%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow bg-[#151515]"></div>
      </div>

      <div className="w-full flex justify-center items-center mt-6 mb-6 z-10 px-4 relative flex-shrink-0">
        <div className="flex flex-col items-center">
          <p className="font-hind font-semibold text-[28px] text-[#37786D] tracking-[-0.1em] leading-none text-center mb-1">Sentuhan Akhir</p>
          <h1 className="font-inter font-bold text-[64px] text-[#332C2C] tracking-[-0.06em] leading-[77px]">Filter & Stiker</h1>
        </div>
      </div>

      <div className="w-full max-w-[1500px] flex-1 flex flex-row gap-16 justify-center px-4 md:px-8 overflow-hidden pb-2">

        {/* === SISI KIRI: PREVIEW FRAME === */}
        <div className="flex flex-col items-center flex-shrink-0 h-full z-50 w-[480px] relative">

          <div className="w-[200px] h-[44px] bg-[#393B3A] border-[1px] border-[#ACFFC1] rounded-[19.5px] flex relative shadow-sm mb-4 self-center overflow-hidden shrink-0">
            <div className="absolute top-1/2 -translate-y-1/2 h-[34px] w-[95px] bg-[#FFA600] rounded-[14px] transition-all duration-300 pointer-events-none" style={{ left: isBefore ? '5px' : '98px' }} />
            <button onClick={() => setIsBefore(true)} className={`flex-1 flex items-center justify-center z-10 font-inter font-bold italic text-[14px] transition-colors ${isBefore ? 'text-[#343030]' : 'text-[#6A6868]'}`}>SEBELUM</button>
            <button onClick={() => setIsBefore(false)} className={`flex-1 flex items-center justify-center z-10 font-inter font-bold italic text-[14px] transition-colors ${!isBefore ? 'text-[#343030]' : 'text-[#6A6868]'}`}>SESUDAH</button>
          </div>

          <div className="relative shrink-0">
            <div className="w-[440px] h-[660px] bg-white border-[1.5px] border-[#54868A] rounded-[24px] flex items-center justify-center shadow-md p-4">
              <div className="w-[400px] h-[600px] bg-[#545151] border-[1.5px] border-[#54868A] rounded-[11px] flex items-center justify-center relative overflow-hidden">
                <div ref={frameRef} className="relative w-full h-full">

                  {/* SLOT FOTO + FILTER (filter di-apply ke layer foto) */}
                  <div className="absolute inset-0 z-10 transition-all duration-300" style={{ filter: getFilterCSS(), opacity: getFilterOpacity(), ...overlayStyle }}>
                    {photoSlots.map((slot, index) => (
                      <div key={index} className="w-full h-full bg-[#979797] overflow-hidden flex items-center justify-center">
                        {slot.photo ? <img src={slot.photo} className="w-full h-full object-cover" alt="Slot" /> : <span className="text-[#264E45] font-hind font-bold text-[36px] opacity-30">{index + 1}</span>}
                      </div>
                    ))}
                  </div>

                  {/* FRAME PNG (dari DB) */}
                  {framePath && (
                    <img src={framePath} className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none" alt="Frame" />
                  )}

                  {/* STIKER OVERLAY */}
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

        {/* === SISI KANAN: WORKSPACE === */}
        <div className="flex flex-col gap-6 w-[856px] flex-shrink-0 h-full relative z-40">
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pr-2 pb-4">

            {/* BOX 1: FILTER (dari DB) */}
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

            {/* BOX 2: STIKER */}
            <div className="w-full h-[351px] flex-shrink-0 bg-white border-[1.5px] border-[#54868A] rounded-[17px] p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center px-2 mb-4">
                <h2 className="font-inter font-bold text-[25px] tracking-[-0.05em] text-[#434343] leading-none uppercase">STIKER</h2>
                <span className="font-hind font-semibold text-[18px] tracking-[-0.08em] text-[#3E8C7B]">{placedStickers.length} stiker terpasang.</span>
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
                    <button key={i} onClick={() => addSticker(s)} className="w-[120px] h-[120px] bg-white border-[1.5px] border-[#54868A] rounded-[20px] text-5xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center">{s}</button>
                  ))}
                </div>
                <div className="w-[14px] h-full bg-[#7A7A7A] rounded-[69px] relative flex justify-center py-1 flex-shrink-0">
                  <div className="w-[14px] h-[80px] bg-[#51B4AF] rounded-[69px] absolute transition-all duration-75" style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 80}px)` }} />
                </div>
              </div>
            </div>

            {/* BOX 3: PRESET COMBO */}
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
          {/* TOMBOL NAVIGASI dipindah ke luar workspace column */}
        </div>

      </div>

      {/* === TOMBOL LANJUT — sibling content row, ke-center sejajar judul === */}
      <div className="w-full flex justify-center items-center shrink-0 py-3 px-4 z-50">
        <button
          onClick={handleLanjut}
          className="flex items-center justify-center gap-3 w-[265px] h-[53px] bg-[#3A9F86] border-3 border-[#E3D5D5] rounded-[23px] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em]">
            Lanjut
          </span>
          <div className="w-[24px] h-[24px] flex items-center justify-center rotate-180 invert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </div>
        </button>
      </div>

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