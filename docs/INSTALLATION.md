# Installation and platform support — Alpha

Executable lab scripts now exist. Follow [QUICKSTART-ALPHA.md](QUICKSTART-ALPHA.md) for commands, prerequisites and recovery; do not treat this design as a production installer.

| Platform | Implementation | Validation |
| --- | --- | --- |
| HG680P / B860H Armbian | 64-bit userspace, supported Debian/Ubuntu base, systemd | Physical hardware pending |
| Linux ARM64 / x64 | bootstrap.sh, install.sh, localhost setup.mjs | Syntax/unit/loopback only; actual provisioning pending |
| Windows x64 | elevated PowerShell bootstrap.ps1 / setup.ps1 / install.ps1, shared wizard, upstream Windows Service | Windows CI parser/unit/wizard fixture; real service pending |
| Existing Linux/Windows | adopt.mjs, version guard 1.3.2 | Copy/update tests; real adoption pending |
| ARM32 | Unsupported in current installer | Do not bypass architecture guard |

Node >=22.21.1, pinned MeshCentral 1.3.2, Tailscale running with MagicDNS and HTTPS certificates, private network reachability and adequate free disk are required. Linux bootstrap may install dependencies and Node using the official SHA-256 manifest over HTTPS, and Tailscale from the official signed APT repository. Windows optional bootstrap uses exact official WinGet package IDs, with manual fallback. No public ingress or tailnet ACL changes. Tailnet-owner login and HTTPS configuration remain explicit.

Linux uses /opt/meshwall/engine and systemd service meshwall-engine under a dedicated account. Windows uses ProgramData/MeshWall and upstream service defaults; least privilege on Windows is still a gate. Engine HTTPS binds to the Tailscale IPv4 at port 8443 in fresh installers. Local setup port 8787 is loopback-only and temporary. No default password.

Fresh install refuses existing or partial directories/services and checks bounded discovery candidates before engine provisioning; Linux bootstrap also checks named services before installing prerequisites. Discovery is advisory and can miss custom layouts. Do not delete a partial installation blindly. Adoption preserves existing engine configuration; stop engine, back up, check ownership and TLS. Existing installations may have different exposure and consent settings; validate before use.

HTTPS readiness checks only establish serving, not successful enrollment or streaming. Verify login, agent and local consent before expanding use. Actual certificate renewal verification, unattended scheduling, safe partial-install rollback, Windows service privilege hardening and physical end-to-end verification remain pending. See [operations](OPERATIONS.md).
