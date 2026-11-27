# Existing MeshCentral adoption and recovery

The Alpha workflow supports a local npm installation of MeshCentral 1.3.2. The root contains `node_modules/meshcentral` and `meshcentral-data/config.json`. It uses the default database, data and public UI locations. Deployments with external databases, custom data or public paths, or service arguments that override the on-disk layout require a separate review. The installation filesystem must support hard links, such as ext4 or NTFS.

## Review in the wizard or terminal

1. Launch the local setup wizard from the reviewed checkout according to [Quickstart](QUICKSTART-ALPHA.md). Choose **Review existing MeshCentral**, select a detected installation or type its absolute local path, then choose **Preview adoption**. Discovery checks a bounded set of common paths, service names and processes. It can miss custom launchers, quoted or relative paths, containers and unreadable processes. The same discovery is available via `node scripts/doctor.mjs`.
2. Review the installation version and the files to be added under `meshcentral-web/public`. On Linux, use `systemctl list-units --type=service --all` and inspect the actual unit with `systemctl show` for `ExecStart`, `WorkingDirectory` and `User`. On Windows, use `Get-CimInstance Win32_Service | Select-Object Name, PathName, StartName, State` in PowerShell and compare the actual service path and account. If the engine was started manually, inspect the actual process and launch options locally. Confirm that the root and effective paths match before proceeding.
3. Select **Check backup path** with an existing private directory that is neither inside the installation nor its ancestor. The wizard checks path structure and previews the files again. The operator must check free space, permissions or Windows ACLs, and that the service account can access the directory. The wizard accepts plain local directory paths, checks fixed drives on Windows, and refuses symlinks and junctions along submitted paths. It can review configuration files up to 1 MiB. The terminal preview is available if the wizard cannot review a large configuration.

Terminal-only preview takes the root and an optional existing backup directory. Use your own quoted paths. In PowerShell you can also use `installers/windows/adopt.ps1 -Mode preview` with `-MeshCentralRoot` and optional `-BackupParent`.

```bash
node installers/adopt.mjs preview "/path/to/install-root" "/path/to/private-backups"
```

When either discovery or manual inspection identifies a package, the current wizard session blocks fresh installation. Preview only reads files and shows a terminal handoff. The wizard does not authenticate to MeshCentral or manipulate a service.

## Apply, verify and recover locally

1. In an authorized maintenance window, stop the identified engine using its service manager or original launcher. Check its stopped state and verify no other process is using the root. The `--engine-stopped` flag records the operator's confirmation.
2. From the reviewed checkout, run apply as the existing engine service account on Linux. On Windows use an authorized operator and a separate ACL-restricted backup directory. Apply revalidates the layout and configuration. It creates and verifies the offline snapshot before staging and publishing the 14 owned UI files through exclusive hard links. Existing accounts, devices, data, configuration, certificates and unrelated UI assets stay in place.

```bash
node installers/adopt.mjs apply "/path/to/install-root" "/path/to/private-backups" --engine-stopped
node installers/adopt.mjs status "/path/to/install-root"
```

3. Confirm status reports `complete` with all UI files and no maintenance lock. Restart the actual service and open its original trusted HTTPS URL plus `/meshwall.html`. Verify original login, groups and at least one authorized device if available. Keep the verified backup and journal.
4. If the original adoption needs to be reverted before any UI update or full restore, stop the confirmed service and check the journal before running rollback. Rollback verifies the file hashes and original hard-link identities, removes the owned paths and retains the journal. Restart and verify the original HTTPS/login flow.

```bash
node installers/adopt.mjs rollback "/path/to/install-root" --engine-stopped
```

| Code or status | Operator action |
| --- | --- |
| `MW-ADOPT-ROOT` / `MW-ADOPT-LAYOUT` | Check the absolute path, package version and default layout. Inspect custom service arguments in the local terminal. |
| `MW-ADOPT-CONFIG` | Check JSON validity, database and path settings locally. Preserve configuration and credentials. |
| `MW-ADOPT-BACKUP` | Select an existing private sibling or another separate directory. Verify space and permissions under the actual operator account. |
| `MW-ADOPT-COLLISION` / `MW-ADOPT-JOURNAL` | Keep existing files. Use `status` and review [Operations](OPERATIONS.md) for update or recovery. |
| `MW-ADOPT-REVIEW` | Run the local `preview` command for details about unsupported layout, file permissions or release files. |
| `MW-ADOPT-LOCK`, `interrupted` or `inconsistent` | Preserve the verified backup, journal and files. Check actual operation and service state locally before a retry. Never clear a lock blindly. |

An interruption can leave an incomplete journal or a lock. Automatic rollback on in-process placement failure only removes files verified as owned by that transaction. Power-loss durability and service recovery require physical validation. The stage shares file identity with the initial UI. Treat the separate verified snapshot as the backup and keep it private because it can contain secrets. A full restore can discard later changes, so review [Operations](OPERATIONS.md) first.

## Ringkasan langkah dalam Bahasa Indonesia

1. Di wizard lokal, buka **Review existing MeshCentral**. Pilih hasil deteksi atau masukkan direktori instalasi absolut, lalu klik **Preview adoption**. Cek versi 1.3.2 dan daftar file UI yang akan ditambahkan.
2. Cocokkan unit/proses dan akun service dengan direktori itu. Di Armbian cek properti unit lewat `systemctl show`. Di Windows cek `Name`, `PathName`, dan `StartName` lewat `Get-CimInstance Win32_Service`. Lanjutkan hanya jika Anda berwenang dan service memakai lokasi data serta konfigurasi yang didukung.
3. Pilih folder backup privat yang sudah ada di luar pohon instalasi. Cek ruang dan izin, lalu klik **Check backup path**. Wizard menampilkan langkah terminal. Saat jadwal maintenance, hentikan service yang telah dikonfirmasi, pastikan proses engine berhenti, lalu jalankan `apply` seperti contoh di atas.
4. Cek `status`, nyalakan kembali service yang sama, dan buka alamat HTTPS lama dengan `/meshwall.html`. Uji login lama, grup, dan perangkat berizin. Jika ada konflik, status terputus, atau lock tertinggal, simpan backup dan jurnal untuk pemeriksaan. Gunakan `rollback` hanya setelah memverifikasi kondisi pada bagian sebelumnya.

See also [local self-support](SELF-SUPPORT.md) and [platform parity](PLATFORM-PARITY.md).
