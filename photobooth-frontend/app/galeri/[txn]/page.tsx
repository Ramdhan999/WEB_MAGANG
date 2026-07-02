"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

interface Photo {
  id: number;
  photo_path: string;
  slot_number: number;
}

interface GalleryData {
  transaction_id: string;
  template_name: string;
  created_at: string;
  photos: Photo[];
  frame_edited: string;
}

export default function GalleryPage() {
  const params = useParams();
  const txn = params.txn as string;

  const [data, setData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zipProgress, setZipProgress] = useState(0);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/gallery/${txn}`);
        if (!res.ok) {
          const errData = await res.json();
          setError(errData.error || "Galeri tidak ditemukan");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError("Gagal konek ke server");
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [txn]);

  const fullUrl = (path: string) => path.startsWith("http") ? path : `${BACKEND_URL}${path}`;

  const downloadOne = async (url: string, filename: string, idx?: number) => {
    if (idx !== undefined) setDownloadingIdx(idx);
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Fetch failed");
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    } catch (err) {
      console.error("Download error:", err);
      alert("Gagal download. Coba lagi atau tap-and-hold gambar di galeri.");
    } finally {
      if (idx !== undefined) setDownloadingIdx(null);
    }
  };

  const downloadAllZip = async () => {
    if (!data) return;
    setIsZipping(true);
    setZipProgress(0);
    try {
      const JSZip = (await import("jszip")).default;
      const { saveAs } = await import("file-saver");
      const zip = new JSZip();
      const folder = zip.folder(`Glambot-${txn.slice(0, 8)}`) || zip;

      const allFiles: { url: string; name: string }[] = [];
      if (data.frame_edited) {
        allFiles.push({ url: fullUrl(data.frame_edited), name: "frame-editan.jpg" });
      }
      data.photos.forEach((p, i) => {
        allFiles.push({ url: fullUrl(p.photo_path), name: `foto_${String(i + 1).padStart(2, '0')}.jpg` });
      });

      for (let i = 0; i < allFiles.length; i++) {
        try {
          const resp = await fetch(allFiles[i].url);
          const blob = await resp.blob();
          folder.file(allFiles[i].name, blob);
        } catch (e) {
          console.warn("Skip file:", allFiles[i].name);
        }
        setZipProgress(Math.round(((i + 1) / allFiles.length) * 100));
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Glambot-${txn.slice(0, 8)}.zip`);
    } catch (err) {
      console.error("ZIP error:", err);
      alert("Gagal bikin ZIP. Coba download satu-satu aja.");
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#E3D5D5' }}>
        <div className="w-12 h-12 border-[3px] border-[#3A9F86] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-[#395350] font-semibold text-sm">Memuat foto...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#E3D5D5' }}>
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <p className="text-5xl mb-3">😕</p>
          <h1 className="text-xl font-bold text-[#332C2C] mb-2">Galeri Tidak Ditemukan</h1>
          <p className="text-sm text-[#6F6F6F] mb-4">{error || "Coba scan QR lagi atau hubungi admin booth"}</p>
          <p className="text-xs text-[#9A9A9A]">ID: {txn}</p>
        </div>
      </main>
    );
  }

  const totalFiles = data.photos.length + (data.frame_edited ? 1 : 0);

  return (
    <main className="min-h-screen pb-24 select-none" style={{ backgroundColor: '#E3D5D5' }}>
      {/* Top gradient bar */}
      <div className="bg-gradient-to-r from-[#467664] to-[#00FFA2] h-2 w-full"></div>

      {/* Content wrapper — constrained max width buat desktop */}
      <div className="max-w-[640px] mx-auto">

        {/* Header */}
        <header className="px-4 pt-5 pb-3">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-[22px] font-extrabold text-[#332C2C] tracking-tight leading-none">Foto Kamu 📸</h1>
              <p className="text-xs text-[#5A7470] mt-1">Hasil dari Glambot Photobooth</p>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest text-[#7A7979] font-bold">Sesi</div>
              <div className="text-[11px] text-[#332C2C] font-mono">{txn.slice(0, 8)}</div>
              <div className="text-[9px] text-[#7A7979] mt-0.5">{new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </header>

        {/* Frame editan — fixed max 280px, centered */}
        {data.frame_edited && (
          <section className="px-4 mb-5">
            <h2 className="text-[14px] font-bold text-[#332C2C] mb-2 flex items-center gap-2">
              <span className="text-base">✨</span> Frame Editan
              <span className="text-[10px] font-normal text-[#7A7979] ml-1">(hasil filter & sticker)</span>
            </h2>
            <div className="max-w-[280px] mx-auto bg-white rounded-xl p-2.5 shadow-md border border-[#54868A]/30">
              <div
                className="relative aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden mb-2 cursor-pointer active:opacity-80 transition-opacity"
                onClick={() => setSelectedPhoto(fullUrl(data.frame_edited))}
              >
                <img src={fullUrl(data.frame_edited)} className="w-full h-full object-contain" alt="Frame editan" />
                <div className="absolute top-1.5 right-1.5 bg-[#FBB400] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md">★ EDIT</div>
              </div>
              <button
                onClick={() => downloadOne(fullUrl(data.frame_edited), `frame-${txn.slice(0, 8)}.jpg`)}
                className="w-full h-9 bg-[#3A9F86] hover:bg-[#2E706D] active:scale-95 transition-all rounded-lg text-white text-[13px] font-bold shadow-sm flex items-center justify-center gap-1.5"
              >
                <span className="text-sm">📥</span> Download Frame
              </button>
            </div>
          </section>
        )}

        {/* Foto mentah — compact grid */}
        <section className="px-4 mb-5">
          <h2 className="text-[14px] font-bold text-[#332C2C] mb-2 flex items-center gap-2">
            <span className="text-base">🖼️</span> Semua Foto
            <span className="text-[10px] font-normal text-[#7A7979] ml-1">({data.photos.length} foto)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {data.photos.map((photo, i) => (
              <div key={photo.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-[#54868A]/30 flex flex-col">
                <div
                  className="aspect-[4/3] bg-gray-100 cursor-pointer active:opacity-80 transition-opacity"
                  onClick={() => setSelectedPhoto(fullUrl(photo.photo_path))}
                >
                  <img src={fullUrl(photo.photo_path)} className="w-full h-full object-cover" alt={`Foto ${i + 1}`} />
                </div>
                <button
                  onClick={() => downloadOne(fullUrl(photo.photo_path), `foto_${String(i + 1).padStart(2, '0')}.jpg`, i)}
                  disabled={downloadingIdx === i}
                  className="w-full h-7 bg-[#3A9F86]/10 hover:bg-[#3A9F86]/20 active:scale-95 text-[#2E706D] text-[11px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-60"
                >
                  {downloadingIdx === i ? "⏳..." : "📥 Save"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Info banner */}
        <section className="px-4 mb-4">
          <div className="bg-[#FFF6E5] border-l-[3px] border-[#D29E38] rounded-lg p-2.5 text-[11px] text-[#BF7D32] leading-tight">
            <p className="font-bold mb-0.5">💡 Tips simpan foto:</p>
            <ul className="space-y-0.5 pl-0.5">
              <li>• Tap "Save" — foto masuk Downloads HP</li>
              <li>• Atau tap-and-hold foto → "Save image"</li>
            </ul>
          </div>
        </section>
      </div>

      {/* Fixed bottom: download all — constrained width */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-30">
        <div className="max-w-[640px] mx-auto">
          <button
            onClick={downloadAllZip}
            disabled={isZipping}
            className="w-full h-11 bg-[#3A9F86] hover:bg-[#2E706D] active:scale-95 transition-all rounded-xl text-white font-bold text-[13px] shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span className="text-base">📦</span>
            {isZipping ? `Menyiapkan... ${zipProgress}%` : `Download Semua sebagai ZIP`}
          </button>
          <p className="text-[10px] text-center text-[#7A7979] mt-1">{totalFiles} file dalam 1 ZIP</p>
        </div>
      </div>

      {/* Fullscreen preview */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} className="max-w-full max-h-[85vh] object-contain" alt="Preview" onClick={(e) => e.stopPropagation()} />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="fixed top-4 right-4 w-11 h-11 bg-white/20 backdrop-blur-md rounded-full text-white text-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px]">
            Tap-and-hold gambar buat simpan
          </div>
        </div>
      )}

      <style jsx global>{`
        body { background-color: #E3D5D5; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
        html, body { font-family: 'Inter', sans-serif; }
      `}</style>
    </main>
  );
}