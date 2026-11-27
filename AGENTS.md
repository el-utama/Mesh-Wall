# Coding agent instructions

Read README.md, ARCHITECTURE.md, docs/PRODUCT.md, SECURITY.md and relevant ADRs before coding. Treat Armbian HG680P/B860H as primary; Windows is secondary. Do not assume ARM64 userspace, available RAM or upstream API support without checking.

## Non-negotiable rules
- Preserve modular boundaries. Modules expose public contracts via index files; no deep cross-module imports, cyclic dependencies or duplicated adapters.
- Keep browser UI separate from domain logic, transport, database and privileged OS operations. Use dependency injection and typed ports; adapters implement interfaces.
- Prefer small cohesive files and pure testable functions. No giant components, speculative frameworks or unnecessary dependencies. Follow the current same-origin static UI architecture (ADR 0002); introduce additional runtimes only with an ADR. No microservices or mandatory Docker.
- MeshCentral owns agents, permissions and session protocol. Use supported interfaces; isolate version-specific compatibility code. No invented APIs, hardcoded credentials, bypass of consent, TLS checks, or unrestricted admin shell.
- Default wall to view-only, no screen recording, respect device policy and revocation. Secrets must remain server-side. Never include live credentials in repository or logs.
- All config mutations require schema validation, backups, atomic replacement and rollback. Privileged helper accepts only allowlisted typed operations.
- Do not claim a feature works before integration testing. Mock data must be explicitly labeled. 100 live streams require actual STB benchmarks.
- Add tests for changed behavior, error paths, authorization and module contracts; maintain docs, changelog and ADRs. Preserve existing data and provide migrations.
- Make focused changes; review diff; avoid unrelated rewrites, destructive operations or dependency upgrades. Report commands actually run, results and remaining blockers.

Before merge: lint, typecheck, tests, production build, architecture boundary checks and security review. If these scripts do not exist, state that explicitly instead of reporting success.

## Mandatory UI/UX skill
For every user-facing change (HTML, CSS, frontend behavior, setup wizard, dashboard or remote panel), read and apply `.agents/skills/meshwall-ui-ux/SKILL.md` and its relevant references. Use `docs/UI.md` as the product baseline. Inspect actual browser screenshots at relevant viewport sizes, test populated and failure states, fix defects and repeat checks. If visual verification is unavailable, disclose it as pending. Do not claim a design is complete from unit tests alone.

## Platform parity release gate
Armbian is the resource-optimization priority, not a reason to omit Windows functionality. Every installer, wizard, lifecycle or maintenance change must update [platform parity](docs/PLATFORM-PARITY.md), both OS adapters or an explicit shared implementation, tests for both platforms, README/quickstart, and the audit. Do not call either platform production-ready before physical acceptance. Do not automatically elevate privileges, publish a setup listener or bypass TLS. Document unavoidable OS-specific prerequisites and missing features as blockers.
