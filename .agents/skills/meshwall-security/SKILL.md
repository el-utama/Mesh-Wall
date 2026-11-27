---
name: meshwall-security
description: Review authentication, permissions, consent, secrets, TLS, privileged maintenance, dependencies and security incidents.
---

# meshwall-security

Read SECURITY.md, docs/API-DATA.md and relevant upstream pinned source. Define trust boundaries, threat model and authorization checks for each change. Treat client input as untrusted and engine as authoritative; verify effective/inherited rights before claiming restricted access. Reject unauthorized or revoked sessions, avoid public setup or generic privileged shell, no passwords/tokens in arguments or logs, never disable certificate checks. Inspect file/path traversal, symlinks, permissions, ACLs and destructive actions. Add positive and negative tests; stop unsafe actions and preserve evidence. Report security gaps and required operator decisions privately; do not publish sensitive material.
