---
name: meshwall-platform
description: Implement or troubleshoot Linux/Armbian and Windows bootstrap, setup, installer, services, dependencies and OS parity.
---

# meshwall-platform

Read docs/INSTALLATION.md, docs/PLATFORM-PARITY.md and docs/QUICKSTART-ALPHA.md. Compare both adapters and actual userspace/runtime, not just CPU architecture. Share wizard and validation; use explicit OS-specific service operations, official dependency sources, safe paths and pinned engine. Preflight conflicts, disk, architecture, network and privilege; keep credentials out of argv/logs. Verify service identity, private bind, TLS and actual readiness. Never overwrite partial installs or change tailnet ACLs silently. Test failure states and both CI runners; record physical installation as pending until verified. Update parity matrix and user docs.

## Completion and escalation checklist
Review installers/setup/ and both OS adapters. Run unit, Bash/PowerShell syntax, shared browser and real loopback checks; report each OS separately. Do not assume a 64-bit CPU means 64-bit userspace. Verify private bind/service identity physically before production.
