// hooks/useUnlockAudio.ts
"use client";
import { useEffect } from "react";

export function useUnlockAudio() {
  useEffect(() => {
    const unlock = () => {
      // Play silent audio buat "unlock" browser audio context
      const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      audio.volume = 0.01;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        console.log("🔓 [AUDIO] Unlocked untuk sesi ini");
      }).catch(() => { });

      // Sekali unlock, gak perlu listener lagi
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);
}