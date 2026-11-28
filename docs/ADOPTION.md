# Existing MeshCentral adoption and recovery

The Alpha workflow supports a local npm installation of MeshCentral 1.3.2. The root contains `node_modules/meshcentral` and `meshcentral-data/config.json`. It uses the default database, data and public UI locations. Deployments with external databases, custom data or public paths, or service arguments that override the on-disk layout require a separate review. The installation filesystem must support hard links, such as ext4 or NTFS.

## Review in the wizard or terminal

1. Launch the local setup wizard from the reviewed checkout according to [Quickstart](QUICKSTART-ALPHA.md). Choose **Review existing MeshCentral**, select a detected installation or type its absolute local path, then choose **Preview adoption**. Discovery checks a bounded set of common paths, service names and processes. It can miss custom launchers, quoted or relative paths, containers and unreadable processes. The same discovery is available via `node scripts/doctor.mjs`.
2. Review the installation version and planned UI files. Find the registered service name through `systemctl list-units --type=service --all` on Linux or `Get-CimInstance Win32_Service | Select-Object Name, PathName, StartName, State` in PowerShell. Enter the name and choose **Check service**. The wizard reports the registered account and whether the service is running, stopped or transitioning. For a custom service or manual launch, compare its effective configuration, process and account in the terminal before proceeding with manual confirmation.
3. Select **Check backup path** with an existing private directory that is neither inside the installation nor its ancestor. The wizard checks path structure and previews the files again. The operator must check free space, permissions or Windows ACLs, and that the service account can access the directory. The wizard accepts plain local directory paths, checks fixed drives on Windows, and refuses symlinks and junctions along submitted paths. It can review configuration files up to 1 MiB. The terminal preview is available if the wizard cannot review a large configuration.

Terminal-only preview takes the root and an optional existing backup directory. Use your own quoted paths. In PowerShell you can also use `installers/windows/adopt.ps1 -Mode preview` with `-MeshCentralRoot` and optional `-BackupParent`.

```bash
node installers/adopt.mjs preview "/path/to/install-root" "/path/to/private-backups"
```

Use the same read-only service check during maintenance from the terminal. The PowerShell wrapper also accepts `-Mode service -ServiceName <name>`.

```bash
node installers/adopt.mjs service "/path/to/install-root" meshcentral.service
```

Linux inspection reads the system systemd registry through `systemctl` and JSON-capable `busctl`. It recognizes direct Node launches of the pinned npm package, with standard paths and no custom launch hooks or environment files. Windows inspection reads the registered CIM service and the pinned upstream WinSW launcher and XML for the nominated root. A result of `verified` means the registered configuration matches the supported launch. The status is a snapshot for the nominated service. Check other processes, runtime readiness, permissions and access independently. Custom scripts, extra arguments or missing tools require manual review. The wizard blocks a named service with a failed check from proceeding to backup review, and rechecks verified service registration before the handoff. Clear the service field only when using the documented manual workflow.

## Apply, verify and recover locally

1. In an authorized maintenance window, stop the identified engine using its service manager or original launcher. Recheck its stopped state with the `service` command or the local service manager. Verify that no other process is using the root. Pass `--engine-stopped` to record the operator's confirmation. For a supported registered service add `--service <name>` so the local CLI verifies registration and stopped state before proceeding.
2. From the reviewed checkout, run apply as the existing engine service account on Linux. On Windows use an authorized operator and a separate ACL-restricted backup directory. Apply revalidates the layout and configuration. With a named service, it checks before the backup and again after verifying the backup, before staging and publishing the 14 UI files through exclusive hard links. If the second check fails, apply leaves the verified snapshot available and publishes no UI files. Existing accounts, devices, data, configuration, certificates and unrelated UI assets stay in place.

```bash
node installers/adopt.mjs apply "/path/to/install-root" "/path/to/private-backups" --engine-stopped --service meshcentral.service
node installers/adopt.mjs status "/path/to/install-root"
```

3. Confirm status reports `complete` with all UI files and no maintenance lock. Restart the actual service and open its original trusted HTTPS URL plus `/meshwall.html`. Verify original login, groups and at least one authorized device if available. Keep the verified backup and journal.
4. If the original adoption needs to be reverted before any UI update or full restore, stop the confirmed service and check the journal before running rollback. Rollback verifies the file hashes and original hard-link identities and, if named, rechecks that the service is stopped before removing the owned paths. It retains the journal. Restart and verify the original HTTPS/login flow.

