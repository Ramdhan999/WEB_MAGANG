"use client";

import { useEffect } from "react";

interface UsePageSoundOptions {
  onEnded?: () => void;
  keepPlayingOnUnmount?: boolean;
}

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
 * 3️⃣ Dengan callback pas audio selesai:
 *    usePageSound("/fase/terima_kasih.mp3", true, {
 *      onEnded: () => router.push('/frame'),
 *      keepPlayingOnUnmount: true
 *    });
 *
 * Fitur:
 *   ✅ Auto-play pas mount (atau pas `enabled` jadi true)
 *   ✅ Auto-stop pas navigate keluar (default) atau keep playing
 *   ✅ Anti double-play (StrictMode + Fast Refresh safe)
 *   ✅ Silent AbortError (dev-only noise)
 *   ✅ onEnded callback untuk trigger action pas audio selesai
 *
 * ⚠️ NOTE: Modern browser block autoplay tanpa user interaction.
 * Di booth flow, user udah interact di page sebelumnya jadi harusnya jalan.
 * Kalo di dev buka page langsung dari URL, kadang ke-block — normal.
 */
export function usePageSound(
  soundPath: string,
  enabled: boolean = true,
  options: UsePageSoundOptions = {}
) {
  const { onEnded, keepPlayingOnUnmount = false } = options;

  useEffect(() => {
    if (!soundPath || !enabled) return;

    const audio = new Audio(soundPath);
    audio.preload = "auto";

    let cancelled = false;

    // Handler audio selesai natural
    const handleEnded = () => {
      if (cancelled) return;
      console.log(`🔊 [SOUND] ended: ${soundPath}`);
      if (onEnded) onEnded();
    };

    audio.addEventListener("ended", handleEnded);

    audio.play()
      .then(() => {
        if (cancelled) {
          // Cleanup fire before play resolve — pause
          audio.pause();
          audio.currentTime = 0;
        } else {
          console.log(`🔊 [SOUND] playing: ${soundPath}`);
        }
      })
      .catch((err) => {
        // AbortError = dev-only (StrictMode/Fast Refresh double-mount)
        // Silent, gak spam log
        if (err?.name === "AbortError") return;
        console.warn(`🔇 [SOUND] ${soundPath} gagal autoplay:`, err?.message);
      });

    // Cleanup
    return () => {
      cancelled = true;
      audio.removeEventListener("ended", handleEnded);

      // Kalo keepPlayingOnUnmount = true, biarin audio jalan
      // Berguna untuk case terima-kasih dimana audio harus selesai penuh
      if (!keepPlayingOnUnmount) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) { }
      }
    };
  }, [soundPath, enabled]);
}