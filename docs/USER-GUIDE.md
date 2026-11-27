# Panduan pengguna MeshWall (Alpha)

Panduan ini untuk lab dengan perangkat yang Anda berhak kelola. Jangan menganggap tampilan Alpha sebagai jaminan bahwa semua fungsi telah teruji di STB nyata.

## 1. Masuk dan hubungkan perangkat

Selesaikan [instalasi](QUICKSTART-ALPHA.md). Buka URL HTTPS MeshWall yang ditampilkan installer. Klik **Sign in securely**; autentikasi dan MFA menggunakan panel resmi MeshCentral. Setelah berhasil, Overview menampilkan inventaris yang diizinkan.

Pada **Groups & enrollment**, buat agent group dan pilih grup untuk menghasilkan undangan dengan masa berlaku. Buka undangan pada PC yang diotorisasi dan jalankan agent resmi sesuai petunjuk. Tunggu perangkat berstatus Online. Undangan bersifat sensitif; jangan bagikan secara publik. Instalasi agent dan streaming nyata masih menjadi gate validasi hardware.

## 2. MeshWall

Buka **MeshWall**. Cari perangkat atau filter menurut grup/status. Atur Columns (1–10), Quality, dan Session limit (1–100; default 4). Grid dapat mengurangi kolom efektif pada viewport sempit.

Pilih tile, lalu gunakan inspector untuk Start viewing, Monitor, Focus/Fullscreen, Width/Height dan Move earlier/later. Drag header untuk mengubah urutan, atau gunakan kontrol keyboard. Start visible meminta konfirmasi dan mengikuti batas sesi. Stop all menghentikan sesi. Full wall memperluas area wall. Tile Live hanya muncul setelah gambar tergambar; Connected atau Waiting belum membuktikan layar tampil. Tidak adanya perubahan frame tidak selalu berarti koneksi gagal (desktop statis). Filtering keluar, meninggalkan wall, menyembunyikan tab atau kehilangan koneksi menghentikan sesi terkait. Koneksi dashboard mencoba pulih secara terbatas; layar tidak otomatis dibuka ulang. Consent dan hak akses ditentukan engine.

Gunakan Manage layouts untuk menyimpan, mengganti atau menghapus preset. Layout tersimpan lokal pada browser per akun; tidak ikut backup server. Jangan menaikkan batas menjadi 100 sebelum benchmark.

## 3. Perangkat dan akun

**Devices**: cari perangkat, rename, pindahkan grup; panel Desktop, Terminal, Files dan Details menggunakan fungsi resmi upstream. Aksi mengikuti izin engine. Perpindahan grup dapat mengubah siapa yang memperoleh akses.

**Users & permissions**: administrator yang memiliki hak manage users dapat membuat akun standar dengan password sementara minimal 16 karakter. Password harus diubah pada login pertama. Password tidak disimpan oleh MeshWall. Gunakan **Direct group access** untuk memberikan preset view-only pada akun standar dan agent group, atau menghapus membership tersebut. Engine melakukan validasi dan MeshWall membaca kembali hasilnya. Preset membatasi input desktop, terminal, file, AMT, registry dan software melalui hak langsung. Ini bukan perhitungan izin efektif: keanggotaan lain, akses bawaan, site rights dan kebijakan engine dapat memengaruhi hasil. Jangan menganggap pencabutan satu membership mencabut semua akses. Custom rights, administrator dan user group menggunakan Advanced rights. Pengujian hak akses desktop nyata masih diperlukan.

**Activity** menampilkan hingga 50 event yang dikembalikan engine; bukan audit log lengkap. **Settings / diagnostics** menampilkan informasi koneksi dan data host yang tersedia; advanced administration masih memakai panel resmi.

## 4. Pemeliharaan

Gunakan [panduan maintenance](OPERATIONS.md) dari terminal lokal yang berwenang. Hentikan engine dan buat backup sebelum restore atau pembaruan. Jangan membagikan folder backup karena memuat data dan private key. Belum ada GUI maintenance berhak tinggi, upgrade engine otomatis atau sertifikasi production-ready.

Jika terjadi masalah, catat OS, arsitektur, versi Node/engine dan pesan kesalahan yang telah disamarkan. Jangan mengirim password, URL undangan, token, private key atau tangkapan layar PC tanpa izin.
