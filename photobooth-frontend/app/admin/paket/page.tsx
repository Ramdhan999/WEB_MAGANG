"use client";

import React, { useEffect, useState, useRef } from "react";

// ===== KONSTANTA BACKEND =====
const BACKEND_URL = "http://localhost:8080";

export default function PaketPage() {
  // 1. STATE DATA
  const [packages, setPackages] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});

  // STATE MODAL PAKET (Tambah/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // STATE MODAL KONFIRMASI (Hapus/Nonaktif)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");

  // STATE TOGGLE MODAL
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // STATE PENGATURAN BAWAH (Sesi & Kamera)
  const [duration, setDuration] = useState("300");
  const [merchantName, setMerchantName] = useState("Glambot Studio - Pratama Shabil");
  const [merchantId, setMerchantId] = useState("GLMBT-001");

  // STATE TOAST (notifikasi)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // STATE UPLOAD
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== TOAST HELPER =====
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ===== FETCH PACKAGES =====
  const fetchPackages = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/packages`);
      const data = await res.json();
      setPackages(data || []);
    } catch (err) {
      console.error("Gagal load:", err);
      showToast("Gagal memuat data paket", "error");
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // ===== HANDLE FORM & MODAL =====
  const handleAddClick = () => {
    setModalMode("add");
    setSelectedPackage(null);
    // Reset semua field, gak ada id field biar bersih
    setFormData({
      package_id: "",
      name: "",
      badge: "",
      price: "",
      duration: "",
      max_people: "",
      print_count: "",
      icon_url: "",
    });
    setIsPopular(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleEditClick = (pkg: any) => {
    setModalMode("edit");
    setSelectedPackage(pkg);
    setFormData(pkg);
    setIsPopular(pkg.is_popular);
    setIsActive(pkg.is_active);
    setIsModalOpen(true);
  };

  const handleConfirmAction = (action: string, pkg: any) => {
    setConfirmAction(action);
    setSelectedPackage(pkg);
    setIsConfirmOpen(true);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // ===== HANDLE UPLOAD GAMBAR =====
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi: cuma boleh image, max 2MB
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran gambar maks 2MB", "error");
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
        setFormData((prev: any) => ({ ...prev, icon_url: data.url }));
        showToast("Gambar berhasil diupload!", "success");
      } else {
        showToast(data.error || "Upload gagal", "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Gagal upload gambar, cek koneksi backend", "error");
    } finally {
      setIsUploading(false);
      // Reset input file biar bisa upload file yang sama lagi
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ===== SIMPAN PAKET (POST / PUT) =====
  const handleSave = async () => {
    // Validasi basic
    if (!formData.package_id?.trim() || !formData.name?.trim()) {
      showToast("Package ID dan Nama wajib diisi", "error");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      showToast("Harga harus lebih dari 0", "error");
      return;
    }

    try {
      const url =
        modalMode === "add"
          ? `${BACKEND_URL}/api/admin/packages`
          : `${BACKEND_URL}/api/admin/packages/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const payload = {
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration) || 0,
        max_people: Number(formData.max_people) || 0,
        print_count: Number(formData.print_count) || 0,
        is_popular: isPopular,
        is_active: isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchPackages();
        showToast(
          modalMode === "add" ? "Paket berhasil ditambahkan!" : "Paket berhasil diupdate!",
          "success"
        );
      } else {
        // Ambil pesan error dari backend
        let errorMsg = "Gagal menyimpan paket";
        try {
          const errData = await res.json();
          errorMsg = errData.error || errData.message || errorMsg;
        } catch {
          // Response bukan JSON
        }
        // Kasih hint kalau unique constraint
        if (errorMsg.toLowerCase().includes("duplicate") || errorMsg.toLowerCase().includes("unique")) {
          errorMsg = `Package ID "${formData.package_id}" sudah dipakai paket lain`;
        }
        showToast(errorMsg, "error");
      }
    } catch (error) {
      console.error("Error save:", error);
      showToast("Gagal konek ke server", "error");
    }
  };

  // ===== HAPUS PAKET (DELETE) =====
  const executeAction = async () => {
    if (confirmAction === "Hapus" && selectedPackage) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/packages/${selectedPackage.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchPackages();
          showToast(`Paket "${selectedPackage.name}" berhasil dihapus`, "success");
        } else {
          showToast("Gagal menghapus paket", "error");
        }
      } catch (error) {
        console.error("Error delete:", error);
        showToast("Gagal konek ke server", "error");
      }
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen relative font-inter">

      {/* ===== TOAST NOTIFICATION ===== */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-[12px] shadow-2xl font-bold text-white text-[15px] flex items-center gap-3 animate-slide-in border-2 ${
            toast.type === "success"
              ? "bg-[#3F6E68] border-[#2c4e47]"
              : "bg-red-500 border-red-700"
          }`}
          style={{ minWidth: "300px" }}
        >
          <span className="text-[20px]">{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white border border-gray-300 rounded-[8px] p-6 mb-8 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-[36px] font-bold text-[#3A3A3A] leading-tight">Paket & Pengaturan Sesi</h1>
          <p className="text-[16px] text-[#646464] mt-1">
            Kelola paket foto, durasi sesi, merchant QRIS & kamera — sinkron ke layar user
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-[#38635A] text-white px-6 py-2.5 rounded-[22px] font-bold text-[16px] flex items-center gap-2 hover:bg-[#2c4e47] transition-colors"
        >
          <span className="text-[20px] leading-none">+</span> Tambah Paket
        </button>
      </div>

      {/* PAKET GRID */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white p-6 rounded-[14px] border border-gray-300 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[56px] h-[56px] bg-[#E3E3E3] border border-gray-300 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden">
                <img src={pkg.icon_url || "/paket1.png"} alt={pkg.name} className="w-[42px] h-[42px] object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-[18px] text-[#3A3A3A] leading-tight mb-0.5">{pkg.name}</h3>
                <p className="text-[13px] font-bold italic text-[#386359]">{pkg.badge}</p>
              </div>
            </div>

            <h2 className="font-bold text-[32px] text-[#3F6E68] mb-4">Rp {pkg.price?.toLocaleString('id-ID')}</h2>

            <div className="flex justify-between gap-2 mb-4">
              <div className="flex-1 bg-[#ECEAEA] border border-gray-200 rounded-[6px] py-2.5 flex flex-col items-center justify-center">
                <img src="/durasi.png" alt="Durasi" className="w-[18px] h-[18px] object-contain mb-1.5 opacity-70" />
                <span className="font-bold text-[11px] text-[#444]">{pkg.duration} mnt</span>
                <span className="italic text-[9px] text-[#757575]">SESI</span>
              </div>
              <div className="flex-1 bg-[#ECEAEA] border border-gray-200 rounded-[6px] py-2.5 flex flex-col items-center justify-center">
                <img src="/orang.png" alt="Orang" className="w-[18px] h-[18px] object-contain mb-1.5 opacity-70" />
                <span className="font-bold text-[11px] text-[#444]">{pkg.max_people}</span>
                <span className="italic text-[9px] text-[#757575]">ORANG</span>
              </div>
              <div className="flex-1 bg-[#ECEAEA] border border-gray-200 rounded-[6px] py-2.5 flex flex-col items-center justify-center">
                <img src="/cetak1.png" alt="Print" className="w-[18px] h-[18px] object-contain mb-1.5 opacity-70" />
                <span className="font-bold text-[11px] text-[#444]">{pkg.print_count}x</span>
                <span className="italic text-[9px] text-[#757575]">PRINT</span>
              </div>
            </div>

            <div className="mb-4">
              <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-[7px] border border-gray-300 font-bold text-[11px] ${pkg.is_active ? 'bg-[#DCE3DC] text-[#3A3A3A]' : 'bg-[#E8CECE] text-[#3A3A3A]'}`}>
                <img src={pkg.is_active ? '/selesai.png' : '/gagal.png'} alt="status" className="w-3.5 h-3.5" />
                {pkg.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => handleEditClick(pkg)}
                className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[12px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleConfirmAction("Hapus", pkg)}
                className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[12px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-bold text-[28px] text-[#3A3A3A] mb-6">Pengaturan Sesi & Kamera</h2>

      {/* PENGATURAN GRID */}
      <div className="grid grid-cols-3 gap-6">
        {/* Card Durasi */}
        <div className="bg-white p-6 rounded-[14px] border border-gray-300 shadow-sm flex flex-col">
          <div className="w-[50px] h-[50px] bg-[#D9D9D9] rounded-[8px] flex items-center justify-center mb-4">
            <img src="/durasi.png" alt="Durasi" className="w-7 h-7 object-contain" />
          </div>
          <h3 className="font-bold text-[22px] text-[#3A3A3A] mb-1">Durasi Sesi Default</h3>
          <p className="text-[14px] text-[#646464] mb-6">Durasi sesi foto untuk paket tanpa custom duration</p>
          <div className="flex border border-gray-300 rounded-[8px] overflow-hidden mb-3">
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-4 py-2 outline-none font-bold text-[#5E5E5E]" />
            <div className="bg-[#D9D9D9] px-4 py-2 font-bold text-[#5E5E5E] border-l border-gray-300">Detik</div>
          </div>
          <div className="flex gap-2 mb-6">
            <button onClick={() => setDuration("180")} className={`flex-1 py-1.5 border rounded-[6px] text-[12px] font-bold transition-colors ${duration === "180" ? "bg-[#386359] text-white border-transparent shadow-sm" : "border-gray-300 text-[#3A3A3A] hover:bg-gray-50"}`}>3 menit</button>
            <button onClick={() => setDuration("300")} className={`flex-1 py-1.5 border rounded-[6px] text-[12px] font-bold transition-colors ${duration === "300" ? "bg-[#386359] text-white border-transparent shadow-sm" : "border-gray-300 text-[#3A3A3A] hover:bg-gray-50"}`}>5 menit</button>
            <button onClick={() => setDuration("600")} className={`flex-1 py-1.5 border rounded-[6px] text-[12px] font-bold transition-colors ${duration === "600" ? "bg-[#386359] text-white border-transparent shadow-sm" : "border-gray-300 text-[#3A3A3A] hover:bg-gray-50"}`}>10 menit</button>
          </div>
          <button onClick={() => showToast("Durasi berhasil disimpan", "success")} className="w-full py-3 bg-[#386359] text-white font-bold rounded-[10px] mt-auto hover:bg-[#2c4e47] transition-colors">Simpan Durasi</button>
        </div>

        {/* Card QRIS */}
        <div className="bg-white p-6 rounded-[14px] border border-gray-300 shadow-sm flex flex-col">
          <div className="w-[50px] h-[50px] bg-[#D9D9D9] rounded-[8px] flex items-center justify-center mb-4">
            <img src="/qris.png" alt="QRIS" className="w-7 h-7 object-contain" />
          </div>
          <h3 className="font-bold text-[22px] text-[#3A3A3A] mb-1">QRIS Merchant</h3>
          <p className="text-[14px] text-[#646464] mb-6">Informasi merchant untuk pembayaran</p>
          <div className="mb-4">
            <label className="block font-bold text-[14px] text-[#696969] mb-1">Nama Merchant</label>
            <input type="text" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-[8px] outline-none font-bold text-[#5E5E5E]" />
          </div>
          <div className="mb-6">
            <label className="block font-bold text-[14px] text-[#696969] mb-1">Merchant ID</label>
            <input type="text" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-[8px] outline-none font-bold text-[#5E5E5E]" />
          </div>
          <button onClick={() => showToast("Data merchant berhasil disimpan", "success")} className="w-full py-3 bg-[#386359] text-white font-bold rounded-[10px] mt-auto hover:bg-[#2c4e47] transition-colors">Simpan Merchant</button>
        </div>

        {/* Card Kamera */}
        <div className="bg-white p-6 rounded-[14px] border border-gray-300 shadow-sm flex flex-col">
          <div className="w-[50px] h-[50px] bg-[#D9D9D9] rounded-[8px] flex items-center justify-center mb-4">
            <img src="/image2.png" alt="Kamera" className="w-7 h-7 object-contain" />
          </div>
          <h3 className="font-bold text-[22px] text-[#3A3A3A] mb-1">Kamera</h3>
          <p className="text-[14px] text-[#646464] mb-6">Pengaturan kamera dan countdown</p>
          <div className="mb-4">
            <label className="block font-bold text-[14px] text-[#696969] mb-1">Resolusi Kamera</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-[8px] outline-none font-bold text-[#5E5E5E] cursor-pointer bg-white">
              <option>1920x1080 (FHD)</option>
              <option>1280x720 (HD)</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block font-bold text-[14px] text-[#696969] mb-1">Countdown Timer</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-[8px] outline-none font-bold text-[#5E5E5E] cursor-pointer bg-white">
              <option>3 detik</option>
              <option>5 detik</option>
              <option>10 detik</option>
            </select>
          </div>
          <button onClick={() => showToast("Pengaturan kamera berhasil disimpan", "success")} className="w-full py-3 bg-[#386359] text-white font-bold rounded-[10px] mt-auto hover:bg-[#2c4e47] transition-colors">Simpan Kamera</button>
        </div>
      </div>

      {/* MODAL TAMBAH & EDIT PAKET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[680px] rounded-[16px] shadow-2xl overflow-hidden flex flex-col border border-gray-300 max-h-[90vh]">
            <div className="px-8 py-5 bg-[#F9F9F9] border-b border-gray-200">
              <h2 className="font-bold text-[32px] text-[#3A3A3A]">
                {modalMode === "edit" ? "Edit Paket" : "Tambah Paket Baru"}
              </h2>
            </div>
            <div className="p-8 space-y-4 overflow-y-auto">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Nama Paket</label>
                  <input type="text" name="name" value={formData.name || ""} onChange={handleChange} placeholder="e.g. Paket Solo" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Badge / Label</label>
                  <input type="text" name="badge" value={formData.badge || ""} onChange={handleChange} placeholder="e.g. SOLO" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
              </div>

              {/* ICON URL + UPLOAD BUTTON */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Icon / Gambar Paket</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      name="icon_url"
                      value={formData.icon_url || ""}
                      onChange={handleChange}
                      placeholder="/paket1.png atau upload"
                      className="flex-1 px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]"
                    />
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2.5 bg-[#3F6E68] text-white rounded-full font-bold text-[13px] hover:bg-[#2c4e47] shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isUploading ? (
                        <>⏳ Upload...</>
                      ) : (
                        <>📤 Upload</>
                      )}
                    </button>
                  </div>
                  {formData.icon_url && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={formData.icon_url} alt="preview" className="w-10 h-10 object-cover rounded border border-gray-300" />
                      <span className="text-[12px] text-gray-500 truncate">{formData.icon_url}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Harga</label>
                  <div className="flex border border-gray-400 rounded-full overflow-hidden">
                    <div className="px-4 py-2.5 bg-white font-bold text-gray-500 border-r border-gray-400">Rp</div>
                    <input type="number" name="price" value={formData.price || ""} onChange={handleChange} placeholder="35000" className="w-full px-3 py-2.5 outline-none focus:bg-gray-50 text-[14px]" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Durasi Sesi (menit)</label>
                  <input type="number" name="duration" value={formData.duration || ""} onChange={handleChange} placeholder="5" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Maks. Orang</label>
                  <input type="number" name="max_people" value={formData.max_people || ""} onChange={handleChange} placeholder="2" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
              </div>

              <div className="flex gap-4 mb-2">
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Jumlah Cetak (4R)</label>
                  <input type="number" name="print_count" value={formData.print_count || ""} onChange={handleChange} placeholder="1" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Package ID</label>
                  <input
                    type="text"
                    name="package_id"
                    value={formData.package_id || ""}
                    onChange={handleChange}
                    placeholder="e.g. solo, group"
                    disabled={modalMode === "edit"}
                    className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {modalMode === "edit" && (
                    <p className="text-[11px] text-gray-500 mt-1 ml-2">Package ID gak bisa diubah pas edit</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-6 py-3.5 rounded-[20px]">
                <h3 className="font-normal text-[16px] text-[#5A5A5A]">Tandai sebagai <span className="font-bold text-black">Populer</span></h3>
                <div onClick={() => setIsPopular(!isPopular)} className={`w-[46px] h-[22px] rounded-full flex items-center px-1 cursor-pointer transition-colors ${isPopular ? 'bg-[#3F6E68]' : 'bg-[#A29C9C]'}`}>
                  <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform ${isPopular ? 'translate-x-[22px]' : ''}`}></div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-6 py-3.5 rounded-[20px]">
                <h3 className="font-normal text-[16px] text-[#5A5A5A]">Aktifkan paket ini</h3>
                <div onClick={() => setIsActive(!isActive)} className={`w-[46px] h-[22px] rounded-full flex items-center px-1 cursor-pointer transition-colors ${isActive ? 'bg-[#3F6E68]' : 'bg-[#A29C9C]'}`}>
                  <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform ${isActive ? 'translate-x-[22px]' : ''}`}></div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-[#ECF0EE] border-t border-gray-300 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-gray-400 rounded-full font-bold text-[#43515C] text-[15px] hover:bg-gray-100">Batal</button>
              <button onClick={handleSave} className="px-6 py-2.5 bg-[#3F6E68] text-white rounded-full font-bold text-[15px] hover:bg-[#2c4e47] shadow-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[400px] rounded-[16px] shadow-2xl p-6 text-center border border-gray-300">
            <h3 className="font-bold text-[22px] text-[#3A3A3A] mb-3">Konfirmasi Aksi</h3>
            <p className="text-[15px] text-[#646464] mb-8">
              Apakah Anda yakin ingin menghapus paket <span className="font-bold text-[#38635A]">"{selectedPackage?.name}"</span>?
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsConfirmOpen(false)} className="px-6 py-2 bg-white border border-gray-400 rounded-[8px] font-bold text-[#43515C] text-[14px] hover:bg-gray-100">Batal</button>
              <button onClick={executeAction} className="px-6 py-2 text-white bg-red-500 hover:bg-red-600 rounded-[8px] font-bold text-[14px] shadow-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* CSS animasi toast */}
      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}