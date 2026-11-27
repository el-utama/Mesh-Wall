# Physical acceptance — release gate

CI is not a substitute for an actual STB and authorized test PCs. Do not publish a stable release until the relevant gates are checked with real evidence. No remote screen captures, private IPs, invitation URLs or credentials should be published.

## Preparation

Record board model (HG680P or B860H, including variant), Armbian base/version, kernel and **userspace** architecture, RAM, free storage, network link speed and Node version. A 64-bit CPU or kernel alone does not prove ARM64 userspace. Use a clean lab install and authorized devices, wired network and a private Tailscale policy. Windows x64 is a separate validation target.

| Gate | Required evidence |
| --- | --- |
| Bootstrap | Successful dependency install and initial setup; no public listener; unsupported userspace rejected |
| TLS / network | Correct hostname, private bind, valid TLS, actual agent connectivity; renewal and rollback verified |
| Authorization | Admin and restricted account login; test view-only, consent accepted/denied, unauthorized devices hidden and access revoked |
| Enrollment | Authorized PC can install an official agent and reconnect after reboot |
| Live display | Actual screen changes render in wall; monitor picker, aspect ratio, fullscreen, input disabled in wall |
| Lifecycle | Stop/filter/tab hide, network loss and restart release sessions; dashboard reconnect does not silently restart screen access |
| Routine operations | Device/group edits, enrollment, account access, desktop, terminal and files through authorized paths |
| Recovery | Verified backup, restore with restart, UI update and rollback; test on disposable lab data first |
| Windows | Fresh install, actual service/TLS, enrollment, privileges and recovery |
| Capacity | 1/10/25/50/75/100 real concurrent sessions, resource/latency measurements, stable sustained operation |

Record pass/fail/not tested, commit SHA, exact hardware/runtime versions and non-sensitive diagnostic evidence. Start with one PC and default Eco quality. Increase concurrency gradually only when resources remain stable. Distinguish enrolled PC count, connected sessions, decoded screens and frame freshness. Check server CPU/RSS, temperature/throttling, network, browser memory/CPU, session failures, and sustained latency on changing desktops. If 100 streams are not stable, report measured maximum rather than lowering the stated test threshold or calling the target met. Full native replacement, safe GUI maintenance and automatic engine updates also remain software gates.

See [testing](TESTING.md), [quickstart](QUICKSTART-ALPHA.md) and [request audit](AUDIT.md). Current physical result: **not tested**.
