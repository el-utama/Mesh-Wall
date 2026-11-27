# MeshWall

**A lightweight, self-hosted MeshCentral administration interface with a customizable live screen wall, automated setup and Armbian/STB-first design.**

Status: **Planning / pre-alpha**. This repository contains engineering specifications, not a working release.

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
There is no runnable installer yet. Follow the roadmap; do not treat example contracts as implemented APIs.

Upstream: [MeshCentral](https://github.com/Ylianst/MeshCentral), [MeshCentral documentation](https://docs.meshcentral.com/), [Tailscale documentation](https://tailscale.com/kb). Independent project; licensing decision pending. Only enroll and access devices you are authorized to manage.
