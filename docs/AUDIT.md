# Request-by-request audit

Current status: **Alpha / isolated lab evaluation, not production-ready.** Source availability, fixture/loopback verification and physical acceptance are separate. See [implementation evidence](IMPLEMENTATION.md), [platform parity](PLATFORM-PARITY.md), [hardware acceptance](HARDWARE-ACCEPTANCE.md).

| ID | Requirement | Current evidence and scope | Outstanding gate |
| --- | --- | --- | --- |
| P01 | Fresh setup | Shared localhost wizard, Linux/Windows bootstrap and CLI; fixture tests | Actual clean install on HG680P/B860H and Windows, safe partial recovery, enrollment end-to-end without native dependency |
| P02 | Adopt existing | Wizard preview for detected or manual paths, read-only registered service and state checks, backup-directory check and CLI handoff; offline CLI backup, staged placement, journal, rollback and restart coverage; named-service checks before backup, placement and removal | Physical service and permission validation, broader launchers, guided execution/recovery and existing-host acceptance |
| P03 | Inventory | Grouped/filterable 100-tile inventory and name ordering; synthetic browser and empty real engine | Last-seen/hardware metadata, interactive sort and real enrolled devices |
| P04 | Live wall | Layout/resize/order/focus/fullscreen/presets tested in browser; upstream generated JPEG decode | Actual agent stream, monitor switching, monitor preset persistence, adaptive quality and safe reconnect |
| P05 | Remote access | Official embedded desktop/terminal/files panels; wall view-only | Independent native controls, allowed power operations, consent and revocation tests |
| P06 | Enrollment | Group invitation verified with real loopback | Actual agent install, revoke invite/remove device with confirmation |
| P07 | Administration | Group/device edits, standard accounts, direct viewer grant/revoke, recent events and basic diagnostics | Effective/inherited roles, full logs/notifications, advanced native replacement |
| P08 | Maintenance | Offline verified backup/restore and UI swap/rollback; local TLS renewal adapters | GUI service/config/backup, unattended TLS, engine update/rollback, real service/ACL tests |
| P09 | Private access | Bootstrap guides Tailscale login; private bind/TLS configuration and certificate unit checks | Real private TLS/agent connectivity/renewal on both OS, network management UI |
| P10 | Modularity | Static explicit JS modules; shared setup/maintenance, platform adapters and ADRs | Automated boundary checks and ongoing contract review |
| P11 | UI/UX | Design system, five viewports, synthetic density, keyboard/contrast tests | Independent accessibility/manual audit, missing UI states and actual screen sessions |
| P12 | Platform parity | Both bootstrap/wizard/TLS source; shared guided adoption and Windows fixed-drive check; Windows loopback passed at the baseline | Physical OS lifecycle/ACL/recovery, least-privilege Windows service |
| P13 | Skills and docs | Nine specialist skills, registry, documentation audit, CI validation and shared project memory | Keep instructions and links synchronized; actual coding-agent invocation not guaranteed |
| P14 | 100 live streams | 100 synthetic tiles, adjustable 1–100 limit (default 4) | Real 1/10/25/50/75/100 session benchmarks, soak and resource evidence on each target |
| P15 | Independent lifecycle assistance | Shared stage catalog, bounded service/process/common-path discovery, local doctor, setup guidance, minimal safe report and local wizard stage history; adoption-specific preview and service diagnostics, local handoff; pre-Node terminal help | Broader discovery, guided service lifecycle and adoption recovery, transactional fresh-install recovery across all entrypoints, error-specific dashboard help, broader diagnosis, watchdog and physical failure-injection tests |

No stable release until all gates pass; do not equate a green unit suite with verified physical performance. Repository license remains an owner decision, not a technical test. Historical implementation evidence must identify its exact commit; failed or queued current CI is not a pass.

For session continuity and exact verified baseline see [PROJECT_MEMORY.md](../PROJECT_MEMORY.md); refresh it on every substantive change.
