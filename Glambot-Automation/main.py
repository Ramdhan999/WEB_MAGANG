"""

Tracking and the robot session are controlled from the web dashboard / backend
(/tracking/* and /robot/enable|disable). Press Ctrl+C in this console to exit.

CLI:
  python main.py                    # Full mode
  python main.py --no-robot         # Vision only (dry-run robot)
  python main.py --ip 192.168.5.1   # Override Dobot IP
"""

import argparse
import sys
import threading
import time

# ── Block Ctrl+C during slow library loading ────────────────────────────────
print("⏳ Loading libraries, please wait... (do NOT press Ctrl+C)", flush=True)
if sys.platform == "win32":
    import ctypes
    _kernel32 = ctypes.windll.kernel32
    _kernel32.SetConsoleCtrlHandler(None, True)

from app.config            import load_config
from app.core.runtime      import Runtime
from app.detector          import GestureDetector
from app.web               import create_app

if sys.platform == "win32":
    _kernel32.SetConsoleCtrlHandler(None, False)
print("✅ Libraries loaded. Starting...", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Finger Gesture → Dobot Nova 5")
    parser.add_argument("--no-robot",  action="store_true", help="Vision only, no robot")
    parser.add_argument("--ip",        default=None,        help="Override Dobot IP from .env")
    parser.add_argument("--port",      type=int, default=None, help="Override HTTP port from .env")
    args = parser.parse_args()

    # ── Config ────────────────────────────────────────────────────
    config = load_config()
    if args.ip:
        config.dobot_ip = args.ip
    if args.port:
        config.port = args.port

    print()
    print("═" * 64)
    print("  Nova 5  Finger Gesture → Dobot   (UNIFIED)")
    print("  Glambot-style layout │ FSM with capture-lock")
    print("═" * 64)
    print()

    # ── Runtime (brain) ──────────────────────────────────────────
    runtime = Runtime(
        config,
        dry_run=args.no_robot,
    )

    readable = {
        k: (runtime.presets[v]["name"] if isinstance(v, int) and v in runtime.presets else v)
        for k, v in runtime.gesture_map.items() if v
    }
    print(f"  Gesture map: {readable}")

    # ── Hardware ─────────────────────────────────────────────────
    runtime.init_hardware()

    # ── Detector ─────────────────────────────────────────────────
    detector = GestureDetector(config, runtime=runtime)
    runtime.detector = detector
    detector.start(tracking_active_fn=lambda: runtime.tracking_active)

    # ── Web server ───────────────────────────────────────────────
    app = create_app(runtime)

    flask_thread = threading.Thread(
        target=lambda: app.run(
            host=config.host,
            port=config.port,
            threaded=True,
            use_reloader=False,
        ),
        daemon=True,
    )
    flask_thread.start()

    print()
    print("  ✓ Detection auto-started")
    print(f"  ✓ Dashboard → http://{config.host}:{config.port}")
    print()
    print("  [Ctrl+C] to exit")
    print()

    # ── Main loop ────────────────────────────────────────────────
    try:
        while runtime.running:
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n  [!] Ctrl+C")
    finally:
        runtime.stop()
        time.sleep(0.3)
        print("  ✓ Shutdown complete.")


if __name__ == "__main__":
    main()