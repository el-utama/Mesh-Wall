---
name: meshwall-operations
description: Implement and diagnose backup, restore, service lifecycle, TLS renewal, UI/engine upgrades and recovery on both platforms.
---

# meshwall-operations

Read docs/OPERATIONS.md, docs/PLATFORM-PARITY.md and SECURITY.md. Confirm service identity and stopped state for offline mutations, verify backup checksums, keep data and recovery directories restricted, and check free space. Stage and validate candidate before interruption; serialize jobs and preserve prior state. Use fixed typed operations, never arbitrary shell through web. Verify actual HTTPS/peer certificate and authorized login after restart; rollback only when supported and preserve evidence on failure. Document power-loss/manual recovery and test both platforms. Do not claim engine upgrade or unattended scheduling exists before implementation and acceptance.
