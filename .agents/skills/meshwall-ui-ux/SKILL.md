---
name: meshwall-ui-ux
description: Design, implement, audit and refine MeshWall interfaces, including responsive dashboard layouts, live screen walls, device tables, setup wizard, CSS, accessibility and visual regression tests. Use for any user-facing change, redesign or UI review.
---

# MeshWall UI/UX

Deliver a professional, compact remote-management workstation, not a generic landing page or a collection of decorative cards. Prioritize scanning, operator efficiency, predictable interactions and STB-friendly execution.

## Workflow

1. Read root AGENTS.md, docs/UI.md, docs/MESHWALL.md and the relevant feature modules. Read [design system](references/design-system.md) before styling.
2. Audit the actual interface and user flow before changing it. Identify hierarchy, density, accessibility, responsive behavior, and error states. Use a real browser if available; never infer a visual pass from source alone.
3. Define the affected screens, primary action, reusable patterns, breakpoints and acceptance criteria. Preserve the existing domain and authorization contracts. Prefer a focused change over a rewrite.
4. Implement using shared CSS tokens and reusable components. Keep page-specific CSS/DOM logic within the feature; do not couple the wall renderer to shell or setup UI. Do not add a framework or dependency solely for cosmetic effects.
5. Test with empty, populated, offline, denied, loading and error states; use synthetic devices/screen content clearly marked as test fixtures. Verify keyboard, mouse, responsive layout and meaningful actions. Never connect to real devices for aesthetic tests without authorization.
6. Capture before/after screenshots of affected pages when possible, inspect at actual viewport size, correct defects, then re-run tests. Do not upload credentials, real remote screens or sensitive diagnostic logs. Use [visual QA checklist](references/visual-qa.md).
7. Run the relevant repository checks and integration tests. In the final report state what was actually inspected, viewport sizes, test results, changes and remaining limitations. If a browser or environment is unavailable, mark visual verification pending rather than claiming polish.

## Non-negotiable

- Screen content is the focal point of MeshWall. Optimize 1–100 tiles; no huge headers, oversized cards, decorative gradients or constant animation.
- Use a consistent spacing scale, typography, semantic colors, icons and aligned controls. Avoid invented metrics or generic filler.
- Provide full keyboard operation, visible focus, accessible names, text status, sufficient contrast, and a non-drag alternative for moving and resizing tiles.
- Keep view-only default, clearly distinguish live/connecting/paused/offline/denied, and preserve upstream consent and authentication. Never visually imply access or a completed install before verified.
- Keep UI lightweight: local fonts or system stack, CSS over animation libraries, no external CDN assets; rendering/updates must not create a server-side transcoding workload.
- All required actions must work; no placeholder buttons, dead links or simulated production telemetry.
- Visual quality is a release gate, not a substitute for live integration or STB performance validation.
