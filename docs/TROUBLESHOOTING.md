# Troubleshooting and incident playbook

For any failure, use the repository-local troubleshooting skill first; combine it with the affected specialist. Work on an authorized test installation. Preserve data before recovery; do not disclose passwords, tokens, invitations, private keys, real screens or full raw logs.

| Symptom | First checks | Specialist |
| --- | --- | --- |
| Adoption preview blocked | Confirm the root, default paths, distinct private backup directory and status; see [adoption error codes](ADOPTION.md#apply-verify-and-recover-locally) | operations + platform |
| Setup fails | OS/userspace, Node version, Tailscale login/DNS/HTTPS, port conflict, existing/partial root; use `doctor.mjs diagnose <root>` as documented in [self-support](SELF-SUPPORT.md) | platform |
| UI blank or wrong layout | Browser errors, exact commit, network responses, viewport, CSS tokens | UI/UX + testing |
| Cannot sign in / denied | Engine session, upstream permissions, MFA, consent, TLS | security |
| Online PC but black screen | Agent state, relay state, decoded frame, monitor, consent; never bypass policy | streaming |
| High memory / CPU / heat | Session count, profile, browser/host metrics, sustained load | streaming |
| Service / certificate failure | Service identity, private bind, expiry, peer fingerprint, recovery files; `doctor.mjs health <root> <service-name>` for fresh installs (see [self-support](SELF-SUPPORT.md)) | operations + platform |
| Backup / restore fails | Stop engine, verify manifest, disk, ownership/ACL, canonical paths, recovery folder | operations |
| CI failure | Exact SHA and failing step; separate dependency outage from code and test assertion | testing + troubleshooting |

## Safe workflow
1. Identify affected system and severity; stop new sessions or changes when access or data may be at risk.
2. Collect sanitized minimal evidence, reproduce on a lab fixture, identify root cause and add a regression.
3. Fix minimally; test the affected platform and relevant other platform, then full checks.
4. Verify results and update audit/changelog. If blocked, record what was tested, what remains and safe next action. No repeated blind retries or disabling security.
5. Escalate only when operator authorization, physical access, credentials (entered locally, not shared), a destructive choice or policy decision is needed.

For Linux service diagnostics: `systemctl status meshwall-engine`, `journalctl -u meshwall-engine -n 80`. On Windows use elevated PowerShell and `Get-Service` to locate the actual MeshCentral service; inspect Event Viewer locally. Do not start/stop a guessed service. See [operations](OPERATIONS.md) for supported recovery commands and [physical acceptance](HARDWARE-ACCEPTANCE.md) for evidence required on real hosts.

## Known failure patterns
- Windows recovery directories may be canonicalized by realpath (case or path spelling differs). Compare canonical parent paths rather than raw string prefix.
- GitHub hosted Linux APT mirrors may fail even before application tests. Distinguish infrastructure failure from an app regression. Install browser binaries normally, probe launch, and install dependencies only if needed; do not disable package signing or TLS.
