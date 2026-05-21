"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SesiFotoPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(209);
  const [fotoDiambil, setFotoDiambil] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [showFlash, setShowFlash] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Timer Sisa Sesi
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 2. POLLING: Ngecek status saklar dari Golang tiap detik
  useEffect(() => {
    if (!isCameraActive || isCountingDown) return; 

    const checkTriggerStatus = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/trigger/status");
        const data = await res.json();

        // Kalau Golang jawab "true" (robot udah standby), gas ngitung mundur!
        if (data.start_countdown === true) {
          console.log("🔥 Sinyal dari Robot masuk! Robot udah standby. Mulai countdown 3..2..1...");
          startSession();
        }
      } catch (err) {
        // Error polling diabaikan
      }
    };

    const interval = setInterval(checkTriggerStatus, 1000);
    return () => clearInterval(interval);
  }, [isCameraActive, isCountingDown]);

  // 3. Logika Tombol ON (Membuka Layar 2 & Menyalakan Robot)
  const handleMainButtonClick = async () => {
    if (!isCameraActive) {
      window.open('/testimoni', '_blank', 'width=1200,height=800');
      setIsCameraActive(true); 

      try {
        console.log("Ngebangunin robot...");
        await fetch("http://localhost:8080/api/robot/enable", { method: "POST" });
      } catch (err) {}
    } else {
      localStorage.setItem('triggerWarning', Date.now().toString());
    }
  };

  // Alias fungsi buat frontend
  const openTestimoniScreen = handleMainButtonClick;

  // 4. Logika Countdown 3..2..1..
  const startSession = () => {
    setIsCountingDown(true);
    setCountdownNumber(3);
    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
      } else {
        clearInterval(timer);
        console.log("Countdown Selesai! JEPRET!");
        takePhoto(); 
      }
    }, 1000);
  };

  // 5. Eksekusi Jepret Hardware (DSLR) & Software (Preview Browser)
  const takePhoto = async () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    // A. Nyuruh Golang trigger DSLR buat jepret beneran
    try {
      await fetch("http://localhost:8080/api/camera/capture", { method: "POST" });
      console.log("📸 DSLR Berhasil Jepret!");
    } catch (err) {
      console.error("Gagal trigger DSLR:", err);
    }

    // B. Ambil snapshot Layar 1 buat disimpen ke memori (Galeri)
    if (imgRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // PERHATIAN: ctx.translate dan scale(-1,1) DIHAPUS 
        // karena gambar udah di-mirror sama Golang (flipJPEGHorizontal)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL("image/jpeg", 0.8); 
        const existingPhotos = JSON.parse(localStorage.getItem("capturedPhotos") || "[]");
        const newPhotos = [...existingPhotos, imageData];
        localStorage.setItem("capturedPhotos", JSON.stringify(newPhotos));
        
        setFotoDiambil(newPhotos.length);
      }
    }
    
    setIsCountingDown(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center pt-6 pb-12 px-4 md:px-8 select-none overflow-x-hidden" style={{ backgroundColor: '#E3D5D5' }}>
      
      {/* EFEK FLASH PUTIH PAS JEPRET */}
      {showFlash && <div className="fixed inset-0 bg-white z-[100] animate-pulse"></div>}
      
      {/* PROGRESS BAR */}
      <div className="absolute top-0 left-0 w-full h-[12px] z-50 flex">
        <div className="h-full w-[65%]" style={{ background: 'linear-gradient(270deg, #00FFA2 0%, #467664 99.09%)' }}></div>
        <div className="h-full flex-grow" style={{ background: 'linear-gradient(90deg, #151515 0%, #252525 100%)', transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}></div>
      </div>

      {/* CORE CONTENT WRAPPER */}
      <div className="w-full max-w-[1828px] flex flex-col items-center z-10 mt-12">
        
        {/* 1. TOP STATUS BAR */}
        <div className="w-full h-[74px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] px-8 flex items-center justify-between shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="w-[37px] h-[37px] bg-[#3F9C9B] border-[2px] border-[#235757] rounded-full flex items-center justify-center shadow-inner">
               <img src="/icon1.png" alt="timer icon" className="w-[20px] h-[20px] object-contain" />
            </div>
            <div className="flex flex-col justify-center leading-none">
              <span className="font-hind font-semibold text-[24px] tracking-[-0.08em] text-[#405444] text-right">
                Sisa waktu sesi:
              </span>
              <span className="font-inter font-medium text-[20px] text-[#FFAE00] mt-1 tracking-[-0.06em]" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.25)' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="w-[194px] h-[40px] bg-[#EAEAEA] border border-[#379AA1] rounded-[28px] flex items-center px-4 justify-between shadow-inner">
                <div className={`w-[18px] h-[18px] rounded-full shrink-0 ${isCameraActive ? 'bg-[#40FF00] shadow-[0_0_8px_#40FF00]' : 'bg-[#4B8C86]'}`}></div>
                <span className="font-hind font-semibold text-[20px] text-[#2B6E6A] tracking-[-0.08em] text-right pb-0.5">
                  Robot {isCameraActive ? 'Active' : 'Stand-by'}
                </span>
             </div>
             <div className="hidden md:block w-[158px] h-[12px] bg-[#373737] rounded-[35px] overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full w-[123px] rounded-[35px]" style={{ backgroundImage: 'linear-gradient(90deg, #18876F 0%, #2AEDC3 36.27%)' }}></div>
             </div>
          </div>
        </div>

        {/* 2. HEADER TEXT BAR */}
        <div className="w-full flex items-end justify-between px-2 mb-2">
          <h1 className="font-inter font-bold text-[24px] text-[#3F3F3F] tracking-[-0.05em] leading-none">
            Sesi Foto
          </h1>
          <span className="font-hind font-semibold text-[20px] text-[#2E8040] tracking-[-0.08em] text-right leading-none pb-0.5">
            {fotoDiambil} foto di ambil.
          </span>
        </div>

        {/* 3. MAIN WORKSPACE */}
        <div className="w-full h-[665px] bg-white border-[1.5px] border-[#54868A] rounded-[23px] p-[17px] flex flex-col shadow-sm mb-8">
          <h2 className="font-hind font-semibold text-[24px] text-[#303030] mb-3 ml-2 leading-none">
            LAYAR 1 - Kamera Utama
          </h2>
          <div className="w-full flex-grow bg-black border-[1.5px] border-[#54868A] rounded-[23px] relative flex flex-col items-center justify-center overflow-hidden">
            
            {/* STREAM DSLR GOLANG */}
            <img 
              ref={imgRef}
              src={isCameraActive ? "http://localhost:8080/api/camera/stream" : undefined} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
              crossOrigin="anonymous"
              alt="Live View DSLR"
            />

            {!isCameraActive && (
              <div className="flex flex-col items-center animate-pulse z-10">
                 <span className="text-[40px] mb-2">📸</span>
                 <span className="font-inter text-[#666666] text-[18px] font-medium text-center">
                   Klik tombol bulat di bawah untuk mulai sesi...
                 </span>
              </div>
            )}

            {/* OVERLAY HITUNG MUNDUR */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-30">
                <span className="text-[200px] font-black text-white drop-shadow-2xl animate-ping-once">{countdownNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. BOTTOM ACTION FOOTER AREA */}
        <div className="w-full grid grid-cols-3 items-center px-1">
          
          {/* Sisi Kiri (Kolom 1) */}
          <div className="flex justify-start">
            <button 
              onClick={() => router.push("/tutorial-kontrol")} 
              className="font-inter font-medium italic text-[24px] tracking-[-0.06em] text-[#0E1E1A] hover:opacity-70 transition-opacity"
            >
              ← KEMBALI
            </button>
          </div>

          {/* Sisi Tengah (Kolom 2) */}
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => router.push("/frame")} 
              className="flex items-center justify-center gap-3 w-[265px] h-[53px] bg-[#3A9F86] rounded-[23px] shadow-md transition-all hover:scale-105 active:scale-95 group"
            >
              <span className="font-inter font-extrabold italic text-[20px] text-white tracking-[-0.06em] leading-none pt-0.5">
                Lanjut
              </span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1 mt-0.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Tombol Bulat 1: Buat nyalain kamera & Robot */}
            <button 
              onClick={openTestimoniScreen}
              className={`w-[58px] h-[58px] border-2 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[2px_4px_4px_rgba(0,0,0,0.25)] shrink-0 ${isCameraActive ? 'bg-[#FF4B4B] border-[#8B2323]' : 'bg-white border-[#C4C4C4]'}`}
              title="Mulai Sesi (Buka Layar 2)"
            >
              {isCameraActive ? (
                <div className="w-[20px] h-[20px] bg-white rounded-full"></div>
              ) : (
                <div className="w-[32px] h-[32px] border-[3px] border-[#8F8F8F] rounded-full flex items-center justify-center relative">
                  <div className="w-[12px] h-[12px] bg-[#7F7F7F] border border-[#8F8F8F] rounded-full"></div>
                </div>
              )}
            </button>

            {/* Tombol Bulat 2: Timer Icon */}
            <button 
              className="w-[58px] h-[58px] bg-white border-2 border-[#C4C4C4] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[2px_4px_4px_rgba(0,0,0,0.25)] shrink-0"
            >
              <img src="/icon1.png" alt="timer icon" className="w-[32px] h-[32px] object-contain" />
            </button>
          </div>

          {/* Sisi Kanan (Kolom 3) */}
          <div className="hidden sm:block"></div>

        </div>

      </div>

      {/* CANVAS TERSEMBUNYI BUAT NYIMPEN FOTO */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;600;700&family=Inter:ital,wght@0,500;0,700;1,800&display=swap');
        .font-hind { font-family: 'Hind Vadodara', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        @keyframes ping-once { 0% { transform: scale(1); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        .animate-ping-once { animation: ping-once 1s ease-out infinite; }
      `}</style>
    </main>
  );
}