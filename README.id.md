# MeshWall — Bahasa Indonesia

MeshWall adalah dashboard pengelolaan MeshCentral yang ringan dan modular dengan live wall yang dapat dikustomisasi. Engine dan agent tetap menggunakan MeshCentral. Prioritas server: Armbian pada STB HG680P/B860H; Windows x64 sebagai alternatif.

**Status: Alpha untuk pengujian lab, belum production-ready.** Integrasi engine dan pemulihan data sudah diuji di CI. Installer fisik, sesi agent nyata, dan 100 stream simultan masih perlu validasi.

## Fitur saat ini

- Inventaris hingga 100 perangkat, filter, grup dan undangan enrollment.
- Live wall view-only: ukuran tile individual, drag/keyboard reorder, grid responsif, pilihan monitor, fullscreen, kualitas dan preset layout.
- Pembuatan akun standar, pemberian dan pencabutan akses view-only langsung per grup.
- Panel resmi MeshCentral untuk autentikasi, kontrol desktop, terminal, file manager dan pengaturan lanjutan di dalam workspace.
- Bootstrap Linux, setup wizard lokal, installer Windows kandidat, adopsi server lama.
- Backup/restore terverifikasi dan update/rollback UI melalui CLI saat engine berhenti.

Batas 100 perangkat adalah batas desain aplikasi, bukan jaminan kapasitas Tailscale atau STB. Default streaming empat sesi; naikkan hanya setelah pengujian hardware.

## Instalasi lab

```bash
git clone https://github.com/el-utama/Mesh-Wall.git
cd Mesh-Wall
sudo bash installers/linux/bootstrap.sh
```

Gunakan sistem 64-bit yang didukung. Login Tailscale dan aktivasi HTTPS/MagicDNS tetap membutuhkan pemilik tailnet. Ikuti [quickstart](docs/QUICKSTART-ALPHA.md) untuk akses wizard, instalasi Windows atau adopsi. Jangan memasang pada server produksi tanpa validasi.

## Dokumentasi

[Panduan pengguna Indonesia](docs/USER-GUIDE.md) · [Arsitektur](ARCHITECTURE.md) · [Audit](docs/AUDIT.md) · [Status implementasi](docs/IMPLEMENTATION.md) · [Maintenance](docs/OPERATIONS.md) · [Roadmap](ROADMAP.md) · [Pengujian CI](https://github.com/el-utama/Mesh-Wall/actions) · [README English](README.md).

Windows: jalankan `.\installers\windows\setup.ps1` dari PowerShell Administrator untuk wizard yang sama. Lihat [kesetaraan fitur dan syarat rilis](docs/PLATFORM-PARITY.md).
