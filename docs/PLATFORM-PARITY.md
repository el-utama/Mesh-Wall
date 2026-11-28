# Platform parity — mandatory release gate

Same browser application, upstream engine and access control across both OS families. Prioritize Armbian resource use; do not silently exclude Windows from a feature.

| Capability | Linux / Armbian | Windows x64 | Evidence required |
| --- | --- | --- | --- |
| Core dashboard and 100-tile layout | Shared | Shared | Browser fixtures; real agent benchmark on each |
| Setup browser | Shared loopback server and assets, Bash adapter | Shared loopback server and assets, PowerShell adapter | Windows and Linux wizard fixture CI; real fresh install |
| CLI install | install.sh | install.ps1 | Real private HTTPS, agent enrollment |
| Prerequisites | bootstrap.sh | bootstrap.ps1 (WinGet official packages, manual fallback) | Actual dependency installation and login validation pending |
| Native service | systemd, dedicated account | Upstream Windows Service, default account | Windows least-privilege service and lifecycle tests pending |
| Adopt existing | Guided preview, read-only systemd registration/state check, backup path review and transactional CLI with optional stopped-service checks | Same flow with Windows CIM/WinSW inspection, PowerShell wrapper and fixed-drive check | Adapter regressions, wizard fixture and real engine loopback; existing physical service, privileges and recovery pending |
| Backup/restore, UI update/rollback | Shared offline CLI including guarded partial-UI repair with snapshot recheck and rollback-failure lock retention, private permissions | Shared offline CLI including guarded partial-UI repair with snapshot recheck and rollback-failure lock retention, restricted ACLs | Real Linux loopback restore; Windows loopback restore CI added; physical service and ACL review pending |
| TLS renewal/rollback | renew-tls.sh | renew-tls.ps1 | Shared certificate swap tests; actual issuance and restart pending |
| Offline self-support | Shared doctor/catalog, wizard stage trail, read-only fresh-install file and service/HTTPS diagnosis, recovery notes, setup help; Bash hints | Shared doctor/catalog, wizard stage trail, read-only fresh-install file and service/HTTPS diagnosis, recovery notes, setup help; PowerShell hints | Broader discovery, other service launchers, guided rollback, broader diagnosis and physical failure injection pending |
| Unattended renewal | Not implemented | Not implemented | Secure scheduled local deployment, tested recovery |
| Local service start/stop/restart | Candidate: typed systemctl, fixed fresh root, identity/state and lock guards | Candidate: typed sc.exe, fixed fresh root, same guards | Shared fixture tests, physical service acceptance pending |
| GUI service/maintenance, engine upgrade | Incomplete | Incomplete | Shared UI + OS adapters with bounded authorization |
| Native replacement and actual live wall | Partial; official panels | Same | Actual consent/permissions and 100-stream evidence |

Windows setup uses system-wide Node and official Tailscale; run elevated PowerShell from a reviewed checkout. No password in process arguments. Windows certificate rotation validates candidate before service interruption, then validates HTTPS and peer fingerprint; recovery retained on failure. Only fresh-install fixed service paths are accepted. No physical Windows or STB test is claimed.

See [hardware acceptance](HARDWARE-ACCEPTANCE.md), [quickstart](QUICKSTART-ALPHA.md), [operations](OPERATIONS.md) and [audit](AUDIT.md). All missing features are release blockers, not implied support.
