# Local self-support — no AI required

MeshWall must support users even without ChatGPT, Codex, cloud AI or a running MeshCentral service. This is a mandatory cross-platform release requirement. Offline diagnosis is local and rule-based; installing packages, Tailscale login and certificate issuance still need connectivity.

## Available in current source
- Bootstrap terminal help and stage labels, including failures before Node is available; read this local Markdown file from the checkout.
- Shared temporary setup wizard: bounded common-path/service/process discovery, manual adoption preview, registered service inspection on both OSes, manual confirmation guidance for custom launchers, separate backup path check, fresh install guard, local terminal handoff and safe diagnostic report. Setup server requires the one-time token; reports exclude raw logs, installation paths, account data and secrets. Candidate roots shown locally may be sensitive.
- Contextual read-only help in overview, wall, devices, groups, users, activity and settings; no privileged action is exposed.
- Independent read-only CLI (requires Node, not a running MeshCentral):
```bash
node scripts/doctor.mjs
node scripts/doctor.mjs discover /path/to/meshcentral
node scripts/doctor.mjs help
node scripts/doctor.mjs help service
node scripts/doctor.mjs history
node scripts/doctor.mjs diagnose /opt/meshwall/engine
```
Windows: same Node command from the repository, with a quoted actual Windows root, for example `node scripts/doctor.mjs discover "C:\MeshCentral"`. Discovery checks bounded service/process evidence, common paths and optional manual root. It is not a whole disk scan or proof of service identity; custom layouts may be missed. Compatibility means expected npm layout/version 1.3.2 and data/config files, not verified working server or database. No root data is modified.

The actual one-time fresh setup wizard now records allowlisted stage/status timestamps in the launching operator's private .meshwall-support directory (Windows inherits the user profile ACL). Run history under the same operator account, even after wizard closure. A last recorded running status is not proof of an active process; do not resume blindly. Each new record retains up to 32 ordered stage/status/timestamp events; older records remain readable with their single last event. The doctor provides a status-specific recovery note. This is not a backup, proof of completed individual steps, or a crash-safe transaction. It does not cover pre-Node/bootstrap or standalone terminal installer yet. No automatic lock clearing, restart or deletion.

## Diagnose partial fresh installs
Run `node scripts/doctor.mjs diagnose /opt/meshwall/engine` on Linux or `node scripts/doctor.mjs diagnose "C:\ProgramData\MeshWall"` in Windows PowerShell (replace with the actual absolute local root). The read-only command checks the root, pinned package, config JSON syntax/object, nonempty TLS/UI files and maintenance lock. It rejects unsafe path components, reports specific finding codes and safe next actions, and never prints paths, config content, key content or raw exceptions. Exit 1 indicates review needed; `files-present` means only that these checks passed, not that the service or TLS works. It targets the default fresh-install layout, not arbitrary existing-server configuration. No repair, restart, schema validation, private key parsing or live health check runs.

## Service and HTTPS health
After file diagnosis, run `node scripts/doctor.mjs health /opt/meshwall/engine meshwall-engine.service` on Linux. On Windows run `node scripts/doctor.mjs health "C:\ProgramData\MeshWall" "MeshCentral"` using the actual registered service name. This uses the existing read-only service adapter. Only when file evidence is complete and the matching service reports running, it checks the configured fresh Tailscale IPv4 on a local interface and makes one bounded HTTPS GET to port 8443 with hostname verification, no credentials and no redirects. Reports omit service names, accounts, hostnames, IPs, paths and raw errors. `page-reachable` means a matching service registration/state and expected page were observed, not authenticated login, process ownership or agent readiness. Custom installations require their own review. No automatic restart or repair.

