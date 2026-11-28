# Alpha lab quickstart

Not a production release. Test only on authorized machines and an isolated tailnet. The fresh installer is not yet executed on STB hardware.

## Fresh Linux / Armbian
Prerequisites: supported 64-bit Armbian/Debian with systemd, wired network, system-wide Node >=22.21.1 and npm, Tailscale installed and signed in, MagicDNS and HTTPS certificates enabled, port 8443 free, adequate disk/RAM, curl, openssl and standard Linux utilities. Check Node userspace architecture; a 64-bit kernel alone is insufficient. Do not use deprecated Node or disable TLS. Tailscale HTTPS name appears in certificate transparency logs; review privacy implications. The installer does not change tailnet ACLs.

Clone this repository on the target and review the installer. On a fresh supported 64-bit Debian/Ubuntu-based Armbian system, an optional bootstrap prepares dependencies, installs a compatible Node.js release if needed, installs Tailscale from its official signed APT repository, guides Tailscale login and starts the wizard:

```bash
sudo bash installers/linux/bootstrap.sh
```

It checks the official SHA-256 manifest over HTTPS before extracting Node.js; this is not independent GPG verification. It refuses conflicts and existing MeshWall installs. It does not change tailnet ACLs or enable public ingress. User login and enabling MagicDNS/HTTPS certificates still require the tailnet owner. The script has not been run on STB hardware. If prerequisites are already present, use the temporary browser setup wizard directly:

```bash
sudo node installers/linux/setup.mjs
```

It prints a one-time localhost URL. If the STB is headless, connect over authorized SSH with a local tunnel, for example `ssh -L 8787:127.0.0.1:8787 user@your-stb`, then open the exact localhost URL on the administrator PC. Never publish the port or token. The helper binds to IPv4 loopback only, expires after 15 minutes if unused, accepts one install, enforces origin/token checks, and exits after completion. It calls the same validated installer. Tailscale client login remains a prerequisite.

For terminal-only setup, run:

```bash
sudo bash installers/linux/install.sh
```

It creates a dedicated service account, installs MeshCentral 1.3.2, configures TLS using Tailscale-issued certificate, binds only to the Tailscale IPv4, disables open signup, requires remote access consent, provisions initial admin offline, installs UI files, registers the native systemd service and checks HTTPS readiness. It refuses existing or partial installations. No open public listener is intended; review tailnet grants and OS firewall. Package installation requires internet. Tailscale client login is required. For Linux certificate renewal, use the reviewed local renewal script described in [Operations](OPERATIONS.md); the scheduled timer and actual tailnet renewal remain pending.

Open the exact URL printed by installer. Click Sign in within MeshWall; the same-origin upstream authentication panel keeps MFA and credentials in MeshCentral. If the panel cannot load, open the provided direct link and return to /meshwall.html. Create a group and a time-limited enrollment invitation; install the official agent only on an authorized PC. Wait until online, open MeshWall, start a single tile, approve consent on the PC, and check screen data. Increase concurrent streams gradually after measuring resources.

## Existing MeshCentral (Linux or Windows)

Open the same local setup wizard and select **Review existing MeshCentral**. Pick a detected installation or type the absolute installation root. After preview, enter the registered service name and select **Check service** to compare its registered launch, account and state. Review custom or unsupported services locally. Choose **Check backup path** with an existing private directory and follow the local terminal instructions. A detected installation blocks fresh provisioning in that wizard session. The wizard only reviews the plan. [Linux and Windows service checks and recovery](ADOPTION.md).

For terminal-only review, run `node scripts/doctor.mjs` for bounded discovery or enter the actual paths from the trusted checkout:
```bash
node installers/adopt.mjs preview "/path/to/install-root" "/path/to/private-backups"
```
Stop the **identified existing** engine using its own administrative mechanism. Verify no other process uses the files; create a separate private backup parent outside the installation. On Linux run apply as the existing engine account (not root); on Windows use authorized PowerShell with a restricted backup directory:
```bash
node installers/adopt.mjs apply "/path/to/install-root" "/path/to/private-backups" --engine-stopped --service meshcentral.service
```
The command creates and verifies a full supported offline backup, stages only MeshWall files, refuses collisions and retains an adoption journal. It does not change configuration, accounts, agents or TLS. Use the actual registered service name. Apply checks it before backup and before UI placement. The PowerShell wrapper accepts `-ServiceName` with `-EngineStopped` for apply and rollback. For a custom launcher, see the manual workflow in [Adoption](ADOPTION.md). Restart the known engine, open its existing HTTPS origin plus /meshwall.html and verify original login, groups and authorized devices. If the adoption fails, inspect:
```bash
node installers/adopt.mjs status /path/to/install-root
```
If the engine is stopped and no other maintenance is active, rollback before UI updates/restore:
```bash
node installers/adopt.mjs rollback "/path/to/install-root" --engine-stopped --service meshcentral.service
```
Rollback removes only unchanged, verified transaction-owned files; it does not remove the database. A modified file, interrupted lock or ambiguous state requires manual inspection. Keep journal and backup for review before retrying. Hard links must be supported by the installation filesystem (e.g. ext4/NTFS). See [adoption and recovery](ADOPTION.md).

## Diagnostics and recovery
After a wizard failure, run `node scripts/doctor.mjs history` from the same operator account (Linux: the root account that launched the wizard). Check the recorded stage trail, stage help and recovery note. A last running state may be interrupted; inspect the actual process and partial files rather than repeating installation. See [local self-support](SELF-SUPPORT.md).
```bash
systemctl status meshwall-engine
journalctl -u meshwall-engine -n 80
```
Redact logs before sharing. Never pass --insecure or disable certificate checks. On partial failure inspect /opt/meshwall and service state; do not rerun blindly or delete data. Stop service before consistent backup; preserve config, data, certificates, custom UI and application version. Offline verified restore is available; see [Operations](OPERATIONS.md). Destructive uninstall is not supplied.

## Checks
```bash
npm run check
bash -n installers/linux/install.sh
```
The local checks are not a live acceptance test. See TESTING.md and IMPLEMENTATION.md.

## Fresh Windows x64 (alpha; not yet run on a Windows host)
On Windows x64, clone the repository using Git, open elevated PowerShell and optionally run ` .\installers\windows\bootstrap.ps1 ` to install missing official Node.js LTS and Tailscale packages via WinGet (explicit confirmation), guide login and start the wizard. If WinGet is unavailable or an existing Node installation is incompatible, install or upgrade the official packages manually. Node.js >=22.21.1, MagicDNS and HTTPS certificates are required. If prerequisites already exist, run the shared browser wizard from an elevated PowerShell in a trusted checkout:

```powershell
.\installers\windows\setup.ps1
```

Open the exact one-time localhost URL printed by the script. Terminal-only alternative: `.\installers\windows\install.ps1`. The script refuses an existing MeshCentral service or MeshWall directory, restricts ProgramData/MeshWall to local Administrators and SYSTEM, pins MeshCentral 1.3.2, checks Tailscale certificate/key and installs the upstream Windows Service. The service uses upstream service defaults (typically LocalSystem); least-privilege Windows service configuration is still pending. It checks HTTPS without bypassing certificate validation. Do not use for production until tested on a Windows lab host. Local TLS renewal is available via `.\installers\windows\renew-tls.ps1`; see Operations. Actual Windows installation, issuance and restart are unvalidated. No unattended timer yet. On failure preserve the partial installation for diagnosis; do not rerun blindly. See [official MeshCentral Windows documentation](https://docs.meshcentral.com/install/windows/).
