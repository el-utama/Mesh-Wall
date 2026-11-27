# Existing MeshCentral adoption and recovery

Supported candidate: MeshCentral 1.3.2 installed in node_modules/meshcentral with local meshcentral-data/config.json, no unsupported external database or alternate storage. Run the reviewed scripts from a local checkout. Detection is read-only and advisory; service/process search is bounded and can miss custom services, quoted/relative command paths, containers, unreadable processes, global npm or alternative data paths. Manual preview is the fallback. Do not adopt a root just because its version matches.

## Steps (both OS)
1. Discover using node scripts/doctor.mjs; confirm root and actual service. Preview using node installers/adopt.mjs preview <root>. Confirm only new UI paths.
2. Stop the identified engine in an authorized maintenance window; verify no other process uses the root. Use service-account permissions on Linux, authorized operator and ACL-restricted separate backup parent on Windows.
3. Apply using node installers/adopt.mjs apply <root> <private-backup-parent> --engine-stopped. The flag is an acknowledgment, not a process detector. Backup is generated and verified before mutation. The shared transaction uses an exclusive maintenance lock, stages and hashes 14 known static files, creates exclusive hard links and retains the stage and manifest in .meshwall-adoption. No database mutation.
4. Inspect status using node installers/adopt.mjs status <root>. Restart original service, check trusted HTTPS and original login, groups and authorized devices. No automatic service start or actual agent test.
5. For failure before any UI update or full restore, stop service and run node installers/adopt.mjs rollback <root> --engine-stopped. Only verified, unchanged transaction-owned files may be removed; original data and unrelated assets remain. In-process copy failure also attempts this cleanup. A completed rollback retains journal; repeated apply is refused until reviewed manual archival.

## Recovery limits
- If a file was edited/replaced, stage is missing, storage lacks hard links, backup verification fails, an unexpected directory exists, or maintenance lock remains after interruption, stop and preserve evidence. Do not delete a lock blindly, overwrite paths, or remove server data.
- Power-loss recovery is conservative: journal status may be incomplete; no automatic lock breaking or crash-safe filesystem guarantee. If the service will not restart, use verified offline backup recovery according to [operations](OPERATIONS.md); do not restore a stale database casually, as post-backup changes would be lost.
- Backups contain secrets; keep private, access-controlled/encrypted storage. Journal stays in the protected installation root. The stage shares file identity with initial active UI, so it is not an independent backup; the separate verified snapshot is.
- This command is CLI only. Guided adoption in the wizard, verified service stop/start and physical rollback tests remain release gates. See [self-support](SELF-SUPPORT.md) and [quickstart](QUICKSTART-ALPHA.md).
