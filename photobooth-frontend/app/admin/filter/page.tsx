"use client";

import React, { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:8080";

interface Filter {
  id: number;
  name: string;
  css: string;
  bg_color: string;
  is_active: boolean;
}

// Preset CSS umum biar admin gak perlu hafal syntax
const CSS_PRESETS = [
  { label: "Noir (B&W)", css: "grayscale(100%) contrast(120%)" },
  { label: "Vintage", css: "sepia(60%) contrast(90%)" },
  { label: "Vivid", css: "saturate(180%)" },
  { label: "Warm", css: "sepia(30%) saturate(140%)" },
  { label: "Cool", css: "hue-rotate(30deg) saturate(120%)" },
  { label: "Drama", css: "contrast(150%) saturate(80%)" },
  { label: "Soft", css: "brightness(110%) contrast(85%) blur(1px)" },
  { label: "Film", css: "sepia(20%) contrast(110%) brightness(95%)" },
];

export default function FilterPage() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // FORM STATE
  const [form, setForm] = useState({
    id: 0,
    name: "",
    css: "",
    bg_color: "bg-[#F3F3F3]",
    is_active: true,
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFilters = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/filters`);
      const data = await res.json();
      setFilters(data || []);
    } catch (err) {
      console.error("Gagal load filter:", err);
      showToast("Gagal memuat data filter", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  const handleAddClick = () => {
    setModalMode("add");
    setForm({ id: 0, name: "", css: "", bg_color: "bg-[#F3F3F3]", is_active: true });
    setIsModalOpen(true);
  };

  const handleEditClick = (filter: Filter) => {
    setModalMode("edit");
    setForm({
      id: filter.id,
      name: filter.name,
      css: filter.css,
      bg_color: filter.bg_color || "bg-[#F3F3F3]",
      is_active: filter.is_active,
    });
    setIsModalOpen(true);
  };

  const handleConfirmAction = (action: string, filter: Filter) => {
    setConfirmAction(action);
    setSelectedFilter(filter);
    setIsConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Nama filter wajib diisi", "error");
      return;
    }
    if (!form.css.trim()) {
      showToast("CSS filter value wajib diisi", "error");
      return;
    }

    try {
      const url =
        modalMode === "add"
          ? `${BACKEND_URL}/api/admin/filters`
          : `${BACKEND_URL}/api/admin/filters/${form.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          css: form.css.trim(),
          bg_color: form.bg_color,
          is_active: form.is_active,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchFilters();
        showToast(modalMode === "add" ? "Filter ditambahkan!" : "Filter diupdate!", "success");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Gagal menyimpan filter", "error");
      }
    } catch (err) {
      showToast("Gagal konek ke server", "error");
    }
  };

  const executeAction = async () => {
    if (!selectedFilter) {
      setIsConfirmOpen(false);
      return;
    }

    try {
      if (confirmAction === "Hapus") {
        const res = await fetch(`${BACKEND_URL}/api/admin/filters/${selectedFilter.id}`, { method: "DELETE" });
        if (res.ok) {
          await fetchFilters();
          showToast(`Filter "${selectedFilter.name}" dihapus`, "success");
        } else {
          const errData = await res.json();
          showToast(errData.error || "Gagal menghapus filter", "error");
        }
      } else {
        // Toggle aktif/nonaktif
        const res = await fetch(`${BACKEND_URL}/api/admin/filters/${selectedFilter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...selectedFilter, is_active: !selectedFilter.is_active }),
        });
        if (res.ok) {
          await fetchFilters();
          showToast(`Filter "${selectedFilter.name}" ${!selectedFilter.is_active ? "diaktifkan" : "dinonaktifkan"}`, "success");
        } else {
          showToast("Gagal mengubah status", "error");
        }
      }
    } catch (err) {
      showToast("Gagal konek ke server", "error");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const isOriginal = (f: Filter) => f.name.toLowerCase() === "original";

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen relative font-inter">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-[12px] shadow-2xl font-bold text-white text-[15px] flex items-center gap-3 border-2 ${toast.type === "success" ? "bg-[#3F6E68] border-[#2c4e47]" : "bg-red-500 border-red-700"}`}
          style={{ minWidth: "300px", animation: "slideIn 0.3s ease-out" }}
        >
          <span className="text-[20px]">{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white border border-gray-300 rounded-[8px] p-6 mb-8 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-[36px] font-bold text-[#3A3A3A] leading-tight">Filter Foto</h1>
          <p className="text-[16px] text-[#646464] mt-1">
            Kelola filter — perubahan langsung tersedia di layar user
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-[#38635A] text-white px-6 py-2.5 rounded-[22px] font-bold text-[16px] flex items-center gap-2 hover:bg-[#2c4e47] transition-colors"
        >
          <span className="text-[20px] leading-none">+</span> Tambah Filter
        </button>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 font-bold">Memuat filter...</div>
      ) : filters.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-[14px] p-10 text-center text-gray-400 font-bold">
          Belum ada filter. Klik "Tambah Filter" buat bikin.
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-5">
          {filters.map((f) => (
            <div key={f.id} className="bg-white p-4 rounded-[14px] border border-gray-300 shadow-sm flex flex-col">

              {/* PREVIEW dengan CSS filter beneran di-apply ke gambar sample */}
              <div className="h-[100px] rounded-[8px] mb-4 border border-gray-200 overflow-hidden relative">
                <div
                  className="w-full h-full"
                  style={{
                    background: 'linear-gradient(135deg, #CBAD6F 0%, #6B5A3A 50%, #BB7640 100%)',
                    filter: f.css && f.css !== "none" ? f.css : "none",
                  }}
                >
                  <div className="absolute top-3 left-6 w-8 h-8 bg-[#D2B271] rounded-full opacity-80"></div>
                  <div className="absolute bottom-3 right-5 w-12 h-6 bg-[#858B73] rounded-[8px] opacity-80"></div>
                </div>
                {!f.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-[12px] bg-red-500 px-2 py-1 rounded">NONAKTIF</span>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-[18px] mb-1 text-[#3A3A3A] flex items-center gap-2">
                {f.name}
                {isOriginal(f) && <span className="text-[#F6AA06] text-[14px]">★</span>}
              </h3>

              <div className="bg-[#F2F7F5] rounded-[6px] p-2 mb-4 h-[50px] overflow-hidden">
                <p className="text-[11px] text-[#6B6B6B] font-mono leading-tight break-words">{f.css}</p>
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleEditClick(f)}
                  className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[12px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleConfirmAction(f.is_active ? "Nonaktifkan" : "Aktifkan", f)}
                  className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[12px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
                >
                  {f.is_active ? "Nonaktif" : "Aktifkan"}
                </button>
                {!isOriginal(f) && (
                  <button
                    onClick={() => handleConfirmAction("Hapus", f)}
                    className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[12px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-[640px] max-h-[90vh] rounded-[16px] shadow-2xl overflow-hidden flex flex-col border border-gray-300">

            <div className="px-8 py-5 bg-[#F9F9F9] border-b border-gray-200">
              <h2 className="font-bold text-[32px] text-[#3A3A3A]">
                {modalMode === "edit" ? "Edit Filter" : "Tambah Filter Baru"}
              </h2>
            </div>

            <div className="p-8 space-y-5 overflow-y-auto">
              <div>
                <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Nama Filter</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sunset Glow"
                  className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]"
                />
              </div>

              <div>
                <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">CSS Filter Value</label>
                <input
                  type="text"
                  value={form.css}
                  onChange={(e) => setForm({ ...form, css: e.target.value })}
                  placeholder="e.g. contrast(130%) saturate(140%)"
                  className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px] font-mono"
                />
                {/* PRESET QUICK-PICK */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {CSS_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setForm({ ...form, css: p.css })}
                      className="px-3 py-1 bg-[#ECF0EE] hover:bg-[#3F6E68] hover:text-white border border-gray-300 rounded-full text-[12px] font-bold text-[#5A5A5A] transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] text-[#817E7E] mt-2">
                  Klik preset di atas, atau ketik manual: brightness(), contrast(), saturate(), sepia(), grayscale(), hue-rotate(), blur()
                </p>
              </div>

              {/* LIVE PREVIEW */}
              <div>
                <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">🔍 Live Preview</label>
                <div className="relative w-full h-[200px] rounded-[9px] border border-gray-400 overflow-hidden">
                  <div
                    className="w-full h-full transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #CBAD6F 0%, #6B5A3A 50%, #BB7640 100%)',
                      filter: form.css && form.css.trim() !== "" && form.css !== "none" ? form.css : "none",
                    }}
                  >
                    <div className="absolute top-[30px] left-[150px] w-[70px] h-[70px] bg-[#D2B271] rounded-full"></div>
                    <div className="absolute bottom-[30px] right-[80px] w-[140px] h-[60px] bg-[#858B73] rounded-[14px]"></div>
                  </div>
                </div>
                <p className="text-[12px] text-gray-500 mt-2 text-center">Preview update otomatis pas lu ketik/pilih CSS</p>
              </div>

              <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-6 py-4 rounded-full">
                <h3 className="font-bold text-[16px] text-[#5A5A5A]">Aktifkan filter ini</h3>
                <div
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-[46px] h-[22px] rounded-full flex items-center px-1 cursor-pointer transition-colors ${form.is_active ? "bg-[#3F6E68]" : "bg-[#A29C9C]"}`}
                >
                  <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform ${form.is_active ? "translate-x-[22px]" : ""}`}></div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-[#ECF0EE] border-t border-gray-300 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-gray-400 rounded-full font-bold text-[#43515C] text-[15px] hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-[#3F6E68] text-white rounded-full font-bold text-[15px] hover:bg-[#2c4e47] shadow-sm transition-colors"
              >
                {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Filter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[400px] rounded-[16px] shadow-2xl p-6 text-center border border-gray-300">
            <h3 className="font-bold text-[22px] text-[#3A3A3A] mb-3">Konfirmasi Aksi</h3>
            <p className="text-[15px] text-[#646464] mb-8">
              Yakin ingin <span className="font-bold text-black">{confirmAction.toLowerCase()}</span> filter <span className="font-bold text-[#38635A]">"{selectedFilter?.name}"</span>?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-6 py-2 bg-white border border-gray-400 rounded-[8px] font-bold text-[#43515C] text-[14px] hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={executeAction}
                className={`px-6 py-2 text-white rounded-[8px] font-bold text-[14px] shadow-sm transition-colors ${confirmAction === "Hapus" ? "bg-red-500 hover:bg-red-600" : "bg-[#3F6E68] hover:bg-[#2c4e47]"}`}
              >
                Ya, {confirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}