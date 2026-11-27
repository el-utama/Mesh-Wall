# Roadmap — current alpha

| Milestone | Current state | Remaining exit gate |
| --- | --- | --- |
| M0 Specification | Product, security, ADR, UI skill and docs available | Keep synchronized with code |
| M1 Compatibility | Pinned engine loopback, real upstream JPEG renderer with fake transport | Real authorized MeshAgent session on target hardware |
| M2 Foundation | Static modular console, socket/auth, unit/browser CI | Broader boundary and security checks |
| M3 Setup | Linux bootstrap/wizard, adoption, private TLS config | Clean STB install, safe partial setup recovery, end-to-end enrollment |
| M4 Management | Inventory, groups, invitations, accounts, direct viewer permissions, events | Advanced roles, effective rights, enrollment revocation and additional management |
| M5 Wall | Custom size/order/monitor/fullscreen/quality/presets, responsive 100 synthetic tiles | Physical stream, consent, multi-monitor, reconnect, capacity/soak benchmark |
| M6 Native replacement | Same-origin official advanced panels; offline verified maintenance | Independently usable routine remote workflows, safe GUI maintenance and engine upgrade |
| M7 Windows | Fresh installer source and cross-platform CI | Real Windows service/TLS/agent and recovery test |
| M8 Production readiness | Not reached | Physical matrix, security review, operational recovery and release evidence |

Do not assign release dates or stable streaming capacity without measurement. See [audit](docs/AUDIT.md) for requirement-level gates and [testing](docs/TESTING.md) for evidence. CI pass is not production acceptance.

Cross-platform feature parity is mandatory. See [parity matrix](docs/PLATFORM-PARITY.md).
