# UI redesign audit

Baseline: 0334dcf. Applied repository-local meshwall-ui-ux skill.

Findings: per-tile controls consumed screen area and became unreadable at 10 columns; toolbar lacked grouping and status/group filters; drag reorder had no keyboard alternative; offline and no-frame surfaces looked similar; nav could not collapse; device empty states and form labels were inconsistent.

Changes: compact shell and collapsible navigation, shared CSS tokens, clear overview metrics and workflow; two-row wall toolbar with layout management, counts, group/status filters; selected-tile inspector for start/stop, monitors, focus/fullscreen, size and keyboard move; 1–10 desired columns with responsive effective count; lightweight tiles with text states, explicit no-screen placeholder and last draw time; grouped table actions and empty states; aligned setup wizard styling. No external fonts/frameworks. Existing permissions and consent preserved; no automatic screen session starts. Layout remains local per account.

Verification: visual.yml captures baseline and after screenshots with synthetic inventory and checks 1920×1080, 1440×900, 1280×720, 768×1024 and 390×844, densities 1/4/16/50/100, overflow, selection, resize, reorder, focus, filters and saved preset. CI artifacts contain no real screen content. See GitHub Actions for actual outcomes. Static/unit and real loopback integration workflows remain separate.

Pending: independent WCAG manual/screen reader audit, light theme, live agent display/consent/monitor switching, 100 simultaneous live streams and HG680P/B860H benchmarks. Native compatibility panels, Tailscale prerequisites, fresh Windows install and maintenance/rollback gaps remain as documented in AUDIT.md. A passing visual fixture is not production readiness.
