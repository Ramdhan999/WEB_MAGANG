"use client";

import React, { useState } from "react";

// DATA DUMMY VOUCHER
const initialVouchers = [
  { id: 1, code: "12345", discount: "GRATIS", limit: 999, used: 23, expired: "2025-12-31", status: "Expired" },
  { id: 2, code: "GLAMBOT50", discount: "50%", limit: 100, used: 45, expired: "2025-06-30", status: "Expired" },
  { id: 3, code: "GLAMBOT2026", discount: "GRATIS", limit: 500, used: 102, expired: "2026-12-31", status: "Aktif" },
  { id: 4, code: "PRATAMA", discount: "GRATIS", limit: 50, used: 12, expired: "2026-06-30", status: "Aktif" },
  { id: 5, code: "GRATIS", discount: "GRATIS", limit: 100, used: 33, expired: "2026-03-31", status: "Expired" },
  { id: 6, code: "DISKON10K", discount: "Rp 10.000", limit: 50, used: 50, expired: "2025-03-15", status: "Expired" },
];

export default function VoucherPage() {
  const [vouchers, setVouchers] = useState(initialVouchers);
  
  // STATE MODAL TAMBAH
  const [isModalOpen, setIsModalOpen] = useState(false);

  // STATE MODAL KONFIRMASI (Hapus / Nonaktif)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmAction = (action: string, voucher: any) => {
    setConfirmAction(action);
    setSelectedVoucher(voucher);
    setIsConfirmOpen(true);
  };

  const executeAction = () => {
    // Nanti logika hapus / nonaktif ke database di sini
    setIsConfirmOpen(false);
  };

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen relative font-inter">
      
      {/* HEADER SECTION */}
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

      {/* STATISTIK CARDS */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-300 rounded-[12px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-[55px] h-[55px] bg-[#D9D9D9] border border-black/20 rounded-[8px] flex items-center justify-center shrink-0">
             <img src="/vaktif.png" alt="Aktif" className="w-[30px] h-[30px] object-contain" />
          </div>
          <div>
            <p className="font-bold text-[32px] text-[#3A3A3A] leading-none mb-1">2</p>
            <p className="font-bold text-[12px] text-[#3F6E68]">Voucher Aktif</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded-[12px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-[55px] h-[55px] bg-[#D9D9D9] border border-black/20 rounded-[8px] flex items-center justify-center shrink-0">
             <img src="/vdipake.png" alt="Terpakai" className="w-[30px] h-[30px] object-contain" />
          </div>
          <div>
            <p className="font-bold text-[32px] text-[#3A3A3A] leading-none mb-1">1</p>
            <p className="font-bold text-[12px] text-[#3F6E68]">Sudah Dipakai</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded-[12px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-[55px] h-[55px] bg-[#D9D9D9] border border-black/20 rounded-[8px] flex items-center justify-center shrink-0">
             <img src="/expired.png" alt="Expired" className="w-[30px] h-[30px] object-contain" />
          </div>
          <div>
            <p className="font-bold text-[32px] text-[#3A3A3A] leading-none mb-1">4</p>
            <p className="font-bold text-[12px] text-[#3F6E68]">Expired</p>
          </div>
        </div>
      </div>

      {/* TABEL VOUCHER */}
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
              {vouchers.map((v, i) => (
                <tr key={v.id} className="border-b border-gray-300 text-[14px] hover:bg-gray-200 transition-colors">
                  <td className="py-3 font-bold text-left pl-6 text-[#525252]">{v.code}</td>
                  <td className="py-3 font-bold text-[#525252]">{v.discount}</td>
                  <td className="py-3 font-bold text-[#525252]">{v.limit}</td>
                  <td className="py-3 font-bold text-[#525252]">{v.used}</td>
                  <td className="py-3 font-bold text-[#525252]">{v.expired}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-[7px] border border-gray-400 font-bold text-[12px] w-[95px] mx-auto ${v.status === 'Aktif' ? 'bg-[#DCE3DC] text-[#3A3A3A]' : 'bg-[#E8CECE] text-[#3A3A3A]'}`}>
                      <img src={v.status === 'Aktif' ? '/selesai.png' : '/gagal.png'} alt={v.status} className="w-4 h-4" />
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-center gap-2">
                      {/* Tombol OFF sekarang ngebuka pop-up Nonaktif */}
                      <button 
                        onClick={() => handleConfirmAction("Nonaktif", v)}
                        className="px-3 py-1 bg-white border border-gray-400 rounded-[14px] font-bold text-[12px] text-[#3A3A3A] hover:bg-gray-100"
                      >
                        OFF
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================= */}
      {/* MODAL / POPUP TAMBAH VOUCHER BARU */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[540px] rounded-[16px] shadow-2xl overflow-hidden flex flex-col border border-gray-300">
            
            <div className="px-8 py-5 bg-[#F9F9F9] border-b border-gray-200">
              <h2 className="font-bold text-[32px] text-[#3A3A3A]">
                 Tambah Voucher Baru
              </h2>
            </div>

            <div className="p-8 space-y-6">
              
              {/* Row 1 */}
              <div className="flex gap-4">
                <div className="flex-[3]">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Nama Voucher</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="GLAMBOT25"
                      className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]" 
                    />
                    <button className="w-[46px] h-[46px] bg-white border border-gray-400 rounded-[8px] flex items-center justify-center shrink-0 hover:bg-gray-100 transition-colors">
                       <img src="/dadu.png" alt="Randomize" className="w-5 h-5 object-contain opacity-70" />
                    </button>
                  </div>
                </div>
                <div className="flex-[2]">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Tipe Diskon</label>
                  <select className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none appearance-none bg-white text-[15px] cursor-pointer">
                    <option>Persentase (%)</option>
                    <option>Nominal (Rp)</option>
                    <option>Gratis</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Nilai Diskon</label>
                  <input 
                    type="number" 
                    placeholder="100" 
                    className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]" 
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Kuota Pemakaian</label>
                  <input 
                    type="number" 
                    placeholder="1" 
                    className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]" 
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div>
                <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Tanggal Expired</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px] appearance-none" 
                  />
                  <img src="/date.png" alt="Calendar" className="absolute right-5 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-70 pointer-events-none" />
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
              <button className="px-6 py-2.5 bg-[#3F6E68] text-white rounded-full font-bold text-[15px] hover:bg-[#2c4e47] shadow-sm transition-colors">
                Simpan Voucher
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL KONFIRMASI (HAPUS / NONAKTIF) */}
      {/* ========================================= */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[400px] rounded-[16px] shadow-2xl p-6 text-center border border-gray-300">
            <h3 className="font-bold text-[22px] text-[#3A3A3A] mb-3">Konfirmasi Aksi</h3>
            <p className="text-[15px] text-[#646464] mb-8">
              Apakah Anda yakin ingin <span className="font-bold text-black">{confirmAction.toLowerCase()}kan</span> voucher <span className="font-bold text-[#38635A]">"{selectedVoucher?.code}"</span>?
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
                className={`px-6 py-2 text-white rounded-[8px] font-bold text-[14px] shadow-sm transition-colors ${
                  confirmAction === "Hapus" ? "bg-red-500 hover:bg-red-600" : "bg-[#3F6E68] hover:bg-[#2c4e47]"
                }`}
              >
                Ya, {confirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}