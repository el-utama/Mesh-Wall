# Implementation status — Alpha

Current architecture: same-origin static modular browser application with pinned MeshCentral 1.3.2, Node >=22.21.1, native engine service and OS Tailscale. No independent application database or persistent privileged web backend. See [ADR 0002](adr/0002-same-origin-ui.md).

## Evidence

- [Loopback CI](https://github.com/el-utama/Mesh-Wall/actions/runs/45939091748): real MeshCentral authentication, inventory, group rename, invitation, events, saved layout, generated JPEG decoding by actual upstream renderer (fake transport), repeated renderer cleanup and offline backup/restore with restart.
- [Account integration CI](https://github.com/el-utama/Mesh-Wall/actions/runs/45939435429): real engine standard account creation and direct membership grant/revoke.
- [Visual CI](https://github.com/el-utama/Mesh-Wall/actions/runs/45939435484): browser fixture with 1–100 synthetic tiles, five viewport sizes, setup state tests. Latest runs are visible in Actions.
- Unit tests cover layout, connection, validation, renderer cleanup, TLS preparation, backup/restore and UI update/rollback. Windows CI now includes code, PowerShell syntax, shared wizard browser fixture and real loopback engine test. Run-specific results determine whether each passes; no privileged setup.

## Implemented source

Core inventory, enrollment, device/group edits, account creation/direct viewer grant and revoke, recent events, diagnostics, view-only wall, monitor picker, quality presets, resize/order/focus/fullscreen, per-account local layouts, control reconnect with bounded retry. Sockets stop wall sessions when inventory/authorization is lost; screen reconnect remains explicit. Official upstream login, desktop, terminal, files and advanced administration remain embedded compatibility panels.

Linux and Windows bootstrap and shared local setup, Windows installer candidate, adoption and local maintenance CLI are available. Offline backup/restore is proven in Linux and Windows loopback CI; UI update rollback is unit-tested. Neither is yet validated on physical target systems.

## Remaining gates

Actual authorized agent desktop transport, consent/denial/revocation, multi-monitor, real setup, physical ARM64 STB and Windows host, simultaneous live capacity and soak tests. Full independent native replacement, effective permission management, GUI maintenance, engine upgrade/rollback and unattended certificate renewal remain incomplete. Local Linux and Windows renewal commands with offline certificate rollback are available in source; actual Tailscale issuance/restart remains unvalidated on both platforms. Do not infer production readiness from CI. See [audit](AUDIT.md).

Shared localhost setup server/assets and Windows TLS renewal adapter are now in source; CI and physical service acceptance are separate gates.

Baseline 393b184: [Linux unit](https://github.com/el-utama/Mesh-Wall/actions/runs/45949105904), [Linux loopback](https://github.com/el-utama/Mesh-Wall/actions/runs/45949105812) and [visual](https://github.com/el-utama/Mesh-Wall/actions/runs/45949105773) passed. [Windows](https://github.com/el-utama/Mesh-Wall/actions/runs/45949105814) failed on skill frontmatter CRLF assertion before loopback; fix normalizes line endings and is subject to new CI. Earlier Windows loopback reached real account management and renderer, but restore restart/login was not verified at that time. Do not treat historical evidence as current HEAD status. See [platform parity](PLATFORM-PARITY.md).

## Later verified baseline (27 November 2026)
Commit 654fd616a6dab03d183f20c2a7afd996c7e2121f: [41 unit checks passed](https://github.com/el-utama/Mesh-Wall/actions/runs/45952154871), [Linux loopback](https://github.com/el-utama/Mesh-Wall/actions/runs/45952154844), [visual](https://github.com/el-utama/Mesh-Wall/actions/runs/45952154836), and [Windows parser, wizard fixture and real loopback](https://github.com/el-utama/Mesh-Wall/actions/runs/45952154879) passed. Adoption uses staged exclusive placement with verified backup and recovery journal, and both fresh installers use advisory discovery. No physical service provisioning or real live agent validated. Current resumable state: [PROJECT_MEMORY.md](../PROJECT_MEMORY.md).
