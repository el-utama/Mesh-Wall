# Coding agent instructions

Read README.md, ARCHITECTURE.md, docs/PRODUCT.md, SECURITY.md and relevant ADRs before coding. Treat Armbian HG680P/B860H as primary; Windows is secondary. Do not assume ARM64 userspace, available RAM or upstream API support without checking.

## Non-negotiable rules
- Preserve modular boundaries. Modules expose public contracts via index files; no deep cross-module imports, cyclic dependencies or duplicated adapters.
- Keep React UI separate from domain logic, transport, database and privileged OS operations. Use dependency injection and typed ports; adapters implement interfaces.
- Prefer small cohesive files and pure testable functions. No giant components, speculative frameworks or unnecessary dependencies. Static frontend build and single lightweight backend; no microservices or mandatory Docker.
- MeshCentral owns agents, permissions and session protocol. Use supported interfaces; isolate version-specific compatibility code. No invented APIs, hardcoded credentials, bypass of consent, TLS checks, or unrestricted admin shell.
- Default wall to view-only, no screen recording, respect device policy and revocation. Secrets must remain server-side. Never include live credentials in repository or logs.
- All config mutations require schema validation, backups, atomic replacement and rollback. Privileged helper accepts only allowlisted typed operations.
- Do not claim a feature works before integration testing. Mock data must be explicitly labeled. 100 live streams require actual STB benchmarks.
- Add tests for changed behavior, error paths, authorization and module contracts; maintain docs, changelog and ADRs. Preserve existing data and provide migrations.
- Make focused changes; review diff; avoid unrelated rewrites, destructive operations or dependency upgrades. Report commands actually run, results and remaining blockers.

Before merge: lint, typecheck, tests, production build, architecture boundary checks and security review. If these scripts do not exist, state that explicitly instead of reporting success.
