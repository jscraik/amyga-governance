<!--
file_path: "AGENTS.md"
description: "Agent Operational Instructions — Repository Root Stub (canonical docs live under brainwav/governance/)"
maintainer: "brAInwav Development Team"
last_updated: "2026-01-02"
version: "1.8.0"
status: "authoritative"
license: "Apache-2.0"
audit:
  provenance: "ChatGPT (edited)"
  reviewers: ["@jamiescottcraik"]
  signoff: []
-->

# AGENTS — Governance Pack (authoritative stub)

This file is intentionally small to avoid instruction truncation.
Canonical governance lives under `brainwav/governance/` and is **binding**.

## Read first (canonical)

- `brainwav/governance/10-flow/governance-quickstart.md`
- `brainwav/governance/10-flow/agentic-coding-workflow.md`
- `brainwav/governance/00-core/AGENT_CHARTER.md`
- `brainwav/governance/90-infra/governance-index.json`
- `brainwav/governance/docs/gold-standard-checklist.md`

## Bootstrap (required per session)

```bash
pnpm exec cortex-governance-bootstrap
```

This writes `.agentic-governance/agent-context.json` with governance index pointers and hashes.

## Spec-driven start (when SDD pack enabled)

```bash
pnpm exec brainwav-governance spec init --slug 001-example
```

Creates `specs/001-example/{spec.md,plan.md,tasks.md}` and should precede task folder work.

Example task folder:

`tasks/001-example/…`

```bash
pnpm exec brainwav-governance spec validate --spec-root specs --report .agentic-governance/reports/spec-validate.json
```

Validates spec-kit compatible layout and lifecycle ordering.

```bash
pnpm exec brainwav-governance spec clarify --spec-root specs
pnpm exec brainwav-governance spec analyze --spec-root specs
pnpm exec brainwav-governance spec checklist --spec-root specs
```

Clarify/analyze/checklist catch missing requirements and cross-artifact drift.

## Validate (required before shipping)

```bash
pnpm exec brainwav-governance validate --strict --config .agentic-governance/config.ci.ubuntu.json --report .agentic-governance/reports/
pnpm governance:validate-agents
pnpm governance:sync-hashes:check
pnpm docs:validate
```

## Package access (private)

This package is private to the `@brainwav` org. Ensure npm auth is configured in CI
(Trusted Publishing or `NODE_AUTH_TOKEN`) before running installs in consumer repos.

## Task evidence contract (required for implementation work)

Use `tasks/<slug>/` layout and Evidence Triplet requirements in:
`brainwav/governance/10-flow/agentic-coding-workflow.md`.

## Local configuration

- `.agentic-governance/config.json` selects `mode`, `profile`, `packs`, and overlays.
- Pointer mode resolves canonical docs from `node_modules/@brainwav/brainwav-agentic-governance`.

## Non-negotiables (summary)

- No TODO/FIXME/HACK in production paths.
- No fake telemetry, placeholder adapters, or random/non-deterministic outputs.
- Use ripgrep (`rg`) for repo search.
- All work must follow CODESTYLE.md

If you need more detail, read the canonical docs above.
Do not expand this file without a strong reason.
