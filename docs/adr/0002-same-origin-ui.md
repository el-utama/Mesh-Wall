# ADR 0002 — Same-origin static UI for first implementation

Status: accepted for alpha, subject to live validation.

To minimize RAM, attack surface and installation complexity, serve static feature modules from MeshCentral's customization directory. Authenticate through upstream login and use its same-origin control socket, permission checks and renderer. Do not expose a privileged web service or duplicate passwords. Keep UI feature logic and compatibility adapter separate, local layout preferences per account. This supersedes the proposed separate backend/SQLite/React requirement for alpha; add them only when needed. No upstream source patched.

Trade-off: native login and temporary embedded/deep-link panels remain; no complete replacement yet. Initial provisioning uses a temporary shared loopback wizard; offline maintenance uses local CLI. A future restricted platform helper is needed for persistent GUI backup, updates and service management. Compatibility against pinned upstream and actual STBs is mandatory.
