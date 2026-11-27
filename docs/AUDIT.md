# Request-by-request audit

| Requirement | Current alpha state | Gate before ready |
| --- | --- | --- |
| Full native replacement | Partial: custom UI and same-origin upstream functional panels embedded in MeshWall | Verify each embedded panel and session; fully custom advanced controls remain pending |
| Automated initial configuration | Linux prerequisite bootstrap, interactive CLI and authenticated localhost GUI wizard; existing adoption utility | Real fresh STB setup, safe retry/rollback; Tailscale prerequisite |
| Armbian HG680P/B860H | ARM64 target, runtime guard, low-resource architecture | Actual board OS/kernel/userspace, install and soak test |
| Windows | Fresh PowerShell installer and existing engine adoption script | Actual Windows service, TLS and agent validation |
| 100 PC live wall | 100-tile cap and adjustable 1–100 session limit; default 4 | Actual 1/10/25/50/75/100 session benchmark, acceptable frame age/resources |
| Custom tile size | Grid columns, per-tile W/H, pointer resize | Synthetic browser checks passed; live hardware pending |
| Drag, focus, fullscreen, monitor | UI/renderer adapter source | Live browser and multi-monitor tests |
| View-only, access control | Upstream session, consent defaults, no input handlers | Verify denied/revoked and consent behavior end-to-end |
| Modular/refactorable | Separate model/control/desktop/wall/management/admin/panel/UI modules and installer separation | Dependency checks and continued refactoring |
| Documentation | README, ADR, installation, acceptance, audit | Keep current with real evidence |
| Maintenance and backup | Offline backup/verify/restore and UI-only update/rollback with retained recovery directories | Test service restart and rollback on physical host; GUI and engine update pending |
| Automatic reconnect | Not implemented; explicit retry to avoid repeated consent prompts | Consent-aware reconnect policy and testing |

Audit conclusion: source is alpha for a test environment, not production-ready. No fabricated live results. See implementation notes.
