"use client";

import React, { useState } from "react";

// DATA DUMMY FILTER
const initialFilters = [
  { id: 1, name: "Original", css: "none (tanpa filter)", bgColor: "bg-[#F3F3F3]" },
  { id: 2, name: "Noir", css: "grayscale(100%)", bgColor: "bg-[#EAEAEA]" },
  { id: 3, name: "Vintage", css: "sepia(70%)", bgColor: "bg-[#FDFCE7]" },
  { id: 4, name: "Vivid", css: "contrast(1.25) saturate(1.3)", bgColor: "bg-[#FDF9F9]" },
  { id: 5, name: "Warm", css: "brightness(1.1) contrast(0.95) sepia(15%)", bgColor: "bg-[#FCFAEE]" },
  { id: 6, name: "Cool", css: "brightness(1.05) saturate(0.15) contrast(1.1) hue-rotate(185deg)", bgColor: "bg-[#F0F6F9]" },
  { id: 7, name: "Drama", css: "contrast(1.4) brightness(1.08) saturate(1.15)", bgColor: "bg-[#E6EBEB]" },
  { id: 8, name: "Soft", css: "brightness(1.18) contrast(0.82) saturate(0.85)", bgColor: "bg-[#DBDFE0]" },
  { id: 9, name: "Film", css: "sepia(30%) saturate(0.7) contrast(1.1)", bgColor: "bg-[#F3F5F3]" },
];

export default function FilterPage() {
  const [filters, setFilters] = useState(initialFilters);
  
  // STATE MODAL TAMBAH/EDIT
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  const [selectedFilter, setSelectedFilter] = useState<any>(null);

  // STATE MODAL KONFIRMASI (Hapus/Nonaktif)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");

  const handleAddClick = () => {
    setModalMode("add");
    setSelectedFilter(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (filter: any) => {
    setModalMode("edit");
    setSelectedFilter(filter);
    setIsModalOpen(true);
  };

  const handleConfirmAction = (action: string, filter: any) => {
    setConfirmAction(action);
    setSelectedFilter(filter);
    setIsConfirmOpen(true);
  };

  const executeAction = () => {
    setIsConfirmOpen(false);
  };

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen relative font-inter">
      
      {/* HEADER SECTION */}
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

      {/* FILTER GRID */}
      <div className="grid grid-cols-5 gap-5">
        {filters.map((f) => (
          <div key={f.id} className="bg-white p-4 rounded-[14px] border border-gray-300 shadow-sm flex flex-col">
            
            {/* Box Warna Filter */}
            <div className={`h-[100px] ${f.bgColor} rounded-[8px] mb-4 border border-gray-200`}></div>
            
            <h3 className="font-bold text-[18px] mb-1 text-[#3A3A3A]">{f.name}</h3>
            
            {/* Box Kode CSS */}
            <div className="bg-[#F2F7F5] rounded-[6px] p-2 mb-4 h-[50px] overflow-hidden">
               <p className="text-[11px] text-[#6B6B6B] font-mono leading-tight">{f.css}</p>
            </div>
            
            <div className="flex gap-2 mt-auto">
              <button 
                onClick={() => handleEditClick(f)}
                className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[12px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => handleConfirmAction("Nonaktifkan", f)}
                className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[12px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
              >
                Nonaktif
              </button>
              {f.name !== 'Original' && (
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

      {/* ========================================= */}
      {/* MODAL / POPUP TAMBAH & EDIT FILTER */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[640px] rounded-[16px] shadow-2xl overflow-hidden flex flex-col border border-gray-300">
            
            <div className="px-8 py-5 bg-[#F9F9F9] border-b border-gray-200">
              <h2 className="font-bold text-[32px] text-[#3A3A3A]">
                 {modalMode === "edit" ? "Edit Filter" : "Tambah Filter Baru"}
              </h2>
            </div>

            <div className="p-8 space-y-6">
              
              <div>
                <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Nama Filter</label>
                <input 
                  type="text" 
                  defaultValue={modalMode === "edit" ? selectedFilter?.name : ""}
                  placeholder="e.g. Sunset Glow" 
                  className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]" 
                />
              </div>

              <div>
                <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">CSS Filter Value</label>
                <input 
                  type="text" 
                  defaultValue={modalMode === "edit" ? selectedFilter?.css : ""}
                  placeholder="e.g. contrast(1.3) saturate(1.4)" 
                  className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]" 
                />
                <p className="text-[13px] text-[#817E7E] mt-2 font-bold">
                  Gunakan CSS filter syntax: brightness(), contrast(), saturate(), sepia(), grayscale(), hue-rotate(), blur()
                </p>
              </div>

              <div>
                <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Preview</label>
                <div className="relative w-full h-[200px] bg-gradient-to-br from-[#CBAD6F] via-[#6B5A3A] to-[#BB7640] rounded-[9px] border border-gray-400 overflow-hidden">
                   {/* Bola Kiri Atas */}
                   <div className="absolute top-[30px] left-[150px] w-[70px] h-[70px] bg-[#D2B271] rounded-full"></div>
                   {/* Kotak Kanan Bawah */}
                   <div className="absolute bottom-[30px] right-[80px] w-[140px] h-[60px] bg-[#858B73] rounded-[14px]"></div>
                </div>
                <button className="w-full mt-3 py-2.5 bg-white border border-gray-400 rounded-[9px] font-bold text-[15px] text-[#5A5A5A] hover:bg-gray-50">
                   Preview Filter
                </button>
              </div>

              <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-6 py-4 rounded-full">
                <h3 className="font-bold text-[16px] text-[#5A5A5A]">Aktifkan filter ini</h3>
                <div className="w-[46px] h-[22px] bg-[#A29C9C] rounded-full flex items-center px-1 cursor-pointer">
                   <div className="w-[16px] h-[16px] bg-[#CF4D4D] rounded-full"></div>
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
                {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Filter"}
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
              Apakah Anda yakin ingin <span className="font-bold text-black">{confirmAction.toLowerCase()}</span> filter <span className="font-bold text-[#38635A]">"{selectedFilter?.name}"</span>?
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