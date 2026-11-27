# MeshWall — shared project memory

**Purpose:** resume development with any AI model or human without a manually written handover. Read [AGENTS.md](AGENTS.md) first; use this file as context, not as a substitute for inspecting source. This is public repository documentation; never add credentials, device details, personal information, raw logs or private AI conversation history.

## Current state and verified baseline

- Repository: [el-utama/Mesh-Wall](https://github.com/el-utama/Mesh-Wall), branch main, public; independent project, license undecided. Version 0.1.0-alpha.1; **isolated lab Alpha, not production-ready**.
- Last fully verified code baseline: [654fd616a6dab03d183f20c2a7afd996c7e2121f](https://github.com/el-utama/Mesh-Wall/commit/654fd616a6dab03d183f20c2a7afd996c7e2121f), 27 November 2026. Recheck HEAD and CI before further work; this is not a claim that every later commit is green.
- Four CI workflows passed at that baseline: [static/unit: 41 passed, 0 failed, 0 skipped](https://github.com/el-utama/Mesh-Wall/actions/runs/45952154871), [Linux real engine loopback](https://github.com/el-utama/Mesh-Wall/actions/runs/45952154844), [browser visual](https://github.com/el-utama/Mesh-Wall/actions/runs/45952154836), [Windows unit, PowerShell parser, wizard fixture and real engine loopback](https://github.com/el-utama/Mesh-Wall/actions/runs/45952154879).
- Evidence is limited: loopback uses an actual pinned MeshCentral with no enrolled physical agent; renderer test uses synthetic generated JPEG and fake transport. Windows runner does not install the privileged service. Physical STBs, Windows service provisioning, real Tailscale issuance, consent and 100 simultaneous live streams remain untested. Do not describe fixture screenshots as actual live screens.
- This memory introduction is documentation-only; its own CI is not yet verified at authoring. See [current Actions](https://github.com/el-utama/Mesh-Wall/actions).

## Durable user requirements

The owner wants the agent to audit, implement, verify against every requirement, correct gaps and recheck without repeated status-only turns. Keep documentation and skills updated. Contact the owner only when an actual decision/authorization/access is needed. Prefer direct GitHub/API or local repository operations over browser use for routine coding; use real browser tests when visual QA needs them. Avoid unnecessary token usage and unrelated hosting/deployment changes. No Vercel or separate cloud service is required.

- MeshWall should replace everyday MeshCentral UI from initial configuration through operations; MeshCentral and MeshAgent remain the engine and agents. Native UI is a restricted compatibility/recovery fallback until replacement is verified.
- Armbian on HG680P/B860H is the resource optimization priority. Windows x64 must have equivalent functionality, not a reduced second-class version. Validate actual userspace; ARM32 is unsupported until verified. Both fresh and existing MeshCentral servers must be supported without losing accounts, device groups, enrollment, data, configuration or certificates.
- Live wall: up to 100 enrolled PCs and target 100 simultaneous real monitor streams, customizable grid, individual tile sizing, drag/order, keyboard alternatives, presets, monitor selection, focus/fullscreen, adaptive quality and safe reconnect. Default view-only with explicit authorization for control. No covert monitoring or bypass of engine consent.
- Full administration: devices/groups, users/effective rights, enrollment, desktop/terminal/files/allowed power actions, events/logs/notifications, health, setup, private Tailscale, configuration/service management, backup/restore, updates and rollback.
- Every step must help end users even on hosts with no AI: pre-Node bootstrap, discovery, fresh setup, adoption, login, enrollment, streaming, maintenance, failures and recovery. Offline rule-based help, meaningful diagnostics, preview, authorization, backup where needed, verified outcome, safe rollback and recoverable history. No mandatory LLM/API/cloud dependency; actual dependency download, Tailscale auth and certificates still require network access.
- Professional compact UI/UX, modular architecture, specialist skills and current bilingual documentation are requirements, not optional polish. Do not mark ready until the actual evidence supports P01–P15.

## Architectural decisions (stable unless explicitly superseded)

- [ADR 0002](docs/adr/0002-same-origin-ui.md) supersedes initial separate-backend proposal ADR 0001. Plain JavaScript ES modules and static CSS/HTML served same-origin via MeshCentral custom public directory. Pinned engine 1.3.2; Node >=22.21.1. No second persistent backend, React/Fastify/SQLite requirement, mandatory Docker, server transcoding or screen recording.
- Upstream is authority for authentication, MFA, permissions, consent, cookies and relay. UI must not use a shared admin credential or substitute fake telemetry. Per-account layout preferences are browser local storage, not server backup data.
- Fresh Linux: /opt/meshwall/engine, dedicated meshwall service account, meshwall-engine systemd. Fresh Windows: ProgramData/MeshWall, upstream Windows Service; least privilege remains a release gate. Fresh HTTPS binds Tailscale IPv4 at 8443; temporary setup binds IPv4 loopback 8787 with one-time token, strict origin and limited lifetime. Existing adoption retains its existing URL/config; do not force these fresh defaults on adopted servers.
- Offline mutation requires known stopped engine, restricted ownership/ACL, verified separate backup and bounded typed operations. Existing adoption supports only pinned npm layout/local data. No arbitrary privileged shell exposed to web; a future maintenance helper needs reviewed trust boundaries and ADR.
- Engine reconnect only for previously authenticated transient control-channel loss (1/2/4/8/16 sec); no silent desktop reconnect. A relay connected is not a decoded live image. Default active limit 4, configurable up to 100; 100 synthetic tiles are not 100 real streams. Static desktop can legitimately have no new draw.
- Do not change repository visibility/license, upgrade engine independently, delete existing installations, clear locks or bypass TLS/consent without appropriate authority. License decision pending; not a blocker for local development.

## Where to work

| Area | Source and canonical reference |
| --- | --- |
| Browser composition and shell | apps/web/public/meshwall.html, app.mjs, ui.mjs, style.css; [architecture](ARCHITECTURE.md) |
| Upstream session and renderer | control.mjs, desktop.mjs, panels.mjs; [integration](docs/INTEGRATION.md), [API/data](docs/API-DATA.md) |
| Wall/layout/scheduling | model.mjs, wall.mjs, tile-view.mjs; [wall](docs/MESHWALL.md) |
| Devices/groups/accounts | management.mjs, admin.mjs, accounts.mjs, account-view.mjs |
| Fresh setup | installers/linux/, installers/windows/, installers/setup/; [quickstart](docs/QUICKSTART-ALPHA.md) |
| Local support/discovery | installers/support/, scripts/doctor.mjs; [self-support](docs/SELF-SUPPORT.md) |
| Adoption | installers/adopt.mjs, installers/adoption.mjs, Windows wrapper; [adoption](docs/ADOPTION.md) |
| Local maintenance | scripts/maintenance.mjs, scripts/maintenance/, scripts/tls.mjs and OS renewal adapters; [operations](docs/OPERATIONS.md) |
| Quality gates | tests/, tests/integration/, .github/workflows/; [testing](docs/TESTING.md), [hardware acceptance](docs/HARDWARE-ACCEPTANCE.md) |
| Skills | [.agents/skills registry](.agents/skills/README.md) (9 specialist skills; read relevant SKILL.md even without skill tool) |

Browser module paths in the first four rows are under apps/web/public/meshwall/. Adding a new shipped UI file requires checking fresh copy paths, adoption allowlist and UI-release allowlist. The shared setup server and assets live in installers/setup/; do not reintroduce duplicated OS-specific assets.

## Implemented vs open work (P01–P15)

The authoritative requirements are [PRODUCT.md](docs/PRODUCT.md) and detailed status is [AUDIT.md](docs/AUDIT.md). The following is a resumable snapshot, not a replacement for those documents.

| ID | Implemented or tested scope | Outstanding acceptance |
| --- | --- | --- |
| P01 | Both bootstrap/CLI, shared wizard, advisory fresh-install guard | Actual clean provisioning, verified partial-install recovery and enrollment |
| P02 | Bounded service/process/common path discovery; CLI preview, backup, staged exclusive hard-link copy, journal, rollback; loopback adoption tested | Guided browser adoption, manual path selection, confirmed service identity/stop/start/HTTPS/login, crash recovery and actual older-server host tests |
| P03 | Authorized inventory, filters and name ordering; synthetic/loopback | Last-seen, hardware metadata, sorting and actual enrolled devices |
| P04 | Grid/resizing/order/presets/monitor/focus/fullscreen, quality presets, generated-frame decoder test | Real monitor/stream tests, persisted monitor preference, automatic adaptive resources, safe consent-aware reconnect |
| P05 | Official same-origin desktop, terminal, files panels; view-only wall | Native authorized controls and allowed power operations, real denial/revocation |
| P06 | Group invitation creation/rename tested in loopback | Actual agent enrollment, revoke invite and confirmed removal |
| P07 | Group/device edits, standard accounts/direct viewer preset grant/revoke, recent events and diagnostics | Effective/inherited permissions, full logs/notifications and native replacement |
| P08 | Offline backup/verify/restore, UI update/rollback, local TLS rotate/rollback on both OS | Typed GUI maintenance/service/config, unattended TLS and engine update/rollback, real ACL/service recovery |
| P09 | Tailscale auth guidance, private TLS config and certificate tests | Real network, certificate issuance and renewal, network management UI |
| P10 | Modular static modules, shared OS support, ADR | Automated dependency/boundary checks |
| P11 | Design system, fixture visual/keyboard/contrast, five sizes, 100 synthetic tiles | Full accessibility and real display testing |
| P12 | Linux and Windows bootstrap/wizard/TLS source, both loopback CI green at baseline | Physical parity, least-privilege Windows service |
| P13 | Nine specialist skills, documentation audit, local-link/registry validation | Maintain context and docs, no universal auto-loading guarantee |
| P14 | Configurable 1–100 active sessions, synthetic tiles and decoder fixture | Real 1/10/25/50/75/100 benchmarks and soak on both targets |
| P15 | Stage catalog (15 stages), wizard help and minimal report, local doctor/history, contextual help in seven dashboard pages, pre-Node terminal hints | Specific root-cause checks, guided recovery for all stages, full transaction/restart history, offline bilingual help, allowlisted repairs, bounded watchdog, physical fault injection |

## Resume queue (priority order, not scheduled promises)

1. Verify current HEAD/CI and inspect for regressions. Latest known fix separated Windows fresh provisioning from changed adoption CLI; the 41-test suite includes a contract assertion. Real Windows fresh installer not executed by CI. Review stale documentation commands and any new integration callers.
2. P02/P15: finish guided adopt flow. Discovery is read-only/bounded and may miss custom/global npm/container/relative or quoted paths; never claim exhaustive detection. Add manual root validation and safe preview in wizard, service identity confirmation, authorization and supported backup selection. Keep privilege boundary narrow; test denied/conflict/interruption/restart/rollback before enabling mutations.
3. P01/P15: durable per-operation recovery and diagnostics before/after every setup step. Wizard history currently records allowlisted stage/status in operator profile; it is not crash-safe or proof a job is active. CLI/bootstrap do not have full journal coverage. No blind resume or lock break. Add concrete failure rules, offline Indonesian help and bounded service recovery only after safe state is established.
4. P08/P07/P05/P06/P09: typed maintenance and verified service/config/TLS/update operations, full native management including actual effective rights and negative tests; preserve recovery access.
5. P03/P04/P11: improve inventory and wall behavior, resource-aware quality, monitor presets and accessibility. Use UI/UX skill and inspect actual browser screenshots; do not compromise permissions/performance.
6. P12/P14: physical lab acceptance, real authorization/consent, service/TLS, backup/restore and staged 100-stream benchmark. Record hardware, userspace, OS/runtime, resource/thermal/network/frame metrics. If inaccessible, explicitly mark not tested rather than silently lowering acceptance criteria.

## Known risks and recovery notes

- Adoption is conservative and local: stage shares hard-link identity with initial active UI; modified files or replaced identity refuse rollback. Separate verified snapshot is the backup. Interrupted lock requires authorized inspection. No automatic crash recovery or browser service control; after UI update/full restore do not reuse original adoption rollback blindly.
- Existing installations with external databases, alternate storage, symlinks or unsupported versions must not be force-adopted. Backup includes plaintext secrets; protect with ACL/encrypted storage. Stop flag is an acknowledgment, not process detection.
- Fresh installer might leave a partial root/service account; refuse overwrite. Windows privileged service actual ACL/identity and Linux ARM userspace/bootstrap/Tailscale have not been physically validated. Physical operations require access and authorization.
- Historical CI failures: Windows canonical path comparison, skill frontmatter CRLF and Linux APT mirror 403; fixed via canonical relative comparison, CRLF normalization, conditional browser dependency installation. Do not remove checks to conceal failures.
- No automatic watchdog or full privileged maintenance GUI yet. Do not expose setup or diagnostic secrets; use restricted local help instead.

## Verification commands and development handoff

From a reviewed checkout with compatible Node:
```bash
npm run check
npm run integration
```
Integration requires pinned Playwright and Chromium as defined by workflows; use workflow versions, not arbitrary latest dependencies. For UI changes consult [visual QA](.agents/skills/meshwall-ui-ux/references/visual-qa.md); for actual host commands use [quickstart](docs/QUICKSTART-ALPHA.md) and [operations](docs/OPERATIONS.md). GitHub Actions files: check.yml, integration.yml, visual.yml, windows.yml. CI does not replace physical acceptance.

At end of each meaningful session update this file with actual baseline/evidence (or pending), decisions, status, blockers and ordered queue. Maintain canonical docs and tests; keep this file compact and remove obsolete status, not unresolved requirements. The next agent must inspect HEAD and CI rather than blindly trusting stale memory. See [AGENTS.md](AGENTS.md).

## Owner decisions / external blockers

No new product decision is required for ordinary reversible implementation. License and repository visibility changes are owner decisions. Physical HG680P/B860H, authorized Windows lab host, test PCs and a private tailnet must be supplied/authorized to complete physical acceptance; never request secrets in chat or commit them. Full production-ready status cannot be claimed yet.
