---
name: meshwall-streaming
description: Diagnose or improve desktop relay, rendering, multi-monitor, quality, session scheduling, reconnect and live wall resource usage.
---

# meshwall-streaming

Read docs/MESHWALL.md, docs/INTEGRATION.md and pinned upstream renderer/relay source. Distinguish online agent, relay connection, decoded frame, last change and session termination. Never infer live from socket state. Keep view-only default, enforce consent, no hidden auto-resume after denial/revocation, cap concurrency and clean up timers/canvas/listeners. Reproduce with generated JPEG fixture then authorized actual agent. Compare browser CPU/memory, host CPU/RSS/temperature, network and frame freshness at staged load; distinguish 100 synthetic tiles from 100 live streams. Avoid server transcoding and report measured capacity rather than estimates.

## Completion and escalation checklist
Inspect desktop.mjs, wall.mjs, model.mjs, control.mjs and generated-frame integration. A static screen can legitimately have no new frame. Report requested quality parameters, enrolled/active/decoded counts and test scope. Never assume consent-safe auto-resume.
