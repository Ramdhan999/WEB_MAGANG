"use client";

import React, { useState, useEffect, useRef } from "react";

const BACKEND_URL = "http://localhost:8080";

const LAYOUT_OPTIONS = [
  // ===== PHOTO STRIP (vertikal, 1 kolom) =====
  { label: "Photo Strip (2 foto)", defaultSlots: 2, defaultCols: 1 },
  { label: "Photo Strip (3 foto)", defaultSlots: 3, defaultCols: 1 },
  { label: "Photo Strip (4 foto)", defaultSlots: 4, defaultCols: 1 },
  { label: "Photo Strip (5 foto)", defaultSlots: 5, defaultCols: 1 },
  { label: "Photo Strip (6 foto)", defaultSlots: 6, defaultCols: 1 },

  // ===== GRID =====
  { label: "Grid (2 foto)", defaultSlots: 2, defaultCols: 2 },
  { label: "Grid (3 foto)", defaultSlots: 3, defaultCols: 3 },
  { label: "Grid (4 foto / 2x2)", defaultSlots: 4, defaultCols: 2 },
  { label: "Grid (5 foto)", defaultSlots: 5, defaultCols: 2 },
  { label: "Grid (6 foto / 3x2)", defaultSlots: 6, defaultCols: 3 },

  // ===== COLLAGE =====
  { label: "Collage (2 foto)", defaultSlots: 2, defaultCols: 2 },
  { label: "Collage (3 foto)", defaultSlots: 3, defaultCols: 2 },
  { label: "Collage (4 foto)", defaultSlots: 4, defaultCols: 2 },
  { label: "Collage (5 foto)", defaultSlots: 5, defaultCols: 2 },
  { label: "Collage (6 foto)", defaultSlots: 6, defaultCols: 2 },

  // ===== DUO (2 foto, pilih orientasi) =====
  { label: "Duo Kiri-Kanan (2 foto)", defaultSlots: 2, defaultCols: 2 },
  { label: "Duo Atas-Bawah (2 foto)", defaultSlots: 2, defaultCols: 1 },
];

const THEME_OPTIONS = ["Classic (Gold)", "Modern (Minimalist)", "Playful (Warna-warni)", "Dark Mode"];
const CATEGORY_OPTIONS = ["STRIP", "GRID", "COLLAGE", "DUO"];

const DEFAULT_OVERLAY = {
  overlay_top: 10,
  overlay_left: 10,
  overlay_right: 10,
  overlay_bottom: 10,
  overlay_gap: 4,
  overlay_cols: 1,
};

