# Contributing

Read AGENTS.md, ARCHITECTURE.md, SECURITY.md and product requirements. Open a focused issue describing behavior and acceptance; discuss significant changes through an ADR. Keep PRs small and scoped; update docs and changelog.

Use typed interfaces, runtime validation, dependency injection, clear naming, feature-local tests and minimal dependencies. Do not import another module's internal files. Include permission/error-path tests; no real credentials or private screen content in fixtures. Use synthetic data or authorized lab PCs.

Before PR run available lint/typecheck/test/build scripts and report exact results, OS, architecture and versions. If scripts do not exist, say so. Include migration and rollback implications, screenshots only if non-sensitive, known limitations and STB impact. Do not merge untested claims or unrelated refactors. Licensing decision pending; discuss substantial external contributions before incorporating them.

For UI changes, use the repository-local [meshwall-ui-ux skill](.agents/skills/meshwall-ui-ux/SKILL.md), inspect visual evidence and complete the UI section of the PR template. If browser validation cannot be performed, report it as pending.
