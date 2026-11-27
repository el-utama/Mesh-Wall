# MeshWall skill registry

Skills are repository-local instructions for coding agents that support Agent Skills, not runtime processes or an automatic repair daemon. They do not run by themselves. AGENTS.md requires selecting and applying relevant skills before changes.

| Skill | When to use |
| --- | --- |
| [Troubleshooting](meshwall-troubleshooting/SKILL.md) | Any bug, incident or failing check |
| [Architecture](meshwall-architecture/SKILL.md) | Design, refactor, shared contracts |
| [Platform](meshwall-platform/SKILL.md) | Armbian/Windows setup and parity |
| [Streaming](meshwall-streaming/SKILL.md) | Relay, frame, monitor, performance |
| [Security](meshwall-security/SKILL.md) | Auth, permissions, consent, secrets |
| [Operations](meshwall-operations/SKILL.md) | Service, TLS, backup, restore, update |
| [Testing](meshwall-testing/SKILL.md) | Test design, CI, physical acceptance |
| [UI/UX](meshwall-ui-ux/SKILL.md) | Any user-facing change |
| [Release and docs](meshwall-release-docs/SKILL.md) | Requirement audit, documentation and release |

For a failure, start with troubleshooting + relevant specialist + testing; include security for trust-boundary changes, UI/UX for interface changes, platform for OS-dependent work and release/docs before reporting completion. Read only relevant references. Do not duplicate instructions or treat a skill as proof of working behavior.