// ===== LIVE PREVIEW COMPONENT — pakai natural aspect ratio frame =====
function FramePreview({
  framePath,
  slotCount,
  overlayTop,
  overlayLeft,
  overlayRight,
  overlayBottom,
  overlayGap,
  overlayCols,
}: {
  framePath: string;
  slotCount: number;
  overlayTop: number;
  overlayLeft: number;
  overlayRight: number;
  overlayBottom: number;
  overlayGap: number;
  overlayCols: number;
}) {
  const [frameAspect, setFrameAspect] = useState<number>(0.42); // w/h default portrait

  const slots = Array.from({ length: slotCount || 0 }, (_, i) => i + 1);
  const cols = Math.max(1, Math.min(overlayCols || 1, 4));
  const rows = Math.ceil((slotCount || 1) / cols);

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: `${overlayTop}%`,
    left: `${overlayLeft}%`,
    right: `${overlayRight}%`,
    bottom: `${overlayBottom}%`,
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: `${overlayGap}%`,
  };

  // Hitung dimensi display (max 240w x 440h, preserve aspect)
  const MAX_W = 240;
  const MAX_H = 440;
  let dispW = MAX_W;
  let dispH = MAX_W / frameAspect;
  if (dispH > MAX_H) {
    dispH = MAX_H;
    dispW = MAX_H * frameAspect;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: `${dispW}px`, height: `${dispH}px` }}>
        {/* SLOT PLACEHOLDERS (z-10) */}
        <div style={overlayStyle} className="z-10">
          {slots.map((n) => (
            <div
              key={n}
              className="bg-yellow-200/90 border-2 border-dashed border-yellow-600 flex items-center justify-center text-yellow-800 font-bold text-[16px]"
            >
              {n}
            </div>
          ))}
        </div>

        {/* FRAME PNG (z-20) */}
        {framePath ? (
          <img
            src={framePath}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setFrameAspect(img.naturalWidth / img.naturalHeight);
              }
            }}
            alt="Frame preview"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-[11px] italic z-20 pointer-events-none border-2 border-dashed border-gray-400 rounded">
            <div className="bg-white/80 px-2 py-1 rounded text-center">Upload frame<br />PNG dulu</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FramePage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState("SEMUA");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");

  const [isCustomPNG, setIsCustomPNG] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/templates`);
      const data = await res.json();
      setTemplates(data || []);
    } catch (err) {
      console.error("Gagal load:", err);
      showToast("Gagal memuat data template", "error");
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates =
    activeTab === "SEMUA" ? templates : templates.filter((t) => t.category === activeTab);

  const handleAddClick = () => {
    setModalMode("add");
    setSelectedTemplate(null);
    setFormData({
      name: "",
      description: "",
      category: "STRIP",
      layout_type: LAYOUT_OPTIONS[0].label,
      theme: THEME_OPTIONS[0],
      frame_path: "",
      slot_count: LAYOUT_OPTIONS[0].defaultSlots,
      ...DEFAULT_OVERLAY,
      overlay_cols: LAYOUT_OPTIONS[0].defaultCols,
    });
    setIsCustomPNG(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleEditClick = (template: any) => {
    setModalMode("edit");
    setSelectedTemplate(template);
    setFormData({
  ...template,
  overlay_top: template.overlay_top ?? DEFAULT_OVERLAY.overlay_top,
  overlay_left: template.overlay_left ?? DEFAULT_OVERLAY.overlay_left,
  overlay_right: template.overlay_right ?? DEFAULT_OVERLAY.overlay_right,
  overlay_bottom: template.overlay_bottom ?? DEFAULT_OVERLAY.overlay_bottom,
  overlay_gap: template.overlay_gap ?? DEFAULT_OVERLAY.overlay_gap,
  overlay_cols: template.overlay_cols ?? DEFAULT_OVERLAY.overlay_cols,
});
    setIsCustomPNG(template.is_custom_png);
    setIsActive(template.is_active);
    setIsModalOpen(true);
  };

  const handleConfirmAction = (action: string, template: any) => {
    setConfirmAction(action);
    setSelectedTemplate(template);
    setIsConfirmOpen(true);
  };

  const handleLayoutChange = (e: any) => {
    const layoutLabel = e.target.value;
    const opt = LAYOUT_OPTIONS.find((l) => l.label === layoutLabel);
    setFormData((prev: any) => ({
      ...prev,
      layout_type: layoutLabel,
      slot_count: opt?.defaultSlots ?? prev.slot_count,
      overlay_cols: opt?.defaultCols ?? prev.overlay_cols,
    }));
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const numericFields = ["slot_count", "overlay_top", "overlay_left", "overlay_right", "overlay_bottom", "overlay_gap", "overlay_cols"];
    setFormData((prev: any) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) || 0 : value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran gambar maks 5MB", "error");
      return;
    }

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/upload`, {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev: any) => ({ ...prev, frame_path: data.url }));
        showToast("Frame berhasil diupload!", "success");
      } else {
        showToast(data.error || "Upload gagal", "error");
      }
    } catch (error) {
      showToast("Gagal upload gambar", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      showToast("Nama template wajib diisi", "error");
      return;
    }
    const slotCount = Number(formData.slot_count);
    if (!slotCount || slotCount < 1 || slotCount > 12) {
      showToast("Jumlah slot foto harus antara 1-12", "error");
      return;
    }
    if (isCustomPNG && !formData.frame_path) {
      showToast("Mode Frame PNG aktif, harus upload gambar dulu", "error");
      return;
    }

    try {
      const url =
        modalMode === "add"
          ? `${BACKEND_URL}/api/admin/templates`
          : `${BACKEND_URL}/api/admin/templates/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const payload = {
  ...formData,
  slot_count: slotCount,
  overlay_top: Number(formData.overlay_top) ?? DEFAULT_OVERLAY.overlay_top,
  overlay_left: Number(formData.overlay_left) ?? DEFAULT_OVERLAY.overlay_left,
  overlay_right: Number(formData.overlay_right) ?? DEFAULT_OVERLAY.overlay_right,
  overlay_bottom: Number(formData.overlay_bottom) ?? DEFAULT_OVERLAY.overlay_bottom,
  overlay_gap: Number(formData.overlay_gap) ?? DEFAULT_OVERLAY.overlay_gap,
  overlay_cols: Number(formData.overlay_cols) ?? 1,
  is_custom_png: isCustomPNG,
  is_active: isActive,
};

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchTemplates();
        showToast(
          modalMode === "add" ? "Template berhasil ditambahkan!" : "Template berhasil diupdate!",
          "success"
        );
      } else {
        let errorMsg = "Gagal menyimpan template";
        try {
          const errData = await res.json();
          errorMsg = errData.error || errData.message || errorMsg;
        } catch { }
        showToast(errorMsg, "error");
      }
    } catch (error) {
      showToast("Gagal konek ke server", "error");
    }
  };

  const executeAction = async () => {
    if (!selectedTemplate) {
      setIsConfirmOpen(false);
      return;
    }

    try {
      if (confirmAction === "Hapus") {
        const res = await fetch(`${BACKEND_URL}/api/admin/templates/${selectedTemplate.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchTemplates();
          showToast(`Template "${selectedTemplate.name}" berhasil dihapus`, "success");
        } else {
          showToast("Gagal menghapus template", "error");
        }
      } else {
        const newActiveState = !selectedTemplate.is_active;
        const res = await fetch(`${BACKEND_URL}/api/admin/templates/${selectedTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...selectedTemplate, is_active: newActiveState }),
        });
        if (res.ok) {
          await fetchTemplates();
          showToast(
            `Template "${selectedTemplate.name}" ${newActiveState ? "diaktifkan" : "dinonaktifkan"}`,
            "success"
          );
        } else {
          showToast("Gagal mengubah status template", "error");
        }
      }
    } catch (error) {
      showToast("Gagal konek ke server", "error");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen relative font-inter">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-[12px] shadow-2xl font-bold text-white text-[15px] flex items-center gap-3 animate-slide-in border-2 ${toast.type === "success" ? "bg-[#3F6E68] border-[#2c4e47]" : "bg-red-500 border-red-700"}`}
          style={{ minWidth: "300px" }}
        >
          <span className="text-[20px]">{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      <div className="bg-white border border-gray-300 rounded-[8px] p-6 mb-6 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-[36px] font-bold text-[#3A3A3A] leading-tight">Template & Frame</h1>
          <p className="text-[16px] text-[#646464] mt-1">
            Kelola layout dan template foto booth — perubahan langsung sinkron ke layar user
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-[#38635A] text-white px-6 py-2.5 rounded-[22px] font-bold text-[16px] flex items-center gap-2 hover:bg-[#2c4e47] transition-colors"
        >
          <span className="text-[20px] leading-none">+</span> Tambah Template
        </button>
      </div>

      <div className="flex gap-3 mb-8 flex-wrap">
        {["SEMUA", ...CATEGORY_OPTIONS].map((tab) => {
          const count =
            tab === "SEMUA" ? templates.length : templates.filter((t) => t.category === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 rounded-full font-bold text-[13px] border transition-colors flex items-center gap-2 ${activeTab === tab ? "bg-[#38635A] text-white border-transparent" : "bg-white text-[#3A3A3A] border-gray-400 hover:bg-gray-100"}`}
            >
              {tab}
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === tab ? "bg-white/20" : "bg-gray-200"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-4 bg-white border border-gray-300 rounded-[14px] p-10 text-center text-gray-400 font-bold">
            Belum ada template di kategori ini
          </div>
        ) : (
          filteredTemplates.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-[14px] border border-gray-300 shadow-sm">
              <div className="bg-[#ECF0EE] h-[220px] rounded-[10px] mb-4 border border-gray-300 relative overflow-hidden flex items-center justify-center">
                {t.frame_path ? (
                  <img src={t.frame_path} alt={t.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-gray-400 text-[14px] italic">No preview</span>
                )}
                <span className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-[12px] font-bold border border-gray-300 text-[#294B6C]">
                  {t.category || "Frame"}
                </span>
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[12px] font-bold ${t.is_active ? "bg-[#C9F2E0] text-[#5F6C66]" : "bg-[#E8CECE] text-[#3A3A3A]"}`}>
                  {t.is_active ? "Aktif" : "Nonaktif"}
                </span>
                <span className="absolute bottom-3 right-3 bg-[#F6AA06]/90 text-white px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm">
                  {t.slot_count || "?"} slot
                </span>
              </div>
              <h3 className="font-bold text-[18px] mb-1 text-[#3A3A3A]">{t.name}</h3>
              <p className="text-[13px] text-[#837D89] mb-4 truncate">
                {t.description || t.layout_type || "—"}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(t)}
                  className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[13px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleConfirmAction(t.is_active ? "Nonaktifkan" : "Aktifkan", t)}
                  className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[13px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
                >
                  {t.is_active ? "Nonaktif" : "Aktifkan"}
                </button>
                <button
                  onClick={() => handleConfirmAction("Hapus", t)}
                  className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[13px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-[1000px] max-w-full rounded-[16px] shadow-2xl overflow-hidden flex flex-col border border-gray-300 max-h-[90vh]">
            <div className="px-8 py-5 bg-[#F9F9F9] border-b border-gray-200">
              <h2 className="font-bold text-[28px] text-[#3A3A3A]">
                {modalMode === "edit" ? "Edit Template" : "Tambah Template Baru"}
              </h2>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

                {/* KIRI: FORM */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block font-bold text-[14px] text-[#5A5A5A] mb-1.5">Nama Template</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleChange}
                        placeholder="e.g. Pixel Minecraft"
                        className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block font-bold text-[14px] text-[#5A5A5A] mb-1.5">Kategori</label>
                      <select
                        name="category"
                        value={formData.category || "STRIP"}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px] bg-white cursor-pointer"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[14px] text-[#5A5A5A] mb-1.5">Deskripsi</label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      placeholder="e.g. Frame PNG · 3 foto · 1 sesi"
                      className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block font-bold text-[14px] text-[#5A5A5A] mb-1.5">Layout Type</label>
                      <select
                        name="layout_type"
                        value={formData.layout_type || LAYOUT_OPTIONS[0].label}
                        onChange={handleLayoutChange}
                        className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px] bg-white cursor-pointer"
                      >
                        {LAYOUT_OPTIONS.map((l) => (
                          <option key={l.label} value={l.label}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-[120px]">
                      <label className="block font-bold text-[14px] text-[#5A5A5A] mb-1.5">Slot Foto</label>
                      <input
                        type="number"
                        name="slot_count"
                        value={formData.slot_count || ""}
                        onChange={handleChange}
                        min={1}
                        max={12}
                        className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[14px] text-[#5A5A5A] mb-1.5">Theme</label>
                    <select
                      name="theme"
                      value={formData.theme || THEME_OPTIONS[0]}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px] bg-white cursor-pointer"
                    >
                      {THEME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between items-center bg-[#ECF0EE] border border-gray-300 p-3 rounded-[16px]">
                    <div>
                      <h3 className="font-bold text-[14px] text-[#5A5A5A]">Mode Frame PNG Kustom</h3>
                      <p className="text-[11px] text-[#484646]">Upload PNG transparan biar di-overlay ke foto</p>
                    </div>
                    <div
                      onClick={() => setIsCustomPNG(!isCustomPNG)}
                      className={`w-[46px] h-[22px] rounded-full flex items-center px-1 cursor-pointer transition-colors ${isCustomPNG ? "bg-[#3F6E68]" : "bg-[#A29C9C]"}`}
                    >
                      <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform ${isCustomPNG ? "translate-x-[22px]" : ""}`}></div>
                    </div>
                  </div>

                  {isCustomPNG && (
                    <div>
                      <label className="block font-bold text-[14px] text-[#5A5A5A] mb-1.5">Frame PNG</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          name="frame_path"
                          value={formData.frame_path || ""}
                          onChange={handleChange}
                          placeholder="URL frame PNG transparan"
                          className="flex-1 px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]"
                        />
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="px-4 py-2 bg-[#3F6E68] text-white rounded-full font-bold text-[12px] hover:bg-[#2c4e47] shadow-sm whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isUploading ? <>⏳</> : <>📤 Upload</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SECTION OVERLAY */}
                  <div className="border-2 border-[#F6AA06] rounded-[16px] p-4 bg-[#FFFAE6]">
                    <h3 className="font-bold text-[16px] text-[#5A5A5A] mb-1 flex items-center gap-2">
                      📐 Posisi Slot Foto di Frame
                    </h3>
                    <p className="text-[12px] text-gray-600 mb-4">
                      Atur posisi area kotak foto (% dari ukuran frame). Liat preview di kanan biar pas dengan border frame.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <NumberInput label="Atas (Top)" name="overlay_top" value={formData.overlay_top} onChange={handleChange} />
                      <NumberInput label="Bawah (Bottom)" name="overlay_bottom" value={formData.overlay_bottom} onChange={handleChange} />
                      <NumberInput label="Kiri (Left)" name="overlay_left" value={formData.overlay_left} onChange={handleChange} />
                      <NumberInput label="Kanan (Right)" name="overlay_right" value={formData.overlay_right} onChange={handleChange} />
                      <NumberInput label="Jarak Slot (Gap)" name="overlay_gap" value={formData.overlay_gap} onChange={handleChange} />
                      <div>
                        <label className="block font-bold text-[12px] text-[#5A5A5A] mb-1">Kolom Layout</label>
                        <select
                          name="overlay_cols"
                          value={formData.overlay_cols || 1}
                          onChange={handleChange}
                          className="w-full px-3 py-1.5 border border-gray-400 rounded text-[13px] bg-white cursor-pointer"
                        >
                          <option value={1}>1 Kolom (Strip Vertikal)</option>
                          <option value={2}>2 Kolom (Grid 2x)</option>
                          <option value={3}>3 Kolom (Grid 3x)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-6 py-3 rounded-[16px]">
                    <h3 className="font-normal text-[14px] text-[#5A5A5A]">Aktifkan template ini</h3>
                    <div
                      onClick={() => setIsActive(!isActive)}
                      className={`w-[46px] h-[22px] rounded-full flex items-center px-1 cursor-pointer transition-colors ${isActive ? "bg-[#3F6E68]" : "bg-[#A29C9C]"}`}
                    >
                      <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform ${isActive ? "translate-x-[22px]" : ""}`}></div>
                    </div>
                  </div>
                </div>

                {/* KANAN: LIVE PREVIEW */}
                <div className="lg:sticky lg:top-0 self-start">
                  <div className="bg-gradient-to-br from-[#ECF0EE] to-[#D9E1DE] border-2 border-gray-300 rounded-[16px] p-4 shadow-inner">
                    <h3 className="font-bold text-[14px] text-[#3F6E68] mb-1 text-center">🔍 LIVE PREVIEW</h3>
                    <p className="text-[10px] text-gray-500 text-center mb-3">Ukuran ngikut frame asli. Geser angka → update real-time</p>

                    <div className="bg-white/50 rounded-[12px] p-3 mb-3 min-h-[300px] flex items-center justify-center">
                      <FramePreview
                        framePath={formData.frame_path || ""}
                        slotCount={Number(formData.slot_count) || 0}
                        overlayTop={Number(formData.overlay_top) || 0}
                        overlayLeft={Number(formData.overlay_left) || 0}
                        overlayRight={Number(formData.overlay_right) || 0}
                        overlayBottom={Number(formData.overlay_bottom) || 0}
                        overlayGap={Number(formData.overlay_gap) || 0}
                        overlayCols={Number(formData.overlay_cols) || 1}
                      />
                    </div>

                    <div className="bg-white border border-gray-300 rounded-[8px] px-3 py-2 text-[10px] text-gray-600 leading-tight">
                      <div className="font-bold text-[#3F6E68] mb-1">Cara baca preview:</div>
                      <div className="space-y-0.5">
                        <div>🟨 Kotak kuning = posisi slot foto</div>
                        <div>🖼️ Frame PNG = di-overlay di atas</div>
                        <div>Geser slot biar pas di lubang frame</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-6 py-4 bg-[#ECF0EE] border-t border-gray-300 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-white border border-gray-400 rounded-full font-bold text-[#43515C] text-[14px] hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#3F6E68] text-white rounded-full font-bold text-[14px] hover:bg-[#2c4e47] shadow-sm"
              >
                {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[400px] rounded-[16px] shadow-2xl p-6 text-center border border-gray-300">
            <h3 className="font-bold text-[22px] text-[#3A3A3A] mb-3">Konfirmasi Aksi</h3>
            <p className="text-[15px] text-[#646464] mb-8">
              Apakah Anda yakin ingin <span className="font-bold text-black">{confirmAction.toLowerCase()}</span> template <span className="font-bold text-[#38635A]">"{selectedTemplate?.name}"</span>?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-6 py-2 bg-white border border-gray-400 rounded-[8px] font-bold text-[#43515C] text-[14px] hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={executeAction}
                className={`px-6 py-2 text-white rounded-[8px] font-bold text-[14px] shadow-sm ${confirmAction === "Hapus" ? "bg-red-500 hover:bg-red-600" : "bg-[#3F6E68] hover:bg-[#2c4e47]"}`}
              >
                Ya, {confirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}

function NumberInput({ label, name, value, onChange }: { label: string; name: string; value: any; onChange: any }) {
  return (
    <div>
      <label className="block font-bold text-[12px] text-[#5A5A5A] mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          name={name}
          value={value ?? ""}
          onChange={onChange}
          min={0}
          max={50}
          step={1}
          className="flex-1 px-3 py-1.5 border border-gray-400 rounded text-[13px] focus:outline-none focus:border-[#38635A]"
        />
        <span className="text-[12px] text-gray-500 font-bold">%</span>
      </div>
    </div>
  );
}