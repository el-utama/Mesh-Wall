# Installation and setup design (not executable yet)

## Compatibility preflight
Detect board, architecture (kernel AND userspace), OS release, Node runtime compatibility, RAM, storage, systemd/service manager, DNS/time, port conflicts and network. HG680P/B860H variants differ. ARM32 only if dependencies are validated. Prefer SSD/eMMC reliability and wired networking. Windows x64 secondary.

## Planned bootstrap
Linux install.sh and Windows install.ps1 are future reviewed release artifacts. Download versioned, integrity-checked packages; use least privilege. Bootstrap installs minimal MeshWall runtime and restricted setup helper. No blanket root web service. Initial wizard available via local or explicitly authorized private connection, secured by one-time setup token; expire token after initialization. No default password or public setup endpoint.

## Wizard
1. System check; report blockers and remediation, never proceed on incompatible runtime.
2. Tailscale: detect/install supported client, guide official login; do not store auth keys in logs or browser.
3. Fresh or existing MeshCentral: discover instance, version, config and data paths. Existing adoption is read-only by default, with a verified backup before edits.
4. Generate proposed configuration from supported schema; review diff, validate TLS hostname and credentials, write atomically.
5. Register and start services (systemd or Windows service); dedicated unprivileged service accounts.
6. Create/link administrator using supported upstream methods; disable setup token, enforce authentication and least privilege.
7. Verify engine readiness, DNS/TLS, WebSocket, authorized test agent enrollment, live screen and remote access policy.
8. Mark setup complete only if required tests succeed. On failure show logs, safe retry, rollback and recovery guidance.

## Paths (proposed)
Linux config /etc/meshwall, state /var/lib/meshwall, logs via journal with retention; Windows ProgramData/MeshWall with restrictive ACLs. Upstream state kept separate. Exact service names/ports and engine parameters TBD after compatibility spike.

## Uninstall and migration
Stop services, revoke integration credentials, keep user data by default; explicit confirmation for purge. Export versioned backup, validate destination OS/arch and certificates before restoring. Do not copy active SQLite files without consistent snapshot. See OPERATIONS.md.

No command shown here is a production installer. Verify upstream requirements at https://docs.meshcentral.com/ and https://tailscale.com/kb.
