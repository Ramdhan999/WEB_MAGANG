"use client";

import { useEffect } from "react";

/**
 * 🔊 usePageSound — hook buat auto-play audio pas page load.
 *
 * Cara pake:
 *
 * 1️⃣ Default (play langsung pas mount):
 *    usePageSound("/fase/pilih_paket.mpeg");
 *
 * 2️⃣ Play kalo kondisi tertentu true (misal: pas status success):
 *    usePageSound("/fase/bayar_berhasil.mpeg", status === "success");
 *
 * 3️⃣ Delay/conditional biasa:
 *    usePageSound("/fase/result.mpeg", !isLoading && hasFinished);
 *
 * Fitur:
 *   ✅ Auto-play pas mount (atau pas `enabled` jadi true)
 *   ✅ Auto-stop pas navigate keluar (cleanup)
 *   ✅ Auto-stop juga kalo `enabled` berubah dari true → false
 *   ✅ Anti double-play (kalo user navigate cepet, sebelum audio jalan)
 *   ✅ Log info di console (buat debug)
 *   ✅ Kalo browser block autoplay → cuma warning, gak crash
 *
 * ⚠️ NOTE: Modern browser block autoplay tanpa user interaction.
 * Di booth flow, user udah interact di page sebelumnya jadi harusnya jalan.
 * Kalo di dev buka page langsung dari URL, kadang ke-block — normal.
 */
export function usePageSound(soundPath: string, enabled: boolean = true) {
  useEffect(() => {
    if (!soundPath || !enabled) return;

    const audio = new Audio(soundPath);
    audio.preload = "auto";

    let cancelled = false;

    audio.play()
      .then(() => {
        if (cancelled) {
          // User keburu navigate keluar / kondisi berubah sebelum audio jalan → cleanup
          audio.pause();
          audio.currentTime = 0;
        } else {
          console.log(`🔊 [SOUND] playing: ${soundPath}`);
        }
      })
      .catch((err) => {
        console.warn(`🔇 [SOUND] ${soundPath} gagal autoplay:`, err?.message);
      });

    // Cleanup pas unmount ATAU pas enabled berubah jadi false
    return () => {
      cancelled = true;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) { }
    };
  }, [soundPath, enabled]);
}