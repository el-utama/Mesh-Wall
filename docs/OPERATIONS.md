# Operations and recovery

Health UI: OS/arch, CPU/RAM/storage/network, service readiness, engine version, TLS expiry, device/session counts, queue depth, recent redacted logs. Distinguish running process from functional readiness.

Service controls: typed start/stop/restart, explicit impact confirmation, bounded timeout and diagnostics. Configuration edits: propose diff, validate, back up, atomic replace, restart only if required, health test and rollback on failure. Never expose a generic root shell in the admin UI.

Backup: consistent MeshWall DB and required MeshCentral state via supported mechanisms; version manifest, checksum, permissions, encrypted secrets only if explicitly included. Restore to staging first, verify compatible engine/identity/certificates, then switch with rollback. Test restoration routinely.

Upgrade: pinned version matrix; check free space, backup, verify artifacts, stage new release, migrate, readiness test and rollback plan. Prevent simultaneous destructive jobs. Keep previous compatible build. Log maintenance audit metadata, rotate logs and cap retention.

Disaster recovery: retain restricted native MeshCentral recovery access and local console/SSH for trusted administrator; document paths, service state and credentials recovery without exposing secrets. No automatic data purge. Windows and Linux recovery procedures validated separately.
