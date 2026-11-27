# Security and privacy

MeshWall manages authorized devices only. View-only by default; remote input requires explicit permission and consent policy. No covert capture, automatic recording, consent bypass, or unlogged privileged actions.

## Threat model and controls
- Unauthorized access: strong auth, upstream permission mapping, least privilege, session expiry, revocation, CSRF/origin checks and rate limiting. Never trust client-provided roles.
- Credential leakage: server-side secrets, restrictive files/OS secret store, redacted diagnostics, no secrets in Git, URLs, frontend bundle or logs.
- Network interception: valid TLS, private Tailscale connectivity, restrictive ACLs/grants; no public exposure by default.
- Privileged command/config injection: typed allowlisted helper operations, schema validation, no user shell interpolation, atomic changes and rollback.
- Supply chain: pin compatible versions, verify release integrity, review dependencies and upstream licenses, security updates with rollback.
- Denial of service: bounded sessions, queues, message sizes, retry budgets and log retention; protect setup and administrative routes.
- Sensitive desktop content: explicit device authorization, no stored screenshots by default, clear live state, restrict exported logs and backups.

Audit user/device/action/time/outcome without recording screen or terminal contents unnecessarily. Keep native emergency recovery restricted, not public. Test access denial, revocation, privilege escalation, expired tokens and setup races.

## Reporting
Report vulnerabilities privately to the repository owner via GitHub private vulnerability reporting if enabled; otherwise request a private reporting channel without publishing exploit details. Do not open a public issue containing secrets. Supported version policy pending first release.

## Current implementation boundaries
Standard account creation sends the temporary password only to the authenticated upstream engine over HTTPS/WSS, clears form fields, and requires reset on first login. Direct viewer assignment is restricted to standard accounts and refuses existing custom memberships; effective/inherited permissions are not computed or revoked by this UI. Engine authorization remains authoritative. The local setup helper and offline maintenance are not a public administration API. Backup files can contain unencrypted secrets and must remain on restricted/encrypted storage. Actual remote consent/denial/revocation and physical platform testing remain release gates.
