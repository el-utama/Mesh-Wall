# Implementation status — Alpha

Current architecture: same-origin static modular browser application with pinned MeshCentral 1.3.2, Node >=22.21.1, native engine service and OS Tailscale. No independent application database or persistent privileged web backend. See [ADR 0002](adr/0002-same-origin-ui.md).

## Evidence

- [Loopback CI](https://github.com/el-utama/Mesh-Wall/actions/runs/45939091748): real MeshCentral authentication, inventory, group rename, invitation, events, saved layout, generated JPEG decoding by actual upstream renderer (fake transport), repeated renderer cleanup and offline backup/restore with restart.
- [Account integration CI](https://github.com/el-utama/Mesh-Wall/actions/runs/45939435429): real engine standard account creation and direct membership grant/revoke.
- [Visual CI](https://github.com/el-utama/Mesh-Wall/actions/runs/45939435484): browser fixture with 1–100 synthetic tiles, five viewport sizes, setup state tests. Latest runs are visible in Actions.
- Unit tests cover layout, connection, validation, renderer cleanup, TLS preparation, backup/restore and UI update/rollback. Windows CI covers code and PowerShell syntax, not privileged setup.

## Implemented source

Core inventory, enrollment, device/group edits, account creation/direct viewer grant and revoke, recent events, diagnostics, view-only wall, monitor picker, quality presets, resize/order/focus/fullscreen, per-account local layouts, control reconnect with bounded retry. Sockets stop wall sessions when inventory/authorization is lost; screen reconnect remains explicit. Official upstream login, desktop, terminal, files and advanced administration remain embedded compatibility panels.

Linux bootstrap and local setup, Windows installer candidate, adoption and local maintenance CLI are available. Offline backup/restore is proven in loopback CI; UI update rollback is unit-tested. Neither is yet validated on physical target systems.

## Remaining gates

Actual authorized agent desktop transport, consent/denial/revocation, multi-monitor, real setup, physical ARM64 STB and Windows host, simultaneous live capacity and soak tests. Full independent native replacement, effective permission management, GUI maintenance, engine upgrade/rollback and unattended certificate renewal remain incomplete. A local Linux renewal command with offline certificate rollback is available in source; actual Tailscale issuance/restart and Windows renewal remain unvalidated. Do not infer production readiness from CI. See [audit](AUDIT.md).

Shared localhost setup server/assets and Windows TLS renewal adapter are now in source; CI and physical service acceptance are separate gates. See [platform parity](PLATFORM-PARITY.md).
