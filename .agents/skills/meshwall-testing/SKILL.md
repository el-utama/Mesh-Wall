---
name: meshwall-testing
description: Design, execute and audit unit, integration, browser visual, Windows/Linux CI, physical and release acceptance tests.
---

# meshwall-testing

Read docs/TESTING.md, docs/HARDWARE-ACCEPTANCE.md and docs/AUDIT.md. Map requirements to tests, distinguish unit/mock/loopback/physical. Reproduce failure before changing assertions; assert real invariants, canonical paths, no fake telemetry or hidden skips. Use exact workflow SHA and actual job logs. Add regression cases for failures, permission boundaries, platform differences and resource cleanup. Test both Linux and Windows; use UI/UX skill for changed screens. Inspect screenshots when possible, record pass/fail/not tested including skipped tests. Never mark 100 live streams, hardware provisioning or production readiness based on synthetic or loopback runs.
