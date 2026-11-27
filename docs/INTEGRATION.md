# Integration specification

## Current implementation (pinned 1.3.2)
- Browser authenticates using official same-origin login; control.mjs connects to control.ashx and correlates responseid/tag. Upstream userinfo, meshes, nodes, users, events and serverstats supply inventory/administration.
- Group creation/rename, device rename/move, enrollment invitation, standard account creation and direct viewer membership use upstream commands, not a standalone REST API.
- desktop.mjs uses upstream CreateAgentRemoteDesktop and CreateAgentRedirect with engine-issued relay cookies, view-only input policy and actual draw detection; terminal/files/control use official compatibility panels. No separate session gateway shipped.
- Tailscale is an OS prerequisite; bootstrap guides login, setup binds private TLS. No full network administration panel or privileged persistent backend shipped.
- Version guard and generated-frame loopback test exist; actual agent relay and consent remain unverified.

## Target contracts (not all implemented)
## MeshCentral adapter
Expose typed methods for capability discovery, authentication, list devices/groups, events, enrollment, user permissions, remote session creation and allowed management actions. Investigate documented MeshCtrl and control WebSocket, desktop/terminal/file relay mechanisms and version compatibility. Methods are proposed contracts, not asserted upstream endpoints.

Map canonical IDs without assuming they are simple strings. Normalize status and errors; reconcile snapshots after reconnect; never treat stale cached status as live. Use bounded reconnect backoff and timeout. Prefer persistent control connection when supported.

## Authorization
Each request uses authenticated MeshWall identity and maps to an authorized upstream principal/session. Do not substitute a global administrator credential for user-level checks. Revalidate device rights, consent and session scope; revoke active sessions when rights change. If upstream integration cannot preserve permissions, disable the feature until fixed.

## Session gateway
Authorize session creation on backend; issue short-lived scoped session references where supported, validate origin, protect credentials, enforce limits. Render/decode protocol in browser through isolated compatibility adapter; no invented WebSocket paths; replace compatibility panels only when secure native implementation is verified. Validate actual protocol using pinned upstream versions. Keep TLS verification enabled.

## Tailscale adapter
Read official client status and connectivity using supported commands/API. Guide authentication and MagicDNS/TLS configuration; use explicit network ACLs/grants. Never silently change tailnet policy or use public Funnel by default. Distinguish server-only membership from per-PC membership: agents need a reachable server; not all PCs necessarily need individual Tailscale accounts if an authorized routed network is available. Verify plan terms and resource counting separately.

## Platform adapter
Typed preflight, service lifecycle, file config write, backup and network diagnostics; Linux/Windows implementations. Privileged helper narrow allowlist, no arbitrary shell input. Version-specific adapter tests and compatibility matrix required.

## Failure modes
Expired login, offline devices, unsupported engine, incompatible protocol, TLS errors, consent denial, reconnect storms and partial setup must produce actionable, redacted diagnostics. Never bypass verification for convenience.
