"use client";

import React, { useEffect, useState } from "react";

// DATA DUMMY PAKET
// const initialPackages = [
//   { id: 1, name: "Glambot Solo", badge: "Solo", price: "35,000", duration: 5, people: 1, print: 1, icon: "/paket1.png", status: "Aktif" },
//   { id: 2, name: "Glambot Duo", badge: "Duo", price: "45,000", duration: 5, people: 2, print: 2, icon: "/paket2.png", status: "Aktif" },
//   { id: 3, name: "Glambot Group", badge: "Group", price: "55,000", duration: 7, people: 5, print: 2, icon: "/paket3.png", status: "Aktif" },
//   { id: 4, name: "Glambot Premium", badge: "Premium", price: "75,000", duration: 10, people: 5, print: 4, icon: "/paket4.png", status: "Aktif" },
// ];

export default function PaketPage() {
  // 1. Tambahin ini di dalem komponen lu
const [packages, setPackages] = useState<any[]>([]);
const [formData, setFormData] = useState<any>({}); 

// 2. Tambahin fungsi fetch (biar datanya dapet dari Golang, bukan dummy)
const fetchPackages = async () => {
    try {
        const res = await fetch("http://localhost:8080/api/admin/packages");
        const data = await res.json();
        console.log(data)
        setPackages(data || []);
  

    } catch (err) { console.error("Gagal load:", err); }
};

// 3. Panggil fetch tiap halaman dimuat
useEffect(() => {
    fetchPackages();
}, []);
  
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

  // STATE PENGATURAN BAWAH
  const [duration, setDuration] = useState("300");
  const [merchantName, setMerchantName] = useState("Glambot Studio - Pratama Shabil");
  const [merchantId, setMerchantId] = useState("GLMBT-001");

  const handleAddClick = () => {
    setModalMode("add");
    setSelectedPackage(null);
    setIsPopular(false);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleEditClick = (pkg: any) => {
    setModalMode("edit");
    setSelectedPackage(pkg);
    setIsPopular(false);
    setIsActive(pkg.status === "Aktif");
    setIsModalOpen(true);
  };

  const handleConfirmAction = (action: string, pkg: any) => {
    setConfirmAction(action);
    setSelectedPackage(pkg);
    setIsConfirmOpen(true);
  };

  const executeAction = () => {
    setIsConfirmOpen(false);
  };

  // Di Next.js lu nanti


  return (
    <div className="p-8 bg-[#ECF0EE] min-h-screen relative font-inter">
      
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

 

      {/* PAKET GRID (Baris Atas) */}
      <div className="grid grid-cols-4 gap-6 mb-10">
       {packages.map((pkg) => (
            <div key={pkg.ID} className="..."> 
            {/* Header Card: Ikon dalam kotak abu-abu + Nama Paket */}
            <div className="flex items-center gap-3 mb-4">
               <div className="w-[56px] h-[56px] bg-[#E3E3E3] border border-gray-300 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={pkg.icon} alt={pkg.name} className="w-[42px] h-[42px] object-cover" />
               </div>
               <div>
                   <h1 className="text-2xl">{pkg.name}</h1>
                 <h3 className="font-bold text-[18px] text-[#3A3A3A] leading-tight mb-0.5">{pkg.name}</h3>
                 <p className="text-[13px] font-bold italic text-[#386359]">{pkg.badge}</p>
               </div>
            </div>
            
            <h2 className="font-bold text-[32px] text-[#3F6E68] mb-4">Rp {pkg.price}</h2>
            <h2 className="font-bold text-[32px] text-[#3F6E68] mb-4">Rp {pkg.desc}</h2>

            
            {/* 3 Kotak Spesifikasi Pake Ikon Custom */}
            <div className="flex justify-between gap-2 mb-4">
               <div className="flex-1 bg-[#ECEAEA] border border-gray-200 rounded-[6px] py-2.5 flex flex-col items-center justify-center">
                 <img src="/durasi.png" alt="Durasi" className="w-[18px] h-[18px] object-contain mb-1.5 opacity-70" />
                 <span className="font-bold text-[11px] text-[#444]">{pkg.duration} mnt</span>
                 <span className="italic text-[9px] text-[#757575]">SESI</span>
               </div>
               <div className="flex-1 bg-[#ECEAEA] border border-gray-200 rounded-[6px] py-2.5 flex flex-col items-center justify-center">
                 <img src="/orang.png" alt="Orang" className="w-[18px] h-[18px] object-contain mb-1.5 opacity-70" />
                 <span className="font-bold text-[11px] text-[#444]">{pkg.people}</span>
                 <span className="italic text-[9px] text-[#757575]">ORANG</span>
               </div>
               <div className="flex-1 bg-[#ECEAEA] border border-gray-200 rounded-[6px] py-2.5 flex flex-col items-center justify-center">
                 <img src="/cetak1.png" alt="Print" className="w-[18px] h-[18px] object-contain mb-1.5 opacity-70" />
                 <span className="font-bold text-[11px] text-[#444]">{pkg.Print}x</span>
                 <span className="italic text-[9px] text-[#757575]">PRINT</span>
               </div>
            </div>

            {/* Status dengan ikon selesai & gagal */}
            <div className="mb-4">
               <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-[7px] border border-gray-300 font-bold text-[11px] ${pkg.status === 'Aktif' ? 'bg-[#DCE3DC] text-[#3A3A3A]' : 'bg-[#E8CECE] text-[#3A3A3A]'}`}>
                  <img src={pkg.status === 'Aktif' ? '/selesai.png' : '/gagal.png'} alt={pkg.status} className="w-3.5 h-3.5" />
                  {pkg.status}
               </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-auto">
              <button 
                onClick={() => handleEditClick(pkg)}
                className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[12px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => handleConfirmAction("Nonaktifkan", pkg)}
                className="flex-1 py-1.5 rounded-[8px] border border-gray-300 font-bold text-[12px] text-[#3A3A3A] bg-white hover:bg-gray-50 transition-colors"
              >
                Nonaktif
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

      {/* PENGATURAN GRID (Baris Bawah) */}
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
           
           {/* Tombol Menit Dinamis */}
           <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setDuration("180")} 
                className={`flex-1 py-1.5 border rounded-[6px] text-[12px] font-bold transition-colors ${duration === "180" ? "bg-[#386359] text-white border-transparent shadow-sm" : "border-gray-300 text-[#3A3A3A] hover:bg-gray-50"}`}
              >
                3 menit
              </button>
              <button 
                onClick={() => setDuration("300")} 
                className={`flex-1 py-1.5 border rounded-[6px] text-[12px] font-bold transition-colors ${duration === "300" ? "bg-[#386359] text-white border-transparent shadow-sm" : "border-gray-300 text-[#3A3A3A] hover:bg-gray-50"}`}
              >
                5 menit
              </button>
              <button 
                onClick={() => setDuration("600")} 
                className={`flex-1 py-1.5 border rounded-[6px] text-[12px] font-bold transition-colors ${duration === "600" ? "bg-[#386359] text-white border-transparent shadow-sm" : "border-gray-300 text-[#3A3A3A] hover:bg-gray-50"}`}
              >
                10 menit
              </button>
           </div>
           <button onClick={() => alert("Durasi Disimpan!")} className="w-full py-3 bg-[#386359] text-white font-bold rounded-[10px] mt-auto hover:bg-[#2c4e47] transition-colors">Simpan Durasi</button>
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
           
           <button onClick={() => alert("Data Merchant Disimpan!")} className="w-full py-3 bg-[#386359] text-white font-bold rounded-[10px] mt-auto hover:bg-[#2c4e47] transition-colors">Simpan Merchant</button>
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
           
           <button onClick={() => alert("Pengaturan Kamera Disimpan!")} className="w-full py-3 bg-[#386359] text-white font-bold rounded-[10px] mt-auto hover:bg-[#2c4e47] transition-colors">Simpan Kamera</button>
        </div>

      </div>

      {/* ========================================= */}
      {/* MODAL / POPUP TAMBAH & EDIT PAKET */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[640px] rounded-[16px] shadow-2xl overflow-hidden flex flex-col border border-gray-300">
            
            <div className="px-8 py-5 bg-[#F9F9F9] border-b border-gray-200">
              <h2 className="font-bold text-[32px] text-[#3A3A3A]">
                 {modalMode === "edit" ? "Edit Paket" : "Tambah Paket Baru"}
              </h2>
            </div>

            <div className="p-8 space-y-4">
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Nama Paket</label>
                  <input type="text" defaultValue={selectedPackage?.name || ""} placeholder="e.g Glambot Solo" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Badge / Label</label>
                  <input type="text" defaultValue={selectedPackage?.badge || ""} placeholder="e.g Solo / Duo / Group" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Icon / Emoji</label>
                  <div className="flex gap-2">
                     <input type="text" placeholder="Emoji / Teks" className="flex-1 px-4 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                     <label className="px-5 py-2.5 bg-[#E8E8E8] border border-gray-400 rounded-full font-bold text-[#5A5A5A] text-[13px] cursor-pointer hover:bg-gray-200 flex items-center justify-center shrink-0">
                        Upload
                        <input type="file" className="hidden" accept="image/*" />
                     </label>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Harga</label>
                  <div className="flex border border-gray-400 rounded-full overflow-hidden">
                     <div className="px-4 py-2.5 bg-white font-bold text-gray-500 border-r border-gray-400">Rp</div>
                     <input type="number" defaultValue={selectedPackage?.price?.replace(',', '') || ""} placeholder="35000" className="w-full px-3 py-2.5 outline-none focus:bg-gray-50 text-[14px]" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Durasi Sesi (menit)</label>
                  <input type="number" defaultValue={selectedPackage?.duration || ""} placeholder="5" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Maks. Orang</label>
                  <input type="number" defaultValue={selectedPackage?.people || ""} placeholder="1" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
              </div>

              <div className="flex gap-4 mb-2">
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Jumlah Cetak (4R)</label>
                  <input type="number" defaultValue={selectedPackage?.print || ""} placeholder="1" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-[15px] text-[#5A5A5A] mb-1.5">Package ID</label>
                  <input type="text" placeholder="solo" className="w-full px-5 py-2.5 border border-gray-400 rounded-full focus:outline-none focus:border-[#38635A] text-[14px]" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-6 py-3.5 rounded-[20px]">
                <h3 className="font-normal text-[16px] text-[#5A5A5A]">Tandai sebagai <span className="font-bold text-black">Populer</span> <span className="text-[#817E7E]">(badge <span className="text-[#38635A]">★</span> terpopuler)</span></h3>
                <div onClick={() => setIsPopular(!isPopular)} className={`w-[46px] h-[22px] rounded-full flex items-center px-1 cursor-pointer transition-colors ${isPopular ? 'bg-[#3F6E68]' : 'bg-[#A29C9C]'}`}>
                   <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform ${isPopular ? 'translate-x-[22px]' : 'bg-[#CF4D4D]'}`}></div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#F8FAF9] border border-gray-300 px-6 py-3.5 rounded-[20px]">
                <h3 className="font-normal text-[16px] text-[#5A5A5A]">Aktifkan paket ini</h3>
                <div onClick={() => setIsActive(!isActive)} className={`w-[46px] h-[22px] rounded-full flex items-center px-1 cursor-pointer transition-colors ${isActive ? 'bg-[#3F6E68]' : 'bg-[#A29C9C]'}`}>
                   <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform ${isActive ? 'translate-x-[22px]' : 'bg-[#CF4D4D]'}`}></div>
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
                {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Paket"}
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
              Apakah Anda yakin ingin <span className="font-bold text-black">{confirmAction.toLowerCase()}</span> paket <span className="font-bold text-[#38635A]">"{selectedPackage?.name}"</span>?
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