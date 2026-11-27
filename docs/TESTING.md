# Testing and acceptance

Unit: layout geometry/persistence, quality scheduler, capability/error mapping, validation, permission decisions, job state machine. Integration: pinned MeshCentral test instance, authorized test agents, auth/session lifecycle, enrollment, reconnect, config rollback, migration/backup restore, Tailscale adapter mocked and real smoke tests. End-to-end: setup fresh/adopt, login, inventory, wall layout/monitor/focus, allowed and denied actions, service recovery.

Platform matrix: HG680P and B860H actual Armbian builds with architecture/RAM recorded; Windows x64; Debian/Ubuntu baseline. ARM32 conditional. Test cold boot, restart, limited storage, DNS/TLS failure, offline PC, consent denied, engine update/rollback.

Performance matrix: 1/10/25/50/75/100 enrolled and concurrent sessions, varying screen activity and network. Record CPU/RSS, thermal throttling, network in/out, browser memory/CPU, frame age, dropped/stalled sessions and reconnects. Run sustained soak and reconnect storm; inspect leaks after closing. Define measured stable capacity, quality and hardware details; 100 simultaneous streams not accepted until measured. Fail gracefully if limit reached.

CI target: lint, typecheck, unit/integration tests, production build, dependency/boundary checks and secret scan. CI does not replace real-device tests. Publish evidence and known gaps. No fake passing tests or claims based solely on mock data.
