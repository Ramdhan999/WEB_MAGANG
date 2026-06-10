"use client";

import React, { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:8080";

interface Voucher {
  id: number;
  code: string;
  discount_type: string;   // "percentage" | "nominal" | "free"
  discount_value: number;
  quota: number;
  used: number;
  is_active: boolean;
  expired_at: string;
}

export default function VoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // FORM STATE
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    quota: 1,
    expired_at: "",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchVouchers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/vouchers`);
      const data = await res.json();
      setVouchers(data || []);
    } catch (err) {
      console.error("Gagal load voucher:", err);
      showToast("Gagal memuat data voucher", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // ===== HELPER: status & display =====
  const isExpired = (v: Voucher) => {
    if (!v.expired_at) return false;
    return new Date(v.expired_at) < new Date();
  };

  const getStatusLabel = (v: Voucher) => {
    if (!v.is_active) return "Nonaktif";
    if (isExpired(v)) return "Expired";
    if (v.quota > 0 && v.used >= v.quota) return "Habis";
    return "Aktif";
  };

  const getDiscountLabel = (v: Voucher) => {
    if (v.discount_type === "free") return "GRATIS";
    if (v.discount_type === "percentage") return `${v.discount_value}%`;
    if (v.discount_type === "nominal") return `Rp ${v.discount_value.toLocaleString("id-ID")}`;
    return "-";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  // ===== STATS =====
  const stats = {
    aktif: vouchers.filter((v) => getStatusLabel(v) === "Aktif").length,
    dipakai: vouchers.reduce((sum, v) => sum + (v.used || 0), 0),
    expired: vouchers.filter((v) => getStatusLabel(v) === "Expired" || getStatusLabel(v) === "Habis").length,
  };

  // ===== ACTIONS =====
  const handleAddClick = () => {
    setForm({ code: "", discount_type: "percentage", discount_value: 0, quota: 1, expired_at: "" });
    setIsModalOpen(true);
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "GLAMBOT";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm((prev) => ({ ...prev, code }));
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      showToast("Kode voucher wajib diisi", "error");
      return;
    }
    if (form.discount_type !== "free" && (!form.discount_value || form.discount_value <= 0)) {
      showToast("Nilai diskon harus lebih dari 0", "error");
      return;
    }
    if (!form.quota || form.quota < 1) {
      showToast("Kuota minimal 1", "error");
      return;
    }

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: form.discount_type === "free" ? 0 : Number(form.discount_value),
        quota: Number(form.quota),
        used: 0,
        is_active: true,
        // Convert date ke RFC3339 (kalo kosong, kirim string kosong → backend handle zero value)
        expired_at: form.expired_at ? new Date(form.expired_at).toISOString() : null,
      };

      const res = await fetch(`${BACKEND_URL}/api/admin/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchVouchers();
        showToast("Voucher berhasil ditambahkan!", "success");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Gagal menyimpan voucher", "error");
      }
    } catch (err) {
      showToast("Gagal konek ke server", "error");
    }
  };

  const handleConfirmAction = (action: string, voucher: Voucher) => {
    setConfirmAction(action);
    setSelectedVoucher(voucher);
    setIsConfirmOpen(true);
  };

  const executeAction = async () => {
    if (!selectedVoucher) {
      setIsConfirmOpen(false);
      return;
    }

    try {
      if (confirmAction === "Hapus") {
        const res = await fetch(`${BACKEND_URL}/api/admin/vouchers/${selectedVoucher.id}`, { method: "DELETE" });
        if (res.ok) {
          await fetchVouchers();
          showToast(`Voucher "${selectedVoucher.code}" dihapus`, "success");
        } else {
          showToast("Gagal menghapus voucher", "error");
        }
      } else {
        // Toggle aktif/nonaktif
        const res = await fetch(`${BACKEND_URL}/api/admin/vouchers/${selectedVoucher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...selectedVoucher, is_active: !selectedVoucher.is_active }),
        });
        if (res.ok) {
          await fetchVouchers();
          showToast(`Voucher "${selectedVoucher.code}" ${!selectedVoucher.is_active ? "diaktifkan" : "dinonaktifkan"}`, "success");
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
      <div className="bg-white border border-gray-300 rounded-[8px] p-6 mb-6 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-[36px] font-bold text-[#3A3A3A] leading-tight">Voucher</h1>
          <p className="text-[16px] text-[#646464] mt-1">
            Buat dan kelola kode voucher — langsung bisa dipakai di layar user
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-[#38635A] text-white px-6 py-2.5 rounded-[22px] font-bold text-[16px] flex items-center gap-2 hover:bg-[#2c4e47] transition-colors"
        >
          <span className="text-[20px] leading-none">+</span> Tambah Voucher
        </button>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-300 rounded-[12px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-[55px] h-[55px] bg-[#D9D9D9] border border-black/20 rounded-[8px] flex items-center justify-center shrink-0">
            <img src="/vaktif.png" alt="Aktif" className="w-[30px] h-[30px] object-contain" />
          </div>
          <div>
            <p className="font-bold text-[32px] text-[#3A3A3A] leading-none mb-1">{stats.aktif}</p>
            <p className="font-bold text-[12px] text-[#3F6E68]">Voucher Aktif</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded-[12px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-[55px] h-[55px] bg-[#D9D9D9] border border-black/20 rounded-[8px] flex items-center justify-center shrink-0">
            <img src="/vdipake.png" alt="Terpakai" className="w-[30px] h-[30px] object-contain" />
          </div>
          <div>
            <p className="font-bold text-[32px] text-[#3A3A3A] leading-none mb-1">{stats.dipakai}</p>
            <p className="font-bold text-[12px] text-[#3F6E68]">Total Dipakai</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded-[12px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-[55px] h-[55px] bg-[#D9D9D9] border border-black/20 rounded-[8px] flex items-center justify-center shrink-0">
            <img src="/expired.png" alt="Expired" className="w-[30px] h-[30px] object-contain" />
          </div>
          <div>
            <p className="font-bold text-[32px] text-[#3A3A3A] leading-none mb-1">{stats.expired}</p>
            <p className="font-bold text-[12px] text-[#3F6E68]">Expired / Habis</p>
          </div>
        </div>
      </div>

      {/* TABEL */}
      <div className="bg-[#ECECEC] border border-gray-300 shadow-sm rounded-[20px] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse bg-transparent rounded-[10px] overflow-hidden">
            <thead className="bg-[#D9D9D9]">
              <tr>
                {['KODE', 'DISKON', 'KUOTA', 'TERPAKAI', 'EXPIRED', 'STATUS', 'AKSI'].map((h, i) =>
                  <th key={h} className={`py-4 text-[16px] font-bold text-[#3A3A3A] border-b border-gray-300 ${i === 0 ? 'text-left pl-6' : ''}`}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-gray-400 font-bold">Memuat data voucher...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-gray-400 font-bold">Belum ada voucher. Klik "Tambah Voucher" buat bikin.</td></tr>
              ) : (
                vouchers.map((v) => {
                  const status = getStatusLabel(v);
                  const statusActive = status === "Aktif";
                  return (
                    <tr key={v.id} className="border-b border-gray-300 text-[14px] hover:bg-gray-200 transition-colors">
                      <td className="py-3 font-bold text-left pl-6 text-[#525252]">{v.code}</td>
                      <td className="py-3 font-bold text-[#525252]">{getDiscountLabel(v)}</td>
                      <td className="py-3 font-bold text-[#525252]">{v.quota}</td>
                      <td className="py-3 font-bold text-[#525252]">{v.used}</td>
                      <td className="py-3 font-bold text-[#525252]">{formatDate(v.expired_at)}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-[7px] border border-gray-400 font-bold text-[12px] w-[95px] mx-auto ${statusActive ? 'bg-[#DCE3DC] text-[#3A3A3A]' : 'bg-[#E8CECE] text-[#3A3A3A]'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleConfirmAction(v.is_active ? "Nonaktif" : "Aktif", v)}
                            className="px-3 py-1 bg-white border border-gray-400 rounded-[14px] font-bold text-[12px] text-[#3A3A3A] hover:bg-gray-100"
                          >
                            {v.is_active ? "OFF" : "ON"}
                          </button>
                          <button
                            onClick={() => handleConfirmAction("Hapus", v)}
                            className="px-3 py-1 bg-white border border-gray-400 rounded-[14px] font-bold text-[12px] text-[#3A3A3A] hover:bg-gray-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[540px] rounded-[16px] shadow-2xl overflow-hidden flex flex-col border border-gray-300">
            <div className="px-8 py-5 bg-[#F9F9F9] border-b border-gray-200">
              <h2 className="font-bold text-[32px] text-[#3A3A3A]">Tambah Voucher Baru</h2>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex gap-4">
                <div className="flex-[3]">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Kode Voucher</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="GLAMBOT25"
                      className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]"
                    />
                    <button
                      onClick={generateRandomCode}
                      title="Generate kode random"
                      className="w-[46px] h-[46px] bg-white border border-gray-400 rounded-[8px] flex items-center justify-center shrink-0 hover:bg-gray-100 transition-colors text-[18px]"
                    >
                      🎲
                    </button>
                  </div>
                </div>
                <div className="flex-[2]">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Tipe Diskon</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none appearance-none bg-white text-[15px] cursor-pointer"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                    <option value="free">Gratis</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">
                    Nilai Diskon {form.discount_type === "free" && <span className="text-gray-400 font-normal">(N/A)</span>}
                  </label>
                  <input
                    type="number"
                    value={form.discount_type === "free" ? "" : form.discount_value || ""}
                    onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
                    disabled={form.discount_type === "free"}
                    placeholder={form.discount_type === "percentage" ? "50" : "20000"}
                    className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px] disabled:bg-gray-100 disabled:opacity-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Kuota Pemakaian</label>
                  <input
                    type="number"
                    value={form.quota || ""}
                    onChange={(e) => setForm({ ...form, quota: Number(e.target.value) })}
                    placeholder="100"
                    className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Tanggal Expired <span className="text-gray-400 font-normal text-[13px]">(opsional)</span></label>
                <input
                  type="date"
                  value={form.expired_at}
                  onChange={(e) => setForm({ ...form, expired_at: e.target.value })}
                  className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]"
                />
              </div>

              {/* Preview */}
              <div className="bg-[#FFFAE6] border border-[#F6AA06] rounded-[12px] px-4 py-3 text-[13px] text-[#7A6A2A]">
                <span className="font-bold">Preview: </span>
                Kode <span className="font-bold">{form.code || "—"}</span> →{" "}
                {form.discount_type === "free" ? "GRATIS total" :
                  form.discount_type === "percentage" ? `Potongan ${form.discount_value || 0}%` :
                    `Potongan Rp ${(form.discount_value || 0).toLocaleString("id-ID")}`}
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
                Simpan Voucher
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
              Yakin ingin <span className="font-bold text-black">{confirmAction.toLowerCase()}{confirmAction === "Hapus" ? "" : "kan"}</span> voucher <span className="font-bold text-[#38635A]">"{selectedVoucher?.code}"</span>?
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