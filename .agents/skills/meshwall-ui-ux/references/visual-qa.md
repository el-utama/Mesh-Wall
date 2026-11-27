# Visual acceptance checklist

Use this checklist for each affected screen. Record pass/fail/not tested plus evidence; fix failures and repeat relevant checks. Do not mark unchecked items as passed.

| Area | Acceptance |
| --- | --- |
| Viewports | 1920×1080, 1440×900, 1280×720, 768×1024, 390×844; also 200% zoom where practical |
| Hierarchy | Clear title, primary action, aligned controls, consistent typography/spacing; no clipped or overlapping content |
| Responsive | No page-level horizontal overflow; dense tables scroll locally; navigation and dialogs reachable |
| Wall density | 1, 4, 16, 50, 100 synthetic tiles; 1–10 columns; compact high-density controls, no overlap, focus/fullscreen, individual resize and reorder |
| Layout | Presets persist, switching/restoring works, drag has keyboard alternative, resize respects limits |
| States | Loading, empty, offline, denied, connected-without-frame, live, stale, paused and error have clear labels; no fabricated production data |
| Keyboard | Tab order, visible focus, Enter/Space, Escape, modal focus return, non-drag controls |
| Accessibility | Labels, landmarks, text alternatives, status announcements where helpful, WCAG AA contrast targets, reduced motion |
| Safety | No accidental remote input, no session started from cosmetic action, consent respected, destructive changes confirmed |
| Performance | No unnecessary requests, runaway timers, excessive DOM growth or external assets; synthetic wall tests do not prove 100 live streams |
| Visual evidence | Inspect screenshots before and after; use synthetic or authorized lab data; no credentials, setup tokens, actual remote screens or private logs |
| Regression | Run syntax/unit and relevant browser/integration checks; report actual results and limitations |

## Review report
- Screens and flows changed
- Design decisions and shared components/tokens touched
- Screenshots inspected and viewport dimensions
- Test commands/results, defects corrected, and recheck evidence
- Not-tested conditions, security/performance limitations, and release blockers

Browser smoke tests and screenshots are complementary. Passing unit tests does not constitute a visual pass; screenshots alone do not constitute working behavior.
