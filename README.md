# MeshWall

**A lightweight, self-hosted MeshCentral administration interface with a customizable live screen wall, automated setup and Armbian/STB-first design.**

Status: **Alpha implementation / lab evaluation**. Static modular dashboard, embedded upstream functional panels and Linux browser setup wizard are in source; live integration and STB capacity remain unvalidated. Not production-ready.

MeshWall aims to replace the native MeshCentral dashboard for everyday administration. MeshCentral and MeshAgent remain the underlying remote management engine. The primary deployment target is Armbian on HG680P/B860H STBs, with Windows as a secondary platform.

## Planned capabilities
- Manage up to 100 enrolled PCs; customizable live wall with individual tile sizing, drag and drop, monitor selection, fullscreen and saved layouts.
- Fresh installation or adoption of an existing MeshCentral instance through a guided setup wizard.
- Private access through Tailscale, agent enrollment, device groups, remote desktop, terminal, files, role-based access, audit and system maintenance.
- Modular monolith; lightweight native services; no server-side screen transcoding.

100 simultaneous streams are a performance target, not a validated capacity for STB hardware. Tailscale subscription eligibility and limits are independent of the application capacity.

## Documentation

| Document | Purpose |
| --- | --- |
| [Bahasa Indonesia](README.id.md) | Indonesian overview |
| [Product](docs/PRODUCT.md) | Requirements and scope |
| [Architecture](ARCHITECTURE.md) | Boundaries and dependencies |
| [Installation](docs/INSTALLATION.md) | Bootstrap and setup wizard |
| [Integration](docs/INTEGRATION.md) | MeshCentral and Tailscale contracts |
| [Live wall](docs/MESHWALL.md) | Streaming and layout |
| [UI](docs/UI.md) | UX specification |
| [UI/UX skill](.agents/skills/meshwall-ui-ux/SKILL.md) | Repository-local design and visual QA workflow for coding agents |
| [API and data](docs/API-DATA.md) | API and persistence design |
| [Testing](docs/TESTING.md) | Acceptance and performance |
| [Operations](docs/OPERATIONS.md) | Backup, update and recovery |
| [Security](SECURITY.md) | Security and privacy |
| [Roadmap](ROADMAP.md) | Delivery milestones |
| [Contributing](CONTRIBUTING.md) | Development standards |
| [Agent instructions](AGENTS.md) | Coding agent rules |
| [Repository](docs/REPOSITORY.md) | GitHub metadata |
| [ADR 0001](docs/adr/0001-modular-monolith.md) | Modular monolith decision |
| [Changelog](CHANGELOG.md) | Project history |

## Getting started
For an isolated authorized test environment, see [Alpha quickstart](docs/QUICKSTART-ALPHA.md). Linux fresh installation requires Node >=22.21.1 and authenticated Tailscale with HTTPS certificates enabled. Existing Linux/Windows adoption is available for MeshCentral 1.3.2. MeshWall embeds the native secure login and official remote desktop, terminal, files, user and engine panels in its workspace. These are compatibility integrations rather than independently implemented advanced controls. Read [implementation status](docs/IMPLEMENTATION.md) and the [request audit](docs/AUDIT.md) before use.

Run `npm run check` for syntax and unit tests. Live tests are still required.

Upstream: [MeshCentral](https://github.com/Ylianst/MeshCentral), [MeshCentral documentation](https://docs.meshcentral.com/), [Tailscale documentation](https://tailscale.com/kb). Independent project; licensing decision pending. Only enroll and access devices you are authorized to manage.
