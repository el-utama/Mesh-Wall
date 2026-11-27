---
name: meshwall-architecture
description: Plan and review module boundaries, refactoring, feature architecture and shared cross-platform abstractions.
---

# meshwall-architecture

Read ARCHITECTURE.md, docs/PRODUCT.md, ADR 0002 and AGENTS.md. Identify affected contracts before editing. Keep same-origin lightweight browser modules, separate pure logic/DOM/transport and OS adapters; preserve upstream authority and avoid a second persistent runtime without an ADR. Use shared contracts for Windows/Linux, preserve config/data compatibility, and check installer/adoption/UI release file lists when modules change. Add boundary and behavioral tests; document decisions and verify both platforms. Do not replace working modules merely to match a preferred framework.

## Completion and escalation checklist
Use explicit public exports in plain JavaScript; index files and TypeScript are not mandatory. Check browser module import graph, adoption and UI-release file lists when adding files. Record changed contracts, rollback implications and ADR decisions.
