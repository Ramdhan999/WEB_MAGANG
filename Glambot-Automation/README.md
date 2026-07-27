<div align="center">

# 🤖✋ Gesture Control — Dobot Nova 5

**Kendalikan lengan robot Dobot Nova 5 hanya dengan gerakan tangan.**

Kamera membaca gesture jari lewat MediaPipe → robot bergerak ke posisi (preset)
yang sesuai → semuanya bisa dipantau dari web dashboard.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Web%20Dashboard-000000?logo=flask&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Hand%20Gesture-0097A7?logo=google&logoColor=white)
![Dobot](https://img.shields.io/badge/Robot-Dobot%20Nova%205-FF6F00)

</div>

---

## ✨ Fitur Utama

- 🖐️ **Kontrol tanpa sentuh** — cukup tunjukkan gesture jari ke kamera.
- 🎯 **Preset posisi** — tiap gesture memindahkan robot ke posisi yang sudah disimpan.
- 🔒 **Sistem kunci & sesi** — robot baru bergerak setelah sesi dibuka, aman dari gerakan tak sengaja.
- 🌐 **Web dashboard** — lihat kamera & status robot langsung dari browser.
- ⚙️ **Semua diatur lewat `.env`** — ganti IP, kamera, kecepatan tanpa menyentuh kode.

---

## 🚀 Mulai Cepat (Quick Start)

> Butuh **Python 3.10+** dan robot Dobot Nova 5 yang terhubung ke jaringan yang sama.

**1. Clone & masuk ke folder**
```powershell
git clone <url-repo>
cd Glambot-Automation
```

**2. Buat virtual environment & install dependensi**
```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**3. Siapkan konfigurasi**
```powershell
copy .env.example .env
```
Buka `.env`, lalu sesuaikan minimal:
- `DOBOT_IP` → IP robot kamu
- `CAMERA_INDEX` → `0` (webcam utama) atau `1` (webcam kedua)
- `BACKEND_URL` → alamat backend kamu (boleh dibiarkan localhost saat uji coba)

**4. Jalankan**
```powershell
python main.py
```
Lalu buka dashboard di **http://localhost:5001** 🎉
Tekan `Ctrl + C` di terminal untuk berhenti.

---

## 🕹️ Pilihan Saat Menjalankan

| Perintah                          | Fungsi                                      |
|-----------------------------------|---------------------------------------------|
| `python main.py`                  | Mode penuh (kamera + robot)                 |
| `python main.py --no-robot`       | Hanya kamera/visi, robot tidak digerakkan   |
| `python main.py --ip 192.168.5.1` | Pakai IP robot lain (menimpa `.env`)        |
| `python main.py --port 5001`      | Pakai port web lain (menimpa `.env`)        |

---

## 🔐 Cara Pakai Sesi

Robot **tidak langsung aktif** saat aplikasi dijalankan — harus dibuka sesinya dulu:

1. **Mulai sesi** → robot menyala, pulang ke posisi awal, siap menerima gesture.
2. **Tunjukkan gesture** → robot bergerak ke preset yang sesuai.
3. **Akhiri sesi** → robot kembali ke posisi awal lalu mati otomatis.

Selama sesi belum dibuka, dashboard menampilkan layar *"Sesi Belum Dimulai"* dan
semua gesture diabaikan — aman.

---

## 👋 Daftar Gesture

| Gesture            | Aksi                          |
|--------------------|-------------------------------|
| Telunjuk           | Preset 1                      |
| Telunjuk + Tengah  | Preset 2                      |
| + Jari Manis       | Preset 3                      |
| + Kelingking       | Preset 4                      |
| Semua jari         | Preset 5                      |
| Jempol             | Preset 6                      |
| Jempol + Telunjuk  | Preset 7                      |
| + Tengah           | Preset 8                      |
| + Jari Manis       | Preset 9                      |
| Kepalan (fist)     | Preset 10                     |

**Alur singkat:** 🔒 Terkunci → tahan gesture "semua jari" 2 detik → 🔓 Terbuka →
tunjukkan gesture preset → robot bergerak → ⏳ jeda sebentar → kembali 🔒 terkunci.

---

## 📁 Struktur Proyek

```
.
├── main.py            # Titik masuk aplikasi
├── .env.example       # Contoh konfigurasi — salin jadi .env
├── requirements.txt
├── app/
│   ├── config.py      # Pembaca konfigurasi dari .env
│   ├── core/          # Otak alur kerja + pipeline gerak
│   ├── detector/      # Pengenalan gesture (MediaPipe)
│   ├── robot/         # Driver Dobot Nova 5
│   └── web/           # Web dashboard (Flask)
├── config/            # Preset posisi robot (JSON)
└── model/             # Model MediaPipe
```

---

## ❓ Masalah Umum

- **Kamera tidak muncul?** Coba ganti `CAMERA_INDEX` di `.env` (`0`, `1`, `2`, …).
- **Robot tidak terhubung?** Pastikan `DOBOT_IP` benar dan PC satu jaringan dengan robot.
- **Ingin uji tanpa robot?** Jalankan dengan `--no-robot`.

---

<div align="center">
<sub>Dibuat untuk eksperimen kontrol robot berbasis gesture ✦ Dobot Nova 5</sub>
</div>
