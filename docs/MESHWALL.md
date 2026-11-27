# Live wall and streaming

## Layout
Grid and free resize per tile; drag and drop; configurable rows/columns, gaps and aspect ratio; group/search/status filters; monitor picker, fullscreen focus, keyboard controls, per-user saved layouts. Persist layout by stable device ID and monitor ID; remove missing entries safely. Handle 100 tiles without mounting heavy hidden canvases.

## Session state
idle -> connecting -> live -> degraded/paused -> reconnecting -> live; offline, denied and error are explicit terminal or retryable states. Show last frame timestamp on stalled connections, not a misleading live indicator. View-only default, explicit permission-gated control mode on focused screen. No automatic recording.

## Adaptive streaming
Initial STB profile target 1–3 FPS, 320x180 equivalent scaling, subject to upstream capabilities. Balanced 5–10 FPS; focused tile higher quality as capacity permits. Use bounded start queue, visibility-aware pause, per-tile quality and browser rendering; fair allocation across active tiles; exponential backoff with jitter. Allow a deliberate all-visible wall; do not silently replace live streams with snapshots. Limit active sessions based on actual CPU, RAM, network, frame age and browser load. Avoid server-side transcoding.

## Performance
100 enrolled devices and 100 simultaneous live tiles are distinct requirements. Test 1, 10, 25, 50, 75, 100 sessions with static and changing desktops; monitor server RSS/CPU, bandwidth, latency/frame age, reconnects and browser memory/CPU. Estimate one-way bandwidth as active streams × average bitrate, then include protocol and relay overhead; measure actual traffic. At 150 kbps × 100 = 15 Mbps nominal per direction. Do not promise throughput on a 100 Mbps STB or assume all streams can run at 30 FPS.

## Acceptance
Layout reload persists; resize/drag/focus works; monitor select is accurate; only authorized tiles stream; revoked access terminates; no memory/session leak after closing wall; quality changes are observable. Publish hardware/version/network results and stable concurrency limit.
