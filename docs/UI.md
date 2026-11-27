# UI specification

## Target design (not all features implemented)
Responsive static SPA with compact navigation: Overview, MeshWall, Devices, Groups, Activity, Notifications; Administration: Users & Permissions, Enrollment, Network, Engine, Health, Backup & Restore, Settings. Setup takes precedence before initialization.

Overview: enrolled/online/offline counts, last event, health and errors. Wall: grid/free resize, search/filter, monitor selector, layout presets, quality profiles, pause/resume, fullscreen, explicit control mode. Per-tile state and last frame time. Devices: accessible searchable table, status, group, OS, last seen, permissions and actions.

Prefer consistent spacing, keyboard navigation, accessible labels, status text not color alone, light/dark themes, clear loading/empty/error states. Destructive operations require impact preview and confirmation. Diagnostics provide copyable redacted errors. Mock screens labeled demo; no invented online data. Lazy load remote modules. Avoid crowded controls at 10-column wall scale.

## Design quality gate
All UI work follows the [MeshWall UI/UX skill](../.agents/skills/meshwall-ui-ux/SKILL.md), [design system](../.agents/skills/meshwall-ui-ux/references/design-system.md) and [visual QA checklist](../.agents/skills/meshwall-ui-ux/references/visual-qa.md). These describe the target experience; existing screens must be audited against them. Use compact workstation-style layouts, screen-first tile density, shared CSS tokens and accessible interactions. Do not introduce framework or asset dependencies solely for styling.

## Current UI implementation
Current navigation: Overview, MeshWall, Devices, Groups & enrollment, Users & permissions, Activity, Settings / diagnostics. Login/remote desktop/terminal/files/advanced administration use upstream compatibility panels. Setup wizard is shared between OSes. Existing-server review shows discovered and manual paths, the affected UI files, registered service and account inspection with a local manual path for custom launchers, backup-path validation and local terminal instructions. Separate notifications, full GUI maintenance, light theme and in-wall control are targets, not shipped features. See [UI audit](UI-AUDIT.md). The wall uses an inspector for selected device controls, responsive effective columns, accessible non-drag ordering, group/status filters, and clear no-frame states. Browser fixture tests use synthetic inventory only.
