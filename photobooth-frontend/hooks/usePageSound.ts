"use client";

import { useEffect } from "react";

interface UsePageSoundOptions {
  onEnded?: () => void;
  keepPlayingOnUnmount?: boolean;
}

// 🔊 Audio page yang lagi jalan — dishare biar bisa dipotong dari luar
//    (misal: user langsung pencet tombol yang punya suara sendiri,
//    suara intro halaman dipotong dulu biar nggak nabrak)
const pageAudioRef: { current: HTMLAudioElement | null } = { current: null };

export function stopPageSound() {
  if (pageAudioRef.current) {
    try {
      pageAudioRef.current.pause();
      pageAudioRef.current.currentTime = 0;
    } catch (e) { }
    pageAudioRef.current = null;
  }
}

/**
 * 🔊 usePageSound — hook buat auto-play audio pas page load.
 *
 * Cara pake:
 *
 * 1️⃣ Default (play langsung pas mount):
 *    usePageSound("/fase/pilih_paket.mpeg");
 *
 * 2️⃣ Beberapa suara berurutan (suara ke-2 nyambung setelah suara ke-1 selesai):
 *    usePageSound(["/fase/filter.mp3", "/fase/filter2.mp3"]);
 *
 * 3️⃣ Play kalo kondisi tertentu true (misal: pas status success):
 *    usePageSound("/fase/bayar_berhasil.mpeg", status === "success");
 *
 * 4️⃣ Dengan callback pas audio selesai:
 *    usePageSound("/fase/terima_kasih.mp3", true, {
 *      onEnded: () => router.push('/frame'),
 *      keepPlayingOnUnmount: true
 *    });
 *
 * Fitur:
 *   ✅ Auto-play pas mount (atau pas `enabled` jadi true)
 *   ✅ Bisa 1 suara atau daftar suara yang diputar berurutan
 *   ✅ Auto-stop pas navigate keluar (default) atau keep playing
 *   ✅ Anti double-play (StrictMode + Fast Refresh safe)
 *   ✅ Silent AbortError (dev-only noise)
 *   ✅ onEnded callback pas SEMUA suara selesai (suara terakhir)
 *
 * ⚠️ NOTE: Modern browser block autoplay tanpa user interaction.
 * Di booth flow, user udah interact di page sebelumnya jadi harusnya jalan.
 * Kalo di dev buka page langsung dari URL, kadang ke-block — normal.
 */
export function usePageSound(
  soundPath: string | string[],
  enabled: boolean = true,
  options: UsePageSoundOptions = {}
) {
  const { onEnded, keepPlayingOnUnmount = false } = options;

  // 🎯 Normalize ke array + bikin key stabil buat dependency
  //    (biar inline array literal gak nge-restart audio tiap render)
  const paths = (Array.isArray(soundPath) ? soundPath : [soundPath]).filter(Boolean);
  const pathsKey = paths.join("|");

  useEffect(() => {
    if (!pathsKey || !enabled) return;

    const queue = pathsKey.split("|");
    let cancelled = false;
    let currentAudio: HTMLAudioElement | null = null;

    const playAt = (idx: number) => {
      if (cancelled) return;
      // Semua suara selesai → fire onEnded sekali
      if (idx >= queue.length) {
        if (onEnded) onEnded();
        return;
      }

      const src = queue[idx];
      const audio = new Audio(src);
      audio.preload = "auto";
      currentAudio = audio;
      pageAudioRef.current = audio;

      const goNext = () => {
        if (cancelled) return;
        playAt(idx + 1);
      };

      audio.addEventListener("ended", () => {
        if (cancelled) return;
        console.log(`🔊 [SOUND] ended: ${src}`);
        goNext();
      });

      // Kalo satu file gagal load (misal belum ada), skip ke berikutnya
      audio.addEventListener("error", () => {
        if (cancelled) return;
        console.warn(`🔇 [SOUND] ${src} error, skip ke berikutnya`);
        goNext();
      });

      audio.play()
        .then(() => {
          if (cancelled) {
            // Cleanup fire before play resolve — pause
            audio.pause();
            audio.currentTime = 0;
          } else {
            console.log(`🔊 [SOUND] playing: ${src}`);
          }
        })
        .catch((err) => {
          // AbortError = dev-only (StrictMode/Fast Refresh double-mount)
          // Silent, gak spam log
          if (err?.name === "AbortError") return;
          console.warn(`🔇 [SOUND] ${src} gagal autoplay:`, err?.message);
        });
    };

    playAt(0);

    // Cleanup
    return () => {
      cancelled = true;

      // Kalo keepPlayingOnUnmount = true, biarin audio jalan
      // (ref-nya juga dibiarin, biar tetep bisa dipotong stopPageSound)
      // Berguna untuk case terima-kasih dimana audio harus selesai penuh
      if (!keepPlayingOnUnmount && currentAudio) {
        try {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        } catch (e) { }
        if (pageAudioRef.current === currentAudio) pageAudioRef.current = null;
      }
    };
  }, [pathsKey, enabled]);
}