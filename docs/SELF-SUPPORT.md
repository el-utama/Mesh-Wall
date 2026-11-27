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
```
Windows: same Node command from the repository, with a quoted actual Windows root, for example `node scripts/doctor.mjs discover "C:\MeshCentral"`. Discovery checks bounded service/process evidence, common paths and optional manual root. It is not a whole disk scan or proof of service identity; custom layouts may be missed. Compatibility means expected npm layout/version 1.3.2 and data/config files, not verified working server or database. No root data is modified.

The actual one-time fresh setup wizard now records allowlisted stage/status timestamps in the launching operator's private .meshwall-support directory (Windows inherits the user profile ACL). Run history under the same operator account, even after wizard closure. A last recorded running status is not proof of an active process; do not resume blindly. History is not a backup or crash-safe transaction. It does not cover pre-Node/bootstrap or standalone terminal installer yet. No automatic lock clearing, restart or deletion.

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
| MW-ADOPT | Version, actual root, verified backup, stopped service | Use preview/status/apply/rollback; verify stopped service and preserve journal/backup |
| MW-ENROLL | Invite validity, group, agent connection | Regenerate authorized invite if necessary |
| MW-STREAM | Consent, relay, decoded frame, resources | Stop and explicitly retry with permission; reduce active set |
| MW-MAINT | Service identity, backup, disk, recovery path | Use supported offline maintenance |
| MW-RECOVERY | Failed step, existing files, recovery evidence | Preserve state; authorized manual recovery if ambiguous |

Codes identify the stage, not the precise root cause. Read [troubleshooting](TROUBLESHOOTING.md), [quickstart](QUICKSTART-ALPHA.md) and [operations](OPERATIONS.md) locally. Do not share raw logs or real screen data.

See [adoption and recovery](ADOPTION.md) for the local wizard and CLI, specific preview codes and Bahasa Indonesia instructions. Use status for an interrupted or inconsistent adoption and preserve the backup and journal.

## Release requirements still open
Broader discovery, verified service identity and service lifecycle, guided execution and recovery; complete durable transaction journal for all installers and safe resume/recovery after power loss; specific diagnosed error codes, one-click allowlisted repairs after authorization, complete in-dashboard error-specific help and offline bilingual guide, service watchdog with bounded restart/health checks, structured sanitized diagnostics and verified rollback on both OSes. Do not treat stage guidance as a repair engine. No unbounded watchdog or AI required. Real failure-injection and physical host acceptance remain mandatory.
