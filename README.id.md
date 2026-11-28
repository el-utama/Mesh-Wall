# MeshWall — Bahasa Indonesia

MeshWall adalah dashboard pengelolaan MeshCentral yang ringan dan modular dengan live wall yang dapat dikustomisasi. Engine dan agent tetap menggunakan MeshCentral. Prioritas server: Armbian pada STB HG680P/B860H; Windows x64 dengan target kesetaraan fitur.

**Status: Alpha untuk pengujian lab, belum production-ready.** Integrasi engine dan pemulihan data sudah diuji di CI. Installer fisik, sesi agent nyata, dan 100 stream simultan masih perlu validasi.

## Fitur saat ini

- Inventaris hingga 100 perangkat, filter, grup dan undangan enrollment.
- Live wall view-only: ukuran tile individual, drag/keyboard reorder, grid responsif, pilihan monitor, fullscreen, kualitas dan preset layout.
- Pembuatan akun standar, pemberian dan pencabutan akses view-only langsung per grup.
- Panel resmi MeshCentral untuk autentikasi, kontrol desktop, terminal, file manager dan pengaturan lanjutan di dalam workspace.
- Bootstrap Linux dan Windows, setup wizard lokal bersama, installer kedua OS dan adopsi server lama.
- Backup/restore, update/rollback UI dan renewal TLS lokal kedua OS melalui CLI; validasi fisik belum dilakukan.

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

Windows: jalankan `.\installers\windows\bootstrap.ps1` dari PowerShell Administrator untuk menyiapkan dependensi via WinGet dan membuka wizard; jika dependensi sudah tersedia, gunakan `.\installers\windows\setup.ps1`. Lihat [kesetaraan fitur dan syarat rilis](docs/PLATFORM-PARITY.md).

[Skill teknis coding agent](.agents/skills/README.md) · [Panduan penanganan masalah](docs/TROUBLESHOOTING.md). Skill adalah panduan pengembangan, bukan sistem perbaikan otomatis aplikasi.

[Audit skill dan dokumentasi](docs/DOCUMENTATION-AUDIT.md).

Bantuan lokal tanpa AI: `node scripts/doctor.mjs` untuk pencarian lokasi umum dan `node scripts/doctor.mjs help` untuk panduan tahap. Lihat [self-support](docs/SELF-SUPPORT.md); pemulihan otomatis penuh belum tersedia.

Untuk server lama, pilih **Review existing MeshCentral** di wizard lokal. Pilih kandidat atau masukkan direktori sendiri, tinjau perubahan, masukkan nama service untuk melihat akun dan statusnya, lalu periksa lokasi backup. Setelah menghentikan service, gunakan opsi `--service` pada perintah adopsi atau rollback agar CLI mengecek ulang service sebelum mengubah UI. Verifikasi server dari terminal lokal. [Panduan adopsi dalam Bahasa Indonesia](docs/ADOPTION.md#ringkasan-langkah-dalam-bahasa-indonesia).

Riwayat instalasi wizard: `node scripts/doctor.mjs history` dari akun operator yang sama. Riwayat menampilkan maksimal 32 catatan tahap dan saran pemulihan sesuai status. Status terakhir bukan bukti proses masih berjalan; jangan ulangi instalasi tanpa pemeriksaan.

Untuk instalasi baru yang gagal, jalankan `node scripts/doctor.mjs diagnose /opt/meshwall/engine` (Linux) atau `node scripts/doctor.mjs diagnose "C:\ProgramData\MeshWall"` (Windows, sesuaikan lokasi). Pemeriksaan hanya membaca bukti file, bukan menguji service atau TLS. Lihat [self-support](docs/SELF-SUPPORT.md).

## Lanjutkan pengembangan dengan AI apa pun
Minta AI membaca [AGENTS.md](AGENTS.md) dan [PROJECT_MEMORY.md](PROJECT_MEMORY.md), lalu memeriksa HEAD dan CI terbaru. Kedua file berada di repository dan wajib diperbarui setiap perubahan substantif. AI yang tidak otomatis membaca AGENTS.md perlu diarahkan sekali; tidak perlu membuat handover manual.
