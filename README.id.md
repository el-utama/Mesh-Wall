# MeshWall — Bahasa Indonesia

MeshWall dirancang menjadi pengganti antarmuka native MeshCentral untuk administrasi sehari-hari, bukan pengganti engine atau MeshAgent. Prioritas server adalah Armbian pada STB HG680P/B860H; Windows menjadi alternatif.

Fitur utama: setup wizard instalasi baru atau adopsi server lama, konfigurasi Tailscale, pengelolaan hingga 100 PC, live wall dengan ukuran setiap tile bebas, drag & drop, multi-monitor, fullscreen, preset layout, desktop, terminal, file manager, user, grup, izin, log audit, backup dan diagnostik.

Arsitektur modular monolith menjaga penggunaan RAM tetap rendah dan memudahkan refactoring. Rendering layar di browser, bukan transcoding server. View-only menjadi default, dan seluruh sesi tunduk pada izin serta kebijakan persetujuan perangkat.

Status: implementasi alpha untuk pengujian lab. Source dashboard, bootstrap Linux dan adopsi instalasi lama sudah tersedia; belum diuji pada STB atau PC nyata. 100 PC terdaftar adalah batas desain; 100 stream simultan perlu dibuktikan. Baca [panduan alpha](docs/QUICKSTART-ALPHA.md), [audit](docs/AUDIT.md), [README utama](README.md), [arsitektur](ARCHITECTURE.md) dan [roadmap](ROADMAP.md).
