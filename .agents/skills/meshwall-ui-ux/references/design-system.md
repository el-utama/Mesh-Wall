# MeshWall design system

## Direction
A professional network operations console: restrained, precise, functional, high information density without clutter. Prefer neutral graphite/slate surfaces, a single teal accent and semantic status colors. This is a proposed baseline, not a claim that current UI meets it. Dark-first with an equally readable light theme as a future supported variant. Use system-ui and monospace for IDs/logs; no externally hosted fonts.

## Shared tokens
Implement centrally as CSS custom properties; preserve semantic names and avoid per-page hardcoded colors. Use a 4px spacing scale (4/8/12/16/20/24/32), control height 32–36px desktop, 40–44px touch where practical, border radii 6/8/12px, 1px subtle borders. Base type 14px, labels 12–13px, section headings 16–18px, page headings 24–28px. Use tabular numerals for metrics. Never shrink primary text to make a crowded layout fit.

Suggested dark palette: background #0D121C, navigation #101824, panel #151E2C, raised #1B293A, border #304258, meaningful control border #647B93, text #E4EDF6, muted #A8B9CC, accent #5ED6B1, warning #F1BF65, danger #F28B8B, info #8CB8F5. Verify contrast in context; do not use accent alone to indicate status. Define focus, hover, selected, disabled and error tokens. Minimum WCAG AA contrast targets: 4.5:1 for normal text, 3:1 for large text and meaningful control boundaries/focus where applicable.

## Layout
Desktop: compact collapsible navigation, single page header, contextual action bar, content area with predictable padding. Keep aligned control heights and labels; group related actions and move secondary actions into menus. Avoid duplicate titles, nested card padding, gratuitous separators or boxed everything. At narrow widths use a navigation drawer or wrapped navigation and stacked controls; prevent document-level horizontal overflow. Local horizontal scrolling is acceptable for dense tables when indicated. Dashboard cards should communicate a real metric or useful action, not decoration.

## MeshWall
Provide a compact toolbar: group/search, visible count, layout preset, grid columns, quality, active limit, start/stop. Put less common controls in accessible menus. Make the live screen surface dominate each tile. Preserve aspect ratio and fit without stretching. Tile header: device name, text state, meaningful indicator. At high density, move resize/monitor/fullscreen actions into a keyboard-accessible menu or selected-tile inspector. Provide pointer and keyboard alternatives to drag/reorder/resize, including explicit move controls. Preserve layout geometry and existing sessions on reorder. A 10-column layout must remain usable through focus mode and compact tiles; do not force tiny illegible button labels. Show actual last draw timestamp and stale/paused state distinctly; never label a connection as a live image before drawing.

## Management screens
Sortable/filterable tables with aligned headers, meaningful empty/loading/error state, consistent status chips, and row actions grouped predictably. Avoid revealing sensitive IDs or secrets in default views. Use confirmations with specific impact for changes to device membership, permissions and destructive actions. Keep native compatibility panels visibly identified and same-origin; dialogs have clear title, close action, focus return and predictable keyboard escape.

## Setup wizard
One clear step at a time: prerequisites, admin, installation, verification, recovery. Show blockers with actionable guidance and explain Tailscale certificate disclosure. Do not mark success until required checks actually pass. Separate password fields from diagnostics; do not leak setup tokens. Errors remain readable and local. No unnecessary animation, progress percentages invented from elapsed time, or public setup listener.

## Accessibility and performance
Use semantic HTML, labeled form fields, visible focus, logical tab order, accessible dialog names, keyboard alternatives, reduced-motion preferences, readable empty states, and adequate click targets. Prefer stable DOM and incremental updates over rebuilding the wall. Measure before adding expensive effects. No autoplay decorations, blur-heavy panels, external icon/font fetches or extra rendering processes on the STB.
