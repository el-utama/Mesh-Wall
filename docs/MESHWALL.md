# Live wall and streaming

## Implemented alpha behavior
The wall uses stable device IDs, up to 100 authorized inventory tiles, 1–10 desired columns (effective count adapts to viewport), individual width and height, pointer resize/drag and keyboard controls, group/search/status filters, selected-device inspector, focus, individual/full-wall fullscreen and monitor selection. Presets store columns/order/sizes locally per account; monitor choice is not persisted in the preset. Session limit defaults to 4, adjustable 1–100. No server transcoding or recording. The wall is view-only; permitted control is through the official desktop panel.

A connection is not Live until an actual canvas draw. Ready, queued, connecting, waiting, live, offline, stopped and ended/no-session/error are distinguished; last draw is not proof of failure for a static desktop. Filtering out a device, leaving/hiding the wall or losing authorization stops affected sessions. Dashboard control reconnect attempts after transient loss are bounded (1, 2, 4, 8, 16 seconds); desktop sessions do not auto-resume. Actual denial/revocation and monitor behavior need live-agent tests.

| Profile | Requested quality | Scale (1024 = native) | Requested frame interval |
| --- | --- | --- | --- |
| Eco | 25 | 256 | 500 ms |
| Balanced | 40 | 384 | 250 ms |
| High | 55 | 640 | 125 ms |
| Focused | 55 | 768 | 100 ms |

Values are current model.mjs parameters sent to the pinned upstream renderer, not measured FPS, bitrate or resolution. Scheduling uses a bounded explicit active set, not measured adaptive CPU/RAM control.

## Remaining target
Configurable gaps/aspect ratio, monitor-specific saved preference, explicit pause/resume and richer stale/denied status, automatic resource adaptation and safe consent-aware stream reconnect remain incomplete. No silent screenshot substitution or consent bypass.

## Capacity and acceptance
100 enrolled devices and 100 simultaneous live tiles are distinct requirements. Test 1/10/25/50/75/100 authorized sessions on each target OS using static and changing desktops; record server RSS/CPU/temperature, bandwidth, latency/frame age, browser memory/CPU, reconnects and cleanup. Nominal bitrate example 150 kbps × 100 = 15 Mbps in one direction before overhead; not a measurement. See [hardware acceptance](HARDWARE-ACCEPTANCE.md) and [audit](AUDIT.md). Synthetic 100-tile tests and real upstream JPEG decoding with fake transport do not establish live capacity.
