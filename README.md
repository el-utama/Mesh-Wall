# MeshWall

**Lightweight, self-hosted MeshCentral administration with a customizable live screen wall, guided setup and Armbian/STB-first design.**

Status: **Alpha / isolated lab evaluation.** Core browser workflows and offline restore have been tested against MeshCentral 1.3.2 in CI. Actual agent streams, physical HG680P/B860H and Windows installs, and 100 simultaneous live streams are not yet validated. Not a production release.

MeshWall aims to replace the native dashboard for everyday administration. MeshCentral and MeshAgent remain the engine. The primary server target is Armbian on HG680P/B860H; Windows x64 is secondary.

## Available in the current source

- Responsive modular console, inventory of up to 100 authorized PCs, filters, device/group rename and move, time-limited enrollment invitations.
- View-only wall with 1–10 desired columns, adjustable individual tiles, drag and keyboard reordering, focus/fullscreen, monitor picker, quality presets and saved layouts. Default four concurrent sessions, configurable up to 100.
- Standard account creation and verified direct view-only group assignment/removal. Inherited or custom rights remain managed by the official advanced panel.
- Embedded official authentication, desktop, terminal, files and advanced administration panels; no separate public backend.
- Linux prerequisite bootstrap, localhost setup wizard, Windows fresh installer candidate and existing installation adoption.
- Offline backup/verification/restore and reversible UI-only updates; local CLI, not privileged browser operations.

100 enrolled PCs is a product cap, not a verified Tailscale entitlement or STB streaming capacity.

## Quick start (lab only)

Review [platform requirements and prerequisites](docs/INSTALLATION.md) and [Alpha quickstart](docs/QUICKSTART-ALPHA.md). On a supported fresh 64-bit Armbian/Debian/Ubuntu host:

```bash
git clone https://github.com/el-utama/Mesh-Wall.git
cd Mesh-Wall
sudo bash installers/linux/bootstrap.sh
```

If Node.js >=22.21.1 and authenticated Tailscale are already available, use `sudo node installers/linux/setup.mjs`. MagicDNS and HTTPS certificates must be enabled. Use the exact local wizard URL and an authorized SSH tunnel on a headless server. Windows instructions and adoption steps are in the quickstart. Do not expose setup publicly.

## Documentation

| Document | Purpose |
| --- | --- |
| [Bahasa Indonesia](README.id.md) | Indonesian overview |
| [User guide](docs/USER-GUIDE.md) | Everyday workflow and limitations |
| [Product](docs/PRODUCT.md) | Requirements |
| [Architecture](ARCHITECTURE.md) | Actual module boundaries |
| [Installation](docs/INSTALLATION.md) | Platform support and setup |
| [Quickstart](docs/QUICKSTART-ALPHA.md) | Executable lab instructions |
| [Integration](docs/INTEGRATION.md) | Upstream protocol contracts |
| [Live wall](docs/MESHWALL.md) | Streaming and layout |
| [UI](docs/UI.md) / [UI audit](docs/UI-AUDIT.md) | UX and validation |
| [UI/UX skill](.agents/skills/meshwall-ui-ux/SKILL.md) | Agent design and visual QA |
| [API and data](docs/API-DATA.md) | Actual data ownership and future design |
| [Testing](docs/TESTING.md) | CI and physical acceptance gates |
| [Operations](docs/OPERATIONS.md) | Backup, restore, updates |
| [Security](SECURITY.md) | Security boundaries |
| [Implementation](docs/IMPLEMENTATION.md) / [Audit](docs/AUDIT.md) | Evidence and remaining gaps |
| [Roadmap](ROADMAP.md) | Milestones |
| [Contributing](CONTRIBUTING.md) / [Agent instructions](AGENTS.md) | Development rules |
| [Repository](docs/REPOSITORY.md) / [Changelog](CHANGELOG.md) | Metadata and history |
| [ADR 0002](docs/adr/0002-same-origin-ui.md) | Current architectural decision |

Run `npm run check`. See [GitHub Actions](https://github.com/el-utama/Mesh-Wall/actions) for commit-specific checks. Browser fixtures and generated JPEG rendering do not establish actual live agent performance.

Upstream: [MeshCentral](https://github.com/Ylianst/MeshCentral), [documentation](https://docs.meshcentral.com/), [Tailscale](https://tailscale.com/kb). Independent project; licensing decision pending. Only manage devices with authorization.