```bash
node installers/adopt.mjs rollback "/path/to/install-root" --engine-stopped --service meshcentral.service
```

Use the exact registered name in Windows or pass `-ServiceName <name>` with `-EngineStopped` in the PowerShell wrapper. For a custom or unregistered launcher, verify it locally and use the manual form with `--engine-stopped`. Each check observes one registered service at that moment. Keep the engine offline throughout maintenance and verify that no other process is using the root. The CLI does not control the OS service.

| Code or status | Operator action |
| --- | --- |
| `MW-ADOPT-ROOT` / `MW-ADOPT-LAYOUT` | Check the absolute path, package version and default layout. Inspect custom service arguments in the local terminal. |
| `MW-ADOPT-CONFIG` | Check JSON validity, database and path settings locally. Preserve configuration and credentials. |
| `MW-ADOPT-BACKUP` | Select an existing private sibling or another separate directory. Verify space and permissions under the actual operator account. |
| `MW-ADOPT-COLLISION` / `MW-ADOPT-JOURNAL` | Keep existing files. Use `status` and review [Operations](OPERATIONS.md) for update or recovery. |
| `MW-ADOPT-REVIEW` | Run the local `preview` command for details about unsupported layout, file permissions or release files. |
| `MW-ADOPT-SERVICE` | Confirm the registered name and root. `mismatch` means the launch points elsewhere. If a named service cannot be verified or is active, review its launch and state from the local service manager. If a verified backup was already created, use the path printed in the terminal. |
| `MW-ADOPT-LOCK`, `interrupted` or `inconsistent` | Preserve the verified backup, journal and files. Check actual operation and service state locally before a retry. Never clear a lock blindly. |

An interruption can leave an incomplete journal or a lock. Automatic rollback on in-process placement failure only removes files verified as owned by that transaction. When a named service can no longer be verified as stopped, cleanup leaves the staged and active files for local inspection. Power-loss durability and service recovery require physical validation. The stage shares file identity with the initial UI. Treat the separate verified snapshot as the backup and keep it private because it can contain secrets. A full restore can discard later changes, so review [Operations](OPERATIONS.md) first.

## Ringkasan langkah dalam Bahasa Indonesia

1. Di wizard lokal, buka **Review existing MeshCentral**. Pilih hasil deteksi atau masukkan direktori instalasi absolut, lalu klik **Preview adoption**. Cek versi 1.3.2 dan daftar file UI yang akan ditambahkan.
2. Masukkan nama service yang terdaftar, lalu klik **Check service**. Di Armbian lihat nama unit lewat `systemctl list-units --type=service --all`. Di Windows lihat kolom `Name` lewat `Get-CimInstance Win32_Service`. Wizard menampilkan akun dan status untuk konfigurasi yang didukung. Untuk service khusus atau proses manual, cocokkan lokasi dan akun lewat terminal. Jika konfigurasi menunjuk ke direktori lain, periksa pilihan root sebelum melanjutkan.
3. Pilih folder backup privat yang sudah ada di luar pohon instalasi. Cek ruang dan izin, lalu klik **Check backup path**. Wizard menampilkan langkah terminal. Saat jadwal maintenance, hentikan service yang telah dikonfirmasi, pastikan proses engine berhenti, lalu jalankan `apply` dengan `--service` untuk service terdaftar. CLI mengecek sebelum backup dan sebelum pemasangan UI. Jika service aktif lagi setelah backup, snapshot tetap tersedia.
4. Cek `status`, nyalakan kembali service yang sama, dan buka alamat HTTPS lama dengan `/meshwall.html`. Uji login lama, grup, dan perangkat berizin. Jika ada konflik, status terputus, atau lock tertinggal, simpan backup dan jurnal untuk pemeriksaan. Saat menjalankan `rollback`, gunakan `--service` agar CLI mengecek status lagi sebelum menghapus file UI adopsi.

See also [local self-support](SELF-SUPPORT.md) and [platform parity](PLATFORM-PARITY.md).