## Pemulihan instalasi (Bahasa Indonesia)
Gunakan perintah `health` di atas untuk mengecek service terdaftar dan halaman HTTPS lokal setelah pemeriksaan file. Gunakan nama service yang sebenarnya. Jika service berhenti, tidak cocok atau sedang transisi, periksa log lokal; jangan memulai service yang belum teridentifikasi. Jika alamat bukan milik host, periksa Tailscale. Jika TLS gagal, periksa sertifikat, hostname dan waktu sistem tanpa menonaktifkan verifikasi. `page-reachable` belum membuktikan login, izin atau enrollment berhasil.
Untuk memeriksa instalasi baru yang terputus, jalankan perintah `diagnose` di atas dari akun operator. Kode `MW-DIAG-PACKAGE`, `MW-DIAG-CONFIG`, `MW-DIAG-CERT`, `MW-DIAG-KEY`, `MW-DIAG-UI`, `MW-DIAG-APP`, `MW-DIAG-ROOT` dan `MW-DIAG-LOCK` menunjukkan bagian yang diperiksa. Status `missing`, `empty`, `unsafe`, `unavailable`, `invalid-json`, `invalid-config`, `oversized`, `invalid-package`, `unsupported-version` atau `blocked` memerlukan pemeriksaan sesuai petunjuk. `files-present` bukan bukti service, TLS atau login berhasil. Tidak ada perubahan file dan jangan menghapus lock atau mengulang instalasi otomatis.
Jalankan `node scripts/doctor.mjs history` dari akun operator yang sama dengan wizard (Linux: gunakan akun root yang menjalankan wizard dengan sudo). Periksa daftar `events`, tahap terakhir, `help` dan `recoveryNote`. Status `running` hanya menunjukkan catatan terakhir, bukan bukti installer masih aktif. Jika `failed`, pertahankan file parsial, periksa proses, service yang benar dan konfigurasi sesuai tahap sebelum mengulang. Jika `complete`, HTTPS telah dicatat siap; uji login dan perangkat yang diizinkan secara terpisah. Jangan menghapus lock, direktori, akun atau backup secara otomatis. Riwayat tidak mencakup instalasi sebelum Node atau CLI mandiri.

## Help by step
| Stage / code | What the user should inspect | Safe next action |
| --- | --- | --- |
| MW-BOOTSTRAP | OS, privileges, free disk, package source, dependency failure | Read the terminal failure; do not bypass package signatures or delete partial dependencies |
| MW-DISCOVERY | Existing root, package version, data/config files | Confirm service identity; use manual root if custom path |
| MW-PREFLIGHT | Node, prerequisites, tailnet login, conflicts | Resolve blockers; run preflight again |
| MW-TLS | MagicDNS, HTTPS permission, clock | Fix tailnet settings; never use insecure TLS |
| MW-PACKAGE | Network, disk, permissions, package manager | Preserve partial service account/directory; inspect |
| MW-CONFIG | Ownership/ACL, write permissions, bind, configuration | Preserve config/certs before any repair |
| MW-ADMIN | Initial account creation/promotion | Check upstream result; do not share passwords or blindly create accounts |
| MW-SERVICE | Actual service, logs, port/dependency failures | Inspect known service locally |
| MW-VERIFY | Private HTTPS and expected page | Verify login/agent separately; no insecure fallback |
| MW-READY | First login and authorized test PC | Enroll one PC and verify consent/frame |
| MW-ADOPT | Version, actual root, verified backup, stopped service | Use preview/status/apply/rollback; use the named-service check before applying or rolling back a supported installation; preserve journal and backup |
| MW-ENROLL | Invite validity, group, agent connection | Regenerate authorized invite if necessary |
| MW-STREAM | Consent, relay, decoded frame, resources | Stop and explicitly retry with permission; reduce active set |
| MW-MAINT | Service identity, backup, disk, recovery path | Use supported offline maintenance |
| MW-RECOVERY | Failed step, existing files, recovery evidence | Preserve state; authorized manual recovery if ambiguous |

Codes identify the stage, not the precise root cause. Read [troubleshooting](TROUBLESHOOTING.md), [quickstart](QUICKSTART-ALPHA.md) and [operations](OPERATIONS.md) locally. Do not share raw logs or real screen data.

See [adoption and recovery](ADOPTION.md) for the local wizard and CLI, specific preview codes and Bahasa Indonesia instructions. Use status for an interrupted or inconsistent adoption and preserve the backup and journal.

## Release requirements still open
Broader discovery, verified service identity and service lifecycle, guided execution and recovery; complete durable transaction journal for all installers and safe resume/recovery after power loss; specific diagnosed error codes, one-click allowlisted repairs after authorization, complete in-dashboard error-specific help and offline bilingual guide, service watchdog with bounded restart/health checks, structured sanitized diagnostics and verified rollback on both OSes. Do not treat stage guidance as a repair engine. No unbounded watchdog or AI required. Real failure-injection and physical host acceptance remain mandatory.
