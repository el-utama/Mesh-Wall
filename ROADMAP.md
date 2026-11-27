# Roadmap

- M0 — Specification: product, boundaries, security, acceptance, ADR. Current stage.
- M1 — Compatibility spike: inspect HG680P/B860H Armbian OS and runtime; verify pinned MeshCentral control and relay protocols, TLS/auth, one authorized desktop session. Exit: documented real-device proof.
- M2 — Foundation: static web shell, modular backend, typed contracts, auth and permissions, SQLite migrations, automated tests.
- M3 — Setup: Linux bootstrap and wizard, fresh/adopt, Tailscale, config validation, rollback, health and enrollment. Exit: clean server to working device without native UI.
- M4 — Core management: inventory, groups, users, events, agent enrollment.
- M5 — Wall: live renderer, custom per-tile resize/drag, monitor, layout, view-only, quality scheduler; performance sweep to 100 PCs.
- M6 — Native replacement: remote desktop, terminal, file manager, allowed power actions, administration, backup/update and audit.
- M7 — Windows adapter, installers and migration; test OS-specific paths.
- M8 — Production readiness: security review, soak and capacity tests, restore/rollback, support matrix and release documentation.

Gate each milestone on evidence. No release dates or capacity promises until tested. Track gaps and regressions as issues.
