# Testing and acceptance

## Target acceptance plan (not all implemented)
Unit: layout geometry/persistence, quality scheduler, capability/error mapping, validation, permission decisions, job state machine. Integration: pinned MeshCentral test instance, authorized test agents, auth/session lifecycle, enrollment, reconnect, config rollback, migration/backup restore, Tailscale adapter mocked and real smoke tests. End-to-end: setup fresh/adopt, login, inventory, wall layout/monitor/focus, allowed and denied actions, service recovery.

Platform matrix: HG680P and B860H actual Armbian builds with architecture/RAM recorded; Windows x64; Debian/Ubuntu baseline. ARM32 unsupported in the current installer; separate validation required before support. Test cold boot, restart, limited storage, DNS/TLS failure, offline PC, consent denied, engine update/rollback.

Performance matrix: 1/10/25/50/75/100 enrolled and concurrent sessions, varying screen activity and network. Record CPU/RSS, thermal throttling, network in/out, browser memory/CPU, frame age, dropped/stalled sessions and reconnects. Run sustained soak and reconnect storm; inspect leaks after closing. Define measured stable capacity, quality and hardware details; 100 simultaneous streams not accepted until measured. Fail gracefully if limit reached.

CI target: lint, typecheck, unit/integration tests, production build, dependency/boundary checks and secret scan. CI does not replace real-device tests. Publish evidence and known gaps. No fake passing tests or claims based solely on mock data.

## Current executable checks
- `npm run check`: syntax and unit tests; Linux installer shell parsing via check.yml.
- integration.yml: real pinned engine loopback, browser auth/group/invitation/account direct rights, actual renderer decoding generated frames with fake transport, offline adoption and rollback, native login after restart, and backup/restore.
- visual.yml: Chromium fixture at five viewports, 1–100 synthetic tiles, layout/filter/keyboard, fresh setup simulated callbacks, guided adoption and service state recheck against disposable fixtures, account dialog. Screenshots are synthetic only.
- windows.yml: Windows unit tests, PowerShell parsing, a native CIM lookup and safe WinSW XML reader test, shared wizard browser fixture and real MeshCentral loopback integration/restore; no privileged installation. Inspect run-specific results before claiming pass.

Evidence: [GitHub Actions](https://github.com/el-utama/Mesh-Wall/actions). Full lint/typecheck/production build, independent accessibility audit, actual MeshAgent/consent, platform installation and live capacity tests are outstanding; do not report them as passed.

For failed checks use [troubleshooting](TROUBLESHOOTING.md) and the [specialist registry](../.agents/skills/README.md). CI distinguishes dependency installation failures from application failures. Registry unit test checks mandatory skill files and metadata on LF/CRLF; documentation test checks local Markdown links and case-sensitive paths. These are structural checks, not semantic or physical verification.
