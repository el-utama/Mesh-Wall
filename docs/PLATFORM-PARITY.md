# Platform parity — mandatory release gate

Same browser application, upstream engine and access control across both OS families. Prioritize Armbian resource use; do not silently exclude Windows from a feature.

| Capability | Linux / Armbian | Windows x64 | Evidence required |
| --- | --- | --- | --- |
| Core dashboard and 100-tile layout | Shared | Shared | Browser fixtures; real agent benchmark on each |
| Setup browser | Shared loopback server and assets, Bash adapter | Shared loopback server and assets, PowerShell adapter | Windows and Linux wizard fixture CI; real fresh install |
| CLI install | install.sh | install.ps1 | Real private HTTPS, agent enrollment |
| Prerequisites | bootstrap.sh | bootstrap.ps1 (WinGet official packages, manual fallback) | Actual dependency installation and login validation pending |
| Native service | systemd, dedicated account | Upstream Windows Service, default account | Windows least-privilege service and lifecycle tests pending |
| Adopt existing | Shared guided preview, operator service confirmation and backup path review; transactional CLI | Same, plus PowerShell wrapper and fixed-drive check | Shared wizard fixture and real engine loopback; actual service identity, privileges, storage and host recovery pending |
| Backup/restore, UI update/rollback | Shared offline CLI, private permissions | Shared offline CLI, restricted ACLs | Real Linux loopback restore; Windows loopback restore CI added; physical service and ACL review pending |
| TLS renewal/rollback | renew-tls.sh | renew-tls.ps1 | Shared certificate swap tests; actual issuance and restart pending |
| Offline self-support | Shared doctor/catalog, wizard stage history and setup help; Bash hints | Shared doctor/catalog, wizard stage history and setup help; PowerShell hints | Broader discovery, automated service verification, guided rollback, broader diagnosis and physical failure injection pending |
| Unattended renewal | Not implemented | Not implemented | Secure scheduled local deployment, tested recovery |
| GUI service/maintenance, engine upgrade | Incomplete | Incomplete | Shared UI + OS adapters with bounded authorization |
| Native replacement and actual live wall | Partial; official panels | Same | Actual consent/permissions and 100-stream evidence |

Windows setup uses system-wide Node and official Tailscale; run elevated PowerShell from a reviewed checkout. No password in process arguments. Windows certificate rotation validates candidate before service interruption, then validates HTTPS and peer fingerprint; recovery retained on failure. Only fresh-install fixed service paths are accepted. No physical Windows or STB test is claimed.

See [hardware acceptance](HARDWARE-ACCEPTANCE.md), [quickstart](QUICKSTART-ALPHA.md), [operations](OPERATIONS.md) and [audit](AUDIT.md). All missing features are release blockers, not implied support.
