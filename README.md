# MeshWall

A lightweight, self-hosted MeshCentral administration interface with a customizable live screen wall, automated setup and Armbian/STB-first design.

**Status: planning / pre-alpha.** No production implementation or benchmark yet.

## Goals

- Replace the native dashboard for everyday authorized administration while retaining MeshCentral as the engine.
- Manage up to 100 enrolled PCs; support customizable live views, per-tile sizing, drag and drop, monitor selection and saved layouts.
- Guided fresh installation or existing server integration, Tailscale private networking, agent enrollment and service maintenance.
- Armbian on HG680P/B860H first, Windows second. Modular monolith, lightweight native services, browser-side rendering and no server-side transcoding.
- View-only by default, enforce device permissions and consent policies, audit access.

100 simultaneous live streams are a performance target, not a verified capacity on STB hardware.

See [Architecture](ARCHITECTURE.md), [Product requirements](docs/PRODUCT.md), [Setup design](docs/INSTALLATION.md), [Streaming](docs/MESHWALL.md), [Security](SECURITY.md), [Roadmap](ROADMAP.md), and [Agent instructions](AGENTS.md).

Upstream: [MeshCentral](https://github.com/Ylianst/MeshCentral) and [Tailscale](https://tailscale.com/kb). Independent project. Licensing decision pending.
