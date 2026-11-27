# Request-by-request audit

| Requirement | Current alpha state | Gate before ready |
| --- | --- | --- |
| Full native replacement | Partial: custom UI, native standard-account creation and restricted direct group membership; same-origin upstream advanced panels | Verify each embedded panel and session; fully custom advanced controls remain pending |
| Automated initial configuration | Linux prerequisite bootstrap; shared authenticated localhost GUI wizard and CLI installers on both OS | Real fresh STB setup, safe retry/rollback; Tailscale prerequisite |
| Armbian HG680P/B860H | ARM64 target, runtime guard, low-resource architecture | Actual board OS/kernel/userspace, install and soak test |
| Windows | PowerShell installer, shared setup wizard, local TLS renewal and adoption | Actual Windows service, TLS and agent validation |
| 100 PC live wall | 100-tile cap and adjustable 1–100 session limit; default 4 | Actual 1/10/25/50/75/100 session benchmark, acceptable frame age/resources |
| Custom tile size | Grid columns, per-tile W/H, pointer resize | Synthetic browser checks passed; live hardware pending |
| Drag, focus, fullscreen, monitor | UI/renderer adapter source | Synthetic layout/browser tests passed; real monitor/agent tests pending |
| View-only, access control | Upstream session, consent defaults, no input handlers | Verify denied/revoked and consent behavior end-to-end |
| Modular/refactorable | Separate model/control/desktop/wall/management/admin/panel/UI modules and installer separation | Dependency checks and continued refactoring |
| Documentation | README, ADR, installation, acceptance, audit | Current bilingual README and user guide; keep synchronized with CI evidence |
| Maintenance and backup | Offline backup/verify/restore and UI-only update/rollback with retained recovery directories | Real engine loopback restore passed; physical host, GUI and engine update pending |
| TLS lifecycle | Local Linux/Windows renewal commands, shared staged replacement and rollback | Actual Tailscale issuance/restart on both OS; unattended timer pending |
| Automatic reconnect | Bounded automatic control-channel reconnect; remote screens require explicit retry | Real-device consent/denial and automatic stream resume remain pending |

Audit conclusion: source is alpha for a test environment, not production-ready. No fabricated live results. See implementation notes.

Cross-platform acceptance is tracked in [PLATFORM-PARITY.md](PLATFORM-PARITY.md).
