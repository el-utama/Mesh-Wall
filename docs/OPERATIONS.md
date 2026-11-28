# Operations and recovery

## Target operations design (not implemented in full)
Health UI: OS/arch, CPU/RAM/storage/network, service readiness, engine version, TLS expiry, device/session counts, queue depth, recent redacted logs. Distinguish running process from functional readiness.

Service controls: typed start/stop/restart, explicit impact confirmation, bounded timeout and diagnostics. Configuration edits: propose diff, validate, back up, atomic replace, restart only if required, health test and rollback on failure. Never expose a generic root shell in the admin UI.

Backup target: consistent MeshCentral-owned state, version manifest, checksum, restricted storage and eventual encrypted export. There is no separate MeshWall database; current CLI backups include plaintext secrets. Restore to staging first, verify compatible engine/identity/certificates, then switch with rollback. Test restoration routinely.

Upgrade: pinned version matrix; check free space, backup, verify artifacts, stage new release, migrate, readiness test and rollback plan. Prevent simultaneous destructive jobs. Keep previous compatible build. Log maintenance audit metadata, rotate logs and cap retention.

Disaster recovery: retain restricted native MeshCentral recovery access and local console/SSH for trusted administrator; document paths, service state and credentials recovery without exposing secrets. No automatic data purge. Windows and Linux recovery procedures validated separately.

## Implemented offline local maintenance tool (alpha)
For the default Linux install with embedded local database only, stop `meshwall-engine` and confirm no other MeshCentral process uses the installation. Run the tool as the engine service account, from a trusted checkout readable by that account. Create a separate private backup parent (mode 0700, owned by meshwall; not inside /opt/meshwall/engine), then:

```bash
sudo systemctl stop meshwall-engine
sudo systemctl is-active meshwall-engine # must report inactive
sudo -u meshwall node scripts/maintenance.mjs backup /opt/meshwall/engine /path/to/private-backups --engine-stopped
sudo -u meshwall node scripts/maintenance.mjs verify '/path/to/private-backups/meshwall-REPLACE_WITH_PRINTED_NAME'
sudo systemctl start meshwall-engine
```

Restore uses the same stopped-engine prerequisite and `restore <install-root> <backup-dir> --engine-stopped`. It verifies all listed content, stages a copy, and retains the original trees under a printed recovery directory. It rolls back filesystem swaps on a reported failure, not a host power loss. Inspect service readiness and the authorized test agent after restarting. Never run against a live database. The flag is an operator acknowledgment, not a process detector. No automatic deletion or cloud upload. Backup folders contain private keys, user data and secrets in plaintext; keep them on access-controlled/encrypted storage. Checksums detect accidental changes, not malicious replacement of the manifest. No external DB, alternate paths, recordings outside these folders or symlinks supported. Windows ACLs require separate validation. Browser-managed layouts are stored locally and are not in server backups. No production restore or hardware test yet.

### UI-only update and rollback
After stopping the engine and creating a verified full backup, use the latest **reviewed** checkout, readable by the service account. Run `node scripts/maintenance.mjs update-ui <install-root> --engine-stopped` as the engine account. It stages and byte-verifies the known static UI files, replaces only `meshwall.html` and `meshwall/`, retains the previous UI outside the public directory, and leaves engine database and unrelated custom files untouched. If necessary, stop the engine again and use `rollback-ui <install-root> <printed-ui-recovery-dir> --engine-stopped`. Validate login after restart. These are local CLI operations, not automatic engine upgrades. Never update the upstream engine independently of the pinned compatibility version.

### Repair missing UI files (fresh installs only)
If a reviewed release is partially missing UI files, use `doctor.mjs diagnose` first. In an authorized maintenance window, stop the identified service and confirm no other process uses the root. Use the same service account (not root on Linux), private separate backup directory and trusted compatible checkout as for backup. Run `node scripts/maintenance.mjs repair-ui <install-root> <private-backup-parent> --engine-stopped --service <actual-service-name> --confirm-repair`. The shared command checks the default fresh layout, refuses an adoption journal, validates the named stopped service before backup and again before UI swap, creates and verifies a full supported snapshot, and accepts only an incomplete UI whose remaining known files match the reviewed release exactly. It refuses modified, unknown or completely absent UI; no arbitrary replacement or automatic restart. Previous partial UI and full backup are retained. Partial previous UI may not qualify for `rollback-ui`; preserve it and use verified offline restore with operator review if needed. Restart the known service manually, run `doctor.mjs health <root> <service-name>`, then verify login and authorized devices. Windows uses the same command in authorized PowerShell with ACL-restricted storage. Power-loss recovery remains manual. Physical acceptance pending.

## TLS renewal (Linux fresh installation)
From a trusted reviewed checkout readable by the meshwall service account, run `sudo bash installers/linux/renew-tls.sh` during a maintenance window. The script checks the installed certificate expiry, skips renewal above 30 days remaining, confirms the hostname against Tailscale, obtains and validates new certificate material before stopping the service, skips identical certificates, then replaces only webserver TLS files as the unprivileged engine account, retains the previous certificate, starts the service and checks HTTPS and the expected certificate fingerprint without disabling TLS validation. If HTTPS readiness fails after a confirmed swap, it attempts offline rollback. A failed swap requires inspection before restarting; an expired previous certificate cannot be a valid HTTPS fallback. Keep recovery directories private. A power interruption may require manual recovery. No unattended timer yet. The certificate swap is unit-tested with synthetic certificates; actual issuance and service restart on a tailnet are not tested.

## Windows local maintenance
For a fresh Windows installation, use an elevated PowerShell in a reviewed checkout. Run `.\installers\windows\renew-tls.ps1` during an authorized maintenance window. It verifies the known Windows service belongs to the fixed installation root, checks expiry and hostname, validates candidate material before downtime, rotates and verifies the actual TLS peer, and attempts rollback on failed readiness. Recovery files stay in the restricted installation directory. No actual Windows issuance/service test yet.

For backup and restore or UI releases use the same Node CLI as Linux with `$env:ProgramData\MeshWall` as root, after stopping the identified MeshCentral service and confirming no other process uses the files. Use a separately ACL-restricted backup directory (Administrators and SYSTEM only, encrypted storage recommended). Restart and verify login/agent after each operation. The operator stop acknowledgment is not automatic process detection. Windows ACL and physical service restoration remain acceptance gates. See commit-specific CI status for Windows loopback restore.
