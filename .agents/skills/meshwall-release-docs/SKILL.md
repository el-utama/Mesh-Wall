---
name: meshwall-release-docs
description: Maintain release readiness, requirements traceability, README, architecture, troubleshooting, changelog and platform parity after changes.
---

# meshwall-release-docs

Read docs/PRODUCT.md, docs/AUDIT.md, docs/PLATFORM-PARITY.md and ROADMAP.md. Check every original requirement against current source and actual evidence. Update English/Indonesian README, user/installation/operations docs, changelog, ADR as applicable; replace stale claims, label proposed vs implemented vs verified. Verify relative links and commands, record exact commit/workflow evidence, unresolved risks and platform gaps. A green CI run is not physical acceptance. Do not call stable until all required gates pass; do not invent release dates or claim unseen hardware tests.

## Completion and escalation checklist
Trace P01–P15 in docs/AUDIT.md. Check local links, commands against actual files, historical ADR status and exact CI SHA. Distinguish historical evidence and current HEAD. Keep bilingual docs synchronized; do not change visibility or license without owner approval.
