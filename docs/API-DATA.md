# API and data

## Current implementation

No independent /api/v1 REST backend or SQLite database is shipped. MeshCentral owns identities, devices, groups, events, configuration, credentials and session authorization. The browser uses the same-origin authenticated control.ashx socket, correlated request IDs/tags and pinned upstream browser relay/renderer. `control.mjs` is the transport boundary; account operations use the 1.3.2 upstream adduser/addmeshuser commands and users readback, with engine validation. The direct membership preset is not a calculation of effective rights.

Per-account layout presets and navigation preferences use browser localStorage; they are not server backup data. No password or screen capture is persisted by MeshWall. Local setup is a temporary token-protected loopback service with preflight/status/install operations. Offline maintenance manages engine-owned files with checksummed manifests, not an application API. See [operations](OPERATIONS.md).

## Future design (not implemented)

Versioned /api/v1 REST for inventory, users, groups, layout, setup jobs, health, config proposals and backups; authorized WebSocket events/session transport. Example routes: GET /devices, GET /health, GET/PUT /layouts/:id, POST /sessions, DELETE /sessions/:id, POST /setup/jobs. These are MeshWall contracts, not MeshCentral endpoints.

Use shared TypeScript schemas with runtime validation, consistent error codes, request IDs and pagination. Mutations require permission and CSRF protection where cookie auth is used; rate-limit sensitive actions. Setup jobs idempotent, explicit states, durable rollback metadata. WebSocket verifies identity, origin, scope and limits; no secrets in URL.

SQLite proposed tables: schema_migrations; settings (nonsecret); layouts (owner, name, version); layout_tiles (device/monitor IDs, geometry); jobs (type, state, redacted result); audit_events (actor, action, resource, outcome, time); integration_refs (secure credential references only). Device identity and access remain upstream-owned. Minimize cache, set TTL, timestamps UTC, parameterized queries, short transactions, migrations and retention. Store secret material in OS-protected storage or restricted server files, not frontend/localStorage.

Backups use consistent database snapshots, version manifests, checksums and encrypted secret export only when explicitly requested. API schema and adapter contract tests accompany every change.
