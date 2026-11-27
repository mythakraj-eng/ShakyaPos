#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SHAKYA POS (दीदी की दुकान) — 1-Tap Pydroid 3 Localhost Server & App Launcher
Why use this launcher?
- Opening `index.html` via Android File Manager (`content://com.google.android...`)
  causes Chrome to BLOCK Live Camera QR Scanning, Torch, and PWA Service Workers.
- Running this script in Pydroid 3 starts a superfast Local Server on
  `http://127.0.0.1:8080/index.html` (which Chrome treats as a 100% Secure Context!)
  and automatically opens Shakya POS in your browser with full Live Camera QR Scanning!
"""

import os
import sys
import time
import socket
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8080


def find_shakya_pos_folder():
    """Automatically locates the folder containing Shakya POS index.html."""
    candidates = [
        os.path.join(os.getcwd(), "index.html"),
        "/storage/emulated/0/Download/index.html",
        "/storage/emulated/0/Downloads/index.html",
    ]
    for base in [os.getcwd(), "/storage/emulated/0", "/storage/emulated/0/Download"]:
        if os.path.isdir(base):
            try:
                for entry in os.listdir(base):
                    sub = os.path.join(base, entry, "index.html")
                    if sub not in candidates:
                        candidates.append(sub)
            except Exception:
                pass

    for path in candidates:
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    txt = f.read()
                if "SHAKYA COSMETIC" in txt or "shakya_pos_data" in txt:
                    return os.path.dirname(os.path.abspath(path))
            except Exception:
                pass

    # Fallback to current working directory if index.html is right here
    if os.path.isfile(os.path.join(os.getcwd(), "index.html")):
        return os.getcwd()
    return None


class NoCachePOSHandler(SimpleHTTPRequestHandler):
    """Serves Shakya POS with fresh headers so updates show up immediately without stale cache."""

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Keep terminal clean; only show important page requests
        msg = fmt % args
        if "GET /index.html" in msg or "GET / " in msg:
            print(f"  [🟢 App Opened] {msg}")


def get_free_port(preferred=8080):
    for p in [preferred, 8081, 8085, 8888, 9090]:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    return preferred


def launch_android_browser(url):
    """Tries Android intent `am start`, termux-open-url, and Python webbrowser to open Chrome automatically."""
    time.sleep(0.8)
    print(f"\n🚀 Opening Shakya POS in Browser: {url}")

    # 1. Try standard Python webbrowser (works on Pydroid 3)
    try:
        opened = webbrowser.open(url)
        if opened:
            return
    except Exception:
        pass

    # 2. Try Android Activity Manager intent
    try:
        os.system(f'am start -a android.intent.action.VIEW -d "{url}" >/dev/null 2>&1')
    except Exception:
        pass


def main():
    print("=" * 64)
    print("✨ दीदी की दुकान • SHAKYA POS — PYDROID 3 SERVER LAUNCHER ✨")
    print("=" * 64)

    target_dir = find_shakya_pos_folder()
    if not target_dir:
        print("❌ ERROR: 'index.html' nahi mila!")
        print("👉 Kripya is script ko usi folder mein save karein jahan aapka 'index.html' rakha hai.")
        return

    os.chdir(target_dir)
    port = get_free_port(PORT)
    stamp = int(time.time())
    url = f"http://127.0.0.1:{port}/index.html?v={stamp}"

    print(f"📂 App Folder : {target_dir}")
    print(f"🌐 Live URL   : {url}")
    print("-" * 64)
    print("✅ Live Camera QR Scanner, Torch, Zoom & Queue Scan 100% Unlocked!")
    print("💡 Agar browser apne-aap na khule, toh Chrome mein ye link kholein:")
    print(f"\n   👉  http://127.0.0.1:{port}/index.html\n")
    print("⚠️ Jab tak dukaan ka kaam chale, Pydroid 3 ko background mein chalu rakhein.")
    print("=" * 64)

    # Auto-open browser in background thread
    threading.Thread(target=launch_android_browser, args=(url,), daemon=True).start()

    server = ThreadingHTTPServer(("127.0.0.1", port), NoCachePOSHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shakya POS Server band kiya gaya.")
        server.server_close()


if __name__ == "__main__":
    main()