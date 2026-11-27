# Product requirements

## Vision
One browser workspace replaces everyday MeshCentral administration, from guided setup to authorized device monitoring and control. Engine remains MeshCentral. Primary hardware HG680P/B860H running Armbian; Windows x64 must reach equivalent supported functionality; Armbian remains the resource-optimization priority. Self-hosted/private network first.

## Users
Owner provisions and maintains server; administrator manages authorized devices/users; viewer sees only permitted screens; operator can perform explicitly granted actions. No covert monitoring or bypass of device consent.

## Requirements and acceptance
| ID | Requirement | Acceptance |
| --- | --- | --- |
| P01 | Fresh setup | Start from supported clean OS; configure engine, TLS, network, admin; verify end-to-end enrollment without native UI |
| P02 | Adopt existing | Preserve devices, users and data; no overwrite without preview, backup and confirmation |
| P03 | Inventory | List/filter/sort up to 100 enrolled PCs with connection status, group, last seen and available hardware metadata |
| P04 | Live wall | Authorized live tiles; change grid, resize individual tiles, drag, fullscreen, select monitor, persist presets |
| P05 | Remote access | Desktop, terminal, files and allowed power operations; rights enforced per user/device/session |
| P06 | Enrollment | Generate supported installer/invite, revoke enrollment and remove devices with confirmation |
| P07 | Administration | Groups, users, roles, audit, logs and notifications |
| P08 | Maintenance | Health, backup/restore, validated config edits, service management, pinned upgrades and rollback |
| P09 | Private access | Tailscale status/connectivity, guided authentication, private TLS access |
| P10 | Modularity | Typed adapters, isolated feature modules, tests, documented contracts and ADRs |

## Performance
100 enrolled PCs maximum by product design. Simultaneous screen count is adaptive and must be measured. UI indicates live, paused, degraded, offline and denied states distinctly. If limits are reached, offer explicit lower-quality or smaller active set; never silently substitute a screenshot for live.

## Out of scope initially
Custom agents/protocol, cloud SaaS, covert surveillance, continuous recording, full mobile client, unsupported platform/engine combinations. Native recovery interface remains private and restricted for emergency use only.

## Additional acceptance gates
- P11: Consistent UI/UX, responsive, accessible, keyboard-operable; visual evidence and dedicated skill.
- P12: Cross-platform feature parity (setup, service, TLS, maintenance, updates) and separate physical acceptance.
- P13: Troubleshooting, specialist skills, current bilingual documentation, and evidence-based release review.
- P14: 100 simultaneous real authorized screens is the capacity acceptance target, not an inferred guarantee; measure on target platforms without sacrificing permissions or stability.

- P15: Offline-first user self-support at every lifecycle step, including pre-Node bootstrap, discovery, install/adoption, first login, enrollment, streaming, maintenance and recovery. Each step must offer diagnostics, actionable guidance, safe authorized recovery, and verified postconditions; no dependency on AI. Both OSes are required.

## Definition of done
All routine workflows demonstrated on target hardware with authorized test devices, documented version support and measured performance; no mock-only success, no permission regression, and successful backup/restore.
