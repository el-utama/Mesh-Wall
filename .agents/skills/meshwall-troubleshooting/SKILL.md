---
name: meshwall-troubleshooting
description: Diagnose and resolve MeshWall bugs, regressions, crashes, failed CI, installation failures and runtime incidents. Use when behavior is wrong, a test fails or the cause is unknown.
---

# meshwall-troubleshooting

Read docs/TROUBLESHOOTING.md, docs/TESTING.md and the affected module. Classify severity and avoid destructive operations.
1. Capture the exact symptom, commit, OS/userspace, Node/engine version, and sanitized logs. Check actual failing workflow/job/step, not just its status.
2. Reproduce with the smallest safe fixture; distinguish product defect, assertion defect, upstream dependency failure and environment failure. Compare known-good commits and isolate the failing layer.
3. State a falsifiable hypothesis; inspect relevant source and pinned upstream contracts. Add a failing regression test where reproducible.
4. Fix the root cause with a minimal change. Do not weaken assertions, skip failing checks, retry destructive operations, or use insecure TLS to hide a bug.
5. Run targeted test, then affected platform checks and full regression. Inspect actual results. If CI infrastructure fails, validate the dependency and retry only bounded, non-destructive steps.
6. Record root cause, fix, test evidence, remaining blockers and recovery guidance. Escalate destructive recovery or required access to the authorized operator. Never invent results or report pending as passed.

## Completion and escalation checklist
Critical (unauthorized access, exposed secret, data loss): stop affected operations and preserve evidence; ask operator before risky recovery. High (service outage or install failure): isolate and use supported recovery. Normal (layout, docs, tests): fix and regress. Report symptom, confirmed cause or hypothesis, fix, evidence and remaining risks.

## User-facing diagnosis
Apply P15: translate a confirmed defect into actionable offline help, stage/error code and safe next steps. Maintain installers/support/catalog.mjs and docs/SELF-SUPPORT.md. Help must remain usable without AI or a running MeshCentral; no raw secrets in support reports. Test failure before declaring the issue resolved.
