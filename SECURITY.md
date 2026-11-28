# Security and privacy

MeshWall manages authorized devices only. View-only by default; remote input requires explicit permission and consent policy. No covert capture, automatic recording, consent bypass, or unlogged privileged actions.

## Threat model and required controls (not all verified)
- Unauthorized access: strong auth, upstream permission mapping, least privilege, session expiry, revocation, CSRF/origin checks and rate limiting. Never trust client-provided roles.
- Credential leakage: server-side secrets, restrictive files/OS secret store, redacted diagnostics, no secrets in Git, frontend bundle or logs; upstream invite/relay references and the one-time local setup URL fragment are sensitive and must not be shared.
- Network interception: valid TLS, private Tailscale connectivity, restrictive ACLs/grants; no public exposure by default.
- Privileged command/config injection: typed allowlisted helper operations, schema validation, no user shell interpolation, atomic changes and rollback.
- Supply chain: pin compatible versions, verify release integrity, review dependencies and upstream licenses, security updates with rollback.
- Denial of service: bounded sessions, queues, message sizes, retry budgets and log retention; protect setup and administrative routes.
- Sensitive desktop content: explicit device authorization, no stored screenshots by default, clear live state, restrict exported logs and backups.

Audit user/device/action/time/outcome without recording screen or terminal contents unnecessarily. Keep native emergency recovery restricted, not public. Test access denial, revocation, privilege escalation, expired tokens and setup races.

## Reporting
Report vulnerabilities privately to the repository owner via GitHub private vulnerability reporting if enabled; otherwise request a private reporting channel without publishing exploit details. Do not open a public issue containing secrets. Supported version policy pending first release.

## Current implementation boundaries
Standard account creation sends the temporary password only to the authenticated upstream engine over HTTPS/WSS, clears form fields, and requires reset on first login. Direct viewer assignment is restricted to standard accounts and refuses existing custom memberships; effective/inherited permissions are not computed or revoked by this UI. Engine authorization remains authoritative. The local setup helper and offline maintenance are not a public administration API. Backup files can contain unencrypted secrets and must remain on restricted/encrypted storage. Actual remote consent/denial/revocation, dependency/secret scanning, full privilege review, and physical platform testing remain release gates.

Existing-server preview requires the setup token and exact loopback origin. It displays authorized local paths, the package version and planned UI filenames. Its diagnostic output excludes paths and configuration contents. The local CLI applies adoption after operator verification of the service, privileges and backup storage. See [adoption](docs/ADOPTION.md).

The named-service probe uses fixed local commands and treats service metadata as data. Supported results expose the service name, account and normalized state to the authenticated local wizard. The safe support report excludes that information, raw command lines, service XML and environment values. The Windows reader forbids DTDs and external resolution. Service control stays with the authorized operator.

Offline `apply` and `rollback` can require a verified stopped state for a named service. The checks are snapshots of the service manager and the maintenance lock serializes MeshWall transactions. The operator keeps the engine stopped and checks for other processes using the root throughout maintenance.

The narrow fresh-install UI repair command requires the exact registered stopped service, explicit confirmation and verified full separate backup. It rejects changed or unknown existing UI and adoption journals, rechecks service state before swap, and retains previous partial UI. No generic repair or automatic service control; operators must ensure exclusive offline access and restrict backups. Physical ACL and power-loss validation remain pending.

Before repair swaps, compare the verified backup inventory to the active state while holding the maintenance lock. Failed UI rollback retains the lock and recovery evidence; a manual authorized recovery is required. Exclusive offline access remains mandatory; the checks are not an OS-level process lock.

Typed local service controls are restricted to default fresh installations, require explicit downtime acknowledgment and OS privileges, never elevate or execute an arbitrary shell, and verify registered identity/state around transitions. The maintenance lock is retained when a dispatched operation cannot be verified. No automatic retry or repair. External native service operations are not serialized by this lock; exclusive maintenance access is required. No browser or remote privileged endpoint is exposed.

The local config/TLS doctor reports only a known fresh security baseline and leaf/key/date/hostname evidence, not complete schema or trust validation. It never prints secret material. Custom settings require review; no automatic configuration overwrite. TLS swap rollback failure retains the maintenance lock and recovery evidence for authorized inspection.

The local recovery planner only returns a static prioritized next step and allowlisted finding codes/states; it does not execute commands or authorize maintenance. A plan is point-in-time evidence and must be rechecked before any operation. Adopted/non-default targets and maintenance locks require separate review.
