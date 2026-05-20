"use client";

import React, { useState } from "react";

const allTemplates = [
  { id: 1, name: "Imlek Lantern", category: "STRIP", details: "Frame PNG · 3 foto · 1 sesi" },
  { id: 2, name: "Imlek Barongsai", category: "GRID", details: "Frame PNG · 3 foto · 1 sesi" },
  { id: 3, name: "Minecraft Pixel", category: "COLLAGE", details: "Frame PNG · 3 foto · 1 sesi" },
  { id: 4, name: "Classic Strip", category: "DUO", details: "Frame PNG · 3 foto · 1 sesi" },
];

export default function FramePage() {
  const [activeTab, setActiveTab] = useState("SEMUA");
  
  // STATE UNTUK MODAL FORM (TAMBAH/EDIT)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' atau 'edit'
  
  // STATE UNTUK MODAL KONFIRMASI (HAPUS/NONAKTIF)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(""); // 'Hapus' atau 'Nonaktif'
  
  // STATE UNTUK MENYIMPAN DATA TEMPLATE YANG LAGI DIPILIH
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const filteredTemplates = activeTab === "SEMUA" 
    ? allTemplates 
    : allTemplates.filter((t) => t.category === activeTab);

  // FUNGSI HANDLE TOMBOL
  const handleAddClick = () => {
    setModalMode("add");
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (template: any) => {
    setModalMode("edit");
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleConfirmAction = (action: string, template: any) => {
    setConfirmAction(action);
    setSelectedTemplate(template);
    setIsConfirmOpen(true);
  };

  const executeAction = () => {
    // Nanti logika hapus/nonaktif ke database taruh di sini
    setIsConfirmOpen(false);
  };

  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen relative font-inter">
      
      {/* HEADER SECTION */}
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

      {/* FILTER TABS */}
      <div className="flex gap-3 mb-8">
        {["SEMUA", "STRIP", "GRID", "COLLAGE", "DUO"].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-1.5 rounded-full font-bold text-[13px] border transition-colors ${
              activeTab === tab 
                ? "bg-[#38635A] text-white border-transparent" 
                : "bg-white text-[#3A3A3A] border-gray-400 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FRAME/TEMPLATE GRID */}
      <div className="grid grid-cols-4 gap-6">
        {filteredTemplates.map((t) => (
          <div key={t.id} className="bg-white p-4 rounded-[14px] border border-gray-300 shadow-sm">
            <div className="bg-[#ECF0EE] h-[220px] rounded-[10px] mb-4 border border-gray-300 relative">
               <span className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-[12px] font-bold border border-gray-300 text-[#294B6C]">Frame</span>
               <span className="absolute top-3 right-3 bg-[#C9F2E0] px-3 py-1 rounded-full text-[12px] font-bold text-[#5F6C66]">Aktif</span>
            </div>
            <h3 className="font-bold text-[18px] mb-1 text-[#3A3A3A]">{t.name}</h3>
            <p className="text-[13px] text-[#837D89] mb-4">{t.details}</p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleEditClick(t)}
                className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[13px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => handleConfirmAction("Nonaktifkan", t)}
                className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[13px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
              >
                Nonaktif
              </button>
              <button 
                onClick={() => handleConfirmAction("Hapus", t)}
                className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[13px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================= */}
      {/* MODAL / POPUP (TAMBAH & EDIT) */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[640px] rounded-[16px] shadow-2xl overflow-hidden flex flex-col border border-gray-300">
            
            <div className="px-8 py-5 bg-[#F9F9F9] border-b border-gray-200">
              <h2 className="font-bold text-[32px] text-[#3A3A3A]">
                {modalMode === "edit" ? "Edit Template" : "Tambah Template Baru"}
              </h2>
            </div>

            <div className="p-8 space-y-5">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Nama Template</label>
                  <input 
                    type="text" 
                    defaultValue={modalMode === "edit" ? selectedTemplate?.name : ""}
                    placeholder="e.g. Classic Strip" 
                    className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]" 
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Deskripsi</label>
                  <input 
                    type="text" 
                    defaultValue={modalMode === "edit" ? selectedTemplate?.details : ""}
                    placeholder="e.g. 4 foto vertikal" 
                    className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[15px]" 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Layout Type</label>
                  <select className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none appearance-none bg-white text-[15px] cursor-pointer">
                    <option>Photo Strip (3 foto)</option>
                    <option>Photo Strip (4 foto)</option>
                    <option>Grid (2x2 / 4 foto)</option>
                    <option>Grid (3x2 / 6 foto)</option>
                    <option>Collage (Kustom)</option>
                    <option>Duo (2 foto)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Theme</label>
                  <select className="w-full px-4 py-2 border border-gray-400 rounded-full focus:outline-none appearance-none bg-white text-[15px] cursor-pointer">
                    <option>Classic (Gold)</option>
                    <option>Modern (Minimalist)</option>
                    <option>Playful (Warna-warni)</option>
                    <option>Dark Mode</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#ECF0EE] border border-gray-300 p-4 rounded-[20px]">
                <div>
                  <h3 className="font-bold text-[16px] text-[#5A5A5A]">Mode Frame PNG Kustom</h3>
                  <p className="text-[12px] text-[#484646]">Upload PNG transparan + tentukan posisi slot foto manual</p>
                </div>
                <div className="w-[46px] h-[22px] bg-[#A29C9C] rounded-full flex items-center px-1 cursor-pointer">
                   <div className="w-[16px] h-[16px] bg-[#CF4D4D] rounded-full"></div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[16px] text-[#5A5A5A] mb-2">Preview</label>
                <div className="bg-[#ECF0EE] border border-gray-300 rounded-[20px] h-[200px] flex items-center justify-center">
                   <div className="w-[110px] bg-white border border-gray-300 rounded-[12px] p-2.5 flex flex-col gap-2 shadow-sm">
                      <div className="h-7 bg-white border border-gray-300 rounded-[4px]"></div>
                      <div className="h-7 bg-white border border-gray-300 rounded-[4px]"></div>
                      <div className="h-7 bg-white border border-gray-300 rounded-[4px]"></div>
                      <div className="h-7 bg-white border border-gray-300 rounded-[4px]"></div>
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-center border border-gray-300 p-4 rounded-[20px]">
                <h3 className="font-bold text-[16px] text-[#5A5A5A]">Aktifkan template ini</h3>
                <div className="w-[46px] h-[22px] bg-[#A29C9C] rounded-full flex items-center px-1 cursor-pointer">
                   <div className="w-[16px] h-[16px] bg-[#CF4D4D] rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="px-8 py-4 bg-[#ECF0EE] border-t border-gray-300 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-gray-400 rounded-full font-bold text-[#43515C] text-[15px] hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button className="px-6 py-2.5 bg-[#3F6E68] text-white rounded-full font-bold text-[15px] hover:bg-[#2c4e47] shadow-sm transition-colors">
                {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Template"}
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
              Apakah Anda yakin ingin <span className="font-bold text-black">{confirmAction.toLowerCase()}</span> template <span className="font-bold text-[#38635A]">"{selectedTemplate?.name}"</span>?
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