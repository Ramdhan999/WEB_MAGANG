"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ⏱️ useSessionCountdown — countdown 1 SESI yang NYAMBUNG antar halaman.
 *
 * Masalah lama: tiap halaman (frame/print-preview) punya timer `useState(180)`
 * sendiri yang RESET ke awal tiap kali komponen mount. Jadi bulak-balik
 * frame ↔ print-preview = timer ngulang terus (looping).
 *
 * Solusi: simpan DEADLINE absolut (timestamp ms) di sessionStorage per-txn.
 * Halaman pertama yang kebuka nge-set `deadline = now + durasi`. Halaman
 * berikutnya baca deadline yang SAMA → sisa waktu NGELANJUTIN, bukan reset.
 * Pindah/balik halaman berapa kali pun, jamnya tetap satu.
 *
 * Cara pakai:
 *   const timeLeft = useSessionCountdown(txn, SESSION_SECONDS, () => {
 *     // dipanggil SEKALI pas waktu habis
 *     router.push(`/filter?txn=${txn}`);
 *   });
 */

/** Durasi 1 sesi editing (frame + print-preview), dalam detik. */
export const SESSION_SECONDS = 300; // 5 menit

const keyFor = (txn: string) => `session_deadline_${txn}`;

// Baca sisa detik dari deadline yang ADA (read-only, buat nilai awal state).
// Kalau deadline belum ada → balikin durasi penuh; pembuatan deadline
// diserahkan ke tick() di dalam effect biar initializer tetap bersih.
function peekRemaining(txn: string, durationSeconds: number): number {
  if (typeof window === "undefined" || !txn) return durationSeconds;
  const raw = Number(window.sessionStorage.getItem(keyFor(txn)));
  if (!Number.isFinite(raw) || raw <= 0) return durationSeconds;
  return Math.max(0, Math.round((raw - Date.now()) / 1000));
}

export function useSessionCountdown(
  txn: string,
  durationSeconds: number = SESSION_SECONDS,
  onExpire?: () => void
): number {
  const [timeLeft, setTimeLeft] = useState(() => peekRemaining(txn, durationSeconds));

  // Simpan onExpire di ref biar closure-nya selalu yang terbaru TANPA bikin
  // effect re-run (kalau onExpire masuk deps, deadline bisa ke-reset).
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!txn) return;
    const key = keyFor(txn);

    const tick = () => {
      const now = Date.now();
      let deadline = Number(window.sessionStorage.getItem(key));

      // Belum ada / korup → mulai sesi baru dari sini.
      if (!Number.isFinite(deadline) || deadline <= 0) {
        deadline = now + durationSeconds * 1000;
        window.sessionStorage.setItem(key, String(deadline));
      }

      const remaining = Math.max(0, Math.round((deadline - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick(); // langsung sinkron pas mount (lanjutin sisa waktu, bukan reset)
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [txn, durationSeconds]);

  return timeLeft;
}
