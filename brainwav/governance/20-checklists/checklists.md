<!-- governance/20-checklists/checklists.md -->

# Agentic Governance Checklists

> Canonical, enforceable checklists for local work, agent runs, PR authors, reviewers, and CI.  
> This file is normative; all other checklist fragments must alias or embed these sections.

---

## Table of Contents

- [0. Document Metadata](#0-document-metadata)
- [1. How to Use This File](#1-how-to-use-this-file)
- [2. Local Dev & Agent Run Checklist](#2-local-dev--agent-run-checklist)
- [3. PR Author Checklist](#3-pr-author-checklist)
- [4. Code Review Checklist (Human + AI)](#4-code-review-checklist-human--ai)
- [5. CI Job Checklist (Pipeline Mapping)](#5-ci-job-checklist-pipeline-mapping)
- [6. Gate-Specific Checklists (ArcTDD G0–G10)](#6-gate-specific-checklists-arctdd-g0g10)
- [7. Cortex-Aegis Checklists](#7-cortex-aegis-checklists)
- [8. Accessibility & Inclusive UX Checklist (Global)](#8-accessibility--inclusive-ux-checklist-global)
- [8.1 Project-Specific Checklist Items](#81-project-specific-checklist-items)
- [9. Change Management for This File](#9-change-management-for-this-file)

---

## 0. Document Metadata

- **Doc ID**: `checklists`
- **Version**: `2025.12.0`
- **Status**: `active`
- **Owner**: `Governance & Reliability (GovOps)`
- **Last Updated**: `2025-12-04`

---

## 1. How to Use This File

- **Humans** use this file before committing, opening PRs, or approving reviews. Reference section numbers in PR templates and review notes.
- **Agents** load this file at session start, select the relevant flow (Feature/Research/Fix/Refactor/Review), and follow the gate checklist for the current ArcTDD stage.
- **CI** jobs reference section numbers via `CHECKLIST_SECTION` annotations (e.g. `CI:G5`), and upload artefacts named after these sections.

> Related governance: `10-flow/governance-quickstart.md`, `10-flow/agentic-coding-workflow.md`, `10-flow/assurance-system.md` (Time Freshness Policy), `00-core/constitution.md`, `00-core/AGENT_CHARTER.md`.

---

## 2. Local Dev & Agent Run Checklist

> Run before you commit or ask an agent to change files.

### 2.1 General Local Sanity

- [ ] Dependencies install cleanly: `pnpm install` (or `pnpm install --frozen-lockfile`).
- [ ] Lint passes for affected projects: `pnpm nx affected -t lint` (fallback `pnpm lint`).
- [ ] Typecheck passes: `pnpm nx affected -t typecheck` (fallback `pnpm typecheck`).
- [ ] Build/dev target succeeds for touched surface: `pnpm nx affected -t build` or the package-specific `pnpm --filter <pkg> build`.

### 2.2 Agent Session Startup

- [ ] Agent read `10-flow/governance-quickstart.md` and `10-flow/agentic-coding-workflow.md` this session.
- [ ] Task type + flow selected; task folder located; current gate (G0–G10) identified in `run-manifest.json`.
- [ ] Agent configured for:
  - [ ] Patch-first diffs (no whole-file rewrites).
  - [ ] Structured outputs / JSON schemas where required.
  - [ ] JEDI rules (named exports, ≤40-line functions, no TODO/FIXME/HACK, cancellation support for HTTP/tool calls).

### 2.3 Local Quality Checks (Developer)

- [ ] Every new/changed code path has at least one automated test.
- [ ] Breaking contracts (API/event/schema) documented in `context/requirements.md` and target docs/ADR.
- [ ] Feature flags/config defaults are safe/off by default and described in `ops/rollout-plan.md`.
- [ ] Secrets pulled via `op` (1Password CLI); no secrets committed or persisted.

---

## 3. PR Author Checklist

> Complete before opening or updating a PR. Attach evidence links where possible.

### 3.1 Metadata & Scope

- [ ] PR description links to `tasks/<task-slug>/` (or `Changelog/<slug>/`).
- [ ] PR states task type + flow and highest gate completed (e.g. "Feature flow through G6").
- [ ] `run-manifest.json` committed/updated with tier, gates, Evidence Triplet pointers, and `reuseEvidence` entries.

### 3.2 Evidence Triplet

- [ ] **Tests**: cite failing test path/log pre-change and passing evidence post-change (`evidence/tests.md`, `evidence/test-results/*`).
- [ ] **Plan**: `plan/PLAN.md` (≤7 steps) matches implemented work; include link/anchor.
- [ ] **Review**: Reviewer neuron scheduled; human reviewer requested; `evidence/review.json` & `review-notes.md` placeholders present.

### 3.3 Artefact Presence by Flow

#### Feature

- [ ] `meta/task.json`, `context/requirements.md` (North-Star), `context/research.md`, `plan/PLAN.md`, `plan/tdd-plan.md`, `work/implementation-log.md`.
- [ ] `evidence/aegis-report.json` uploaded (Cortex-Aegis G2/G5 verdicts) + `logs/vibe-check/*.json`.
- [ ] `implementation-plan.md#reuse-ledger` updated; `run-manifest.json.reuseEvidence.*` filled.

#### Research / Spike

- [ ] `meta/task.json` type=Research; `context/research.md` with queries + citations; license checks logged in `research/connectors-health.log`.
- [ ] Recommendation recorded in `plan/PLAN.md` and `SUMMARY.md`; code changes flagged as experimental if any.

#### Fix

- [ ] Reproducer documented in `context/requirements.md` + failing regression test attached.
- [ ] `ops/postmortem.md` for SEV≤2+ incidents; roll-forward/back strategy in `ops/rollout-plan.md`/`rollback-plan.md`.
- [ ] `evidence/aegis-report.json` (risk ≥ medium) and connectors health log updated.

#### Refactor

- [ ] Baseline invariants + perf metrics captured in `context/research.md`.
- [ ] `plan/PLAN.md` clarifies boundaries + success metrics (no behaviour change).
- [ ] `evidence/tests.md` shows before/after parity (tests, perf, mutation).

#### Review-only

- [ ] `meta/task.json` type=Review; `evidence/review.json` + `review-notes.md` populated; checklist pasted as PR comment.

### 3.4 Documentation & Ops

- [ ] READMEs/API docs/runbooks updated (cite files/links).
- [ ] `ops/rollout-plan.md` + `ops/rollback-plan.md` committed when rollout/flags apply.
- [ ] Changelog entry created (`pnpm changelog:new --slug <slug> --tier <type>` or successor tooling) and referenced in PR.

### 3.5 Agent Metadata & Runtime Governance

- [ ] AgentFacts record exists for every deployed agent touching this PR (`registry/agents/<agent_id>.json` plus signature evidence).
- [ ] Model cards updated with AgentFacts, trust score, and runtime hooks when models/agents change.
- [ ] Runtime governance artefacts attached when relevant: Trust Factor delta, sentinel alerts, ESRH metrics, and sandbox drill logs.
- [ ] New runtime policies include bundle hash + AURA gamma impact noted in `run-manifest.json`.

---

## 4. Code Review Checklist (Human + AI)

> Applies at G6; AI reviewer consumes this list, human reviewer references the same items.

### 4.1 Governance & Scope

- [ ] Scope appropriate; no unrelated changes.
- [ ] Constitution + AGENT_CHARTER requirements satisfied (branding, secrets, reality filter, no fake telemetry).
- [ ] Task folder + `run-manifest.json` present and current.
- [ ] Reuse-first artefacts (analysis/reuse-evaluation.md + PLAN reuse ledger) reviewed; helper diffs cite evidence.

### 4.2 Correctness & Tests

- [ ] Tests cover new behaviour, edge cases, and failure modes; regression tests prove fixes.
- [ ] Evidence Triplet verified (failing→passing tests, plan anchor, reviewer proof).
- [ ] Coverage ≥90% global / 95% changed lines; mutation ≥90% where enabled.

### 4.3 Accessibility & UX

- [ ] UI/CLI changes meet WCAG 2.2 AA (axe/jest-axe evidence) and support keyboard-only + screen readers.
- [ ] No color-only signalling; focus order + labels verified; mention "no UI impact" if not applicable.

### 4.4 Security & Privacy

- [ ] No secrets or keys committed; 1Password CLI usage documented.
- [ ] New inputs validated; outputs encoded; threat model touched if risk tags include security/privacy.
- [ ] Semgrep, gitleaks, OSV, `pnpm security:scan`, SBOM (CycloneDX 1.7), and SLSA v1.1 attestations referenced.

### 4.5 Performance & Reliability

- [ ] Hot path changes reviewed for allocations + complexity; long-running operations cancellable.
- [ ] Observability: logs/metrics/traces include `brand:"brAInwav"`, `trace_id`, `traceparent`.
- [ ] Rollback plan realistic; feature flags guard risky features.

### 4.6 AI / MCP Specific

- [ ] Live model usage only; `logs/models/*` show health/smoke runs with IDs + latency.
- [ ] Prompt/schema changes versioned + tested; MCP connectors documented + healthy.
- [ ] Reviewer notes include disposition for each AI finding (Accept/Reject/Follow-up) in `evidence/review-notes.md`.
- [ ] AgentFacts metadata + trust evidence verified (signature valid, trust score ≥ thresholds, runtime governance logs referenced).
- [ ] Sentinel/coordinator alerts reviewed; ESRH ≥0.4 escalations acknowledged.

---

## 5. CI Job Checklist (Pipeline Mapping)

| Section | Responsible Job (default) | Required Evidence |
|---------|---------------------------|-------------------|
| `CI:lint-type` | `pnpm nx run-many -t lint,typecheck` or package CI task | Lint/type logs attached; fails on warning-as-error. |
| `CI:test` | `pnpm nx affected -t test --coverage` (or package test cmd) | `coverage-results.json`, HTML diff; ≥90% global / 95% changed lines. |
| `CI:mutation` | `pnpm exec tsx scripts/ci/mutation.sh` | `mutation-results.json`, `reports/mutation/`. Threshold ≥90%. |
| `CI:a11y` | `pnpm test:a11y` / Playwright axe run | axe/jest-axe reports; fails on critical issues. |
| `CI:security` | `pnpm security:scan` + Semgrep/gitleaks/OSV | Scanner SARIF/JSON; SBOM (`sbom/*.cdx.json`), `pnpm sbom:generate`, `pnpm attest:sign` bundles. |
| `CI:structure` | `pnpm structure:validate` + governance hash check | `structure-guard.json` output, `governance-index.json` hash, `export-freeze.snapshot.json` digest update per `governance-hash-update.md`. |
| `CI:charter` | `charter-enforce` workflow | `quality-report.json`, narrated diff, trace-context log, evidence of `run-manifest.json.reuseEvidence` pointers. |

CI jobs must fail closed; waivers recorded in `governance/waivers/` with expiry ≤30 days and linked in PR/quality report.

---

## 6. Gate-Specific Checklists (ArcTDD G0–G10)

> Use alongside `10-flow/agentic-coding-workflow.md`. Each gate must satisfy its checklist before advancing.

### G0 – Initialize

- [ ] Task folder created; `meta/task.json` + `meta/tags.json` populated (type, tier, owners, risk tags, feature flags).
- [ ] Flow selected and logged in `run-manifest.json`.
- [ ] Time freshness anchor noted per [cortex-aegis.md](../docs/cortex-aegis.md).

### G1 – Discover / Research

- [ ] Repo/project scan + Local Memory `/recall` executed; findings logged in `context/research.md`.
- [ ] `/gather` run to structure discovery questions; responses captured in `context/requirements.md`.
- [ ] Academic connectors (Wikidata 3029, arXiv 3041, Semantic Scholar, OpenAlex, Context7) health-checked; log under `research/connectors-health.log`.
- [ ] RAIDs/assumptions documented; North-Star acceptance test path recorded.

### G2 – Plan / Design

- [ ] `/reframe` run to confirm understanding before Aegis vibe check; confirmation logged in `work/implementation-log.md`.
- [ ] `plan/PLAN.md`, `plan/tdd-plan.md`, `plan/risk-register.md` updated (≤7 steps per arc).
- [ ] Cortex-Aegis executed when required (see §7); `evidence/aegis-report.json` stored.
- [ ] Feature flags + quality gates defined; reuse ledger entries planned.

### G3 – Scaffold

- [ ] Failing milestone tests implemented and logged (`run-manifest.json.reuseEvidence.failingTest`).
- [ ] Feature flags default-off via OpenFeature; contract snapshots stored.
- [ ] No placeholder adapters or TODO/FIXME/HACK in production paths.

### G4 – Implement

- [ ] Implementation aligned with PLAN.md; deviations noted in `work/implementation-log.md`.
- [ ] Tests updated alongside code; micro TDD loops observed.
- [ ] Observability + cancellation wired; models logged live-only.

### G5 – Verify

- [ ] Test suites + `pnpm test:coverage`/`pnpm exec tsx scripts/ci/summarize-coverage.mjs` run; coverage/mutation thresholds met.
- [ ] Security (`pnpm security:scan`, Semgrep, gitleaks, OSV), a11y (`pnpm test:a11y`), performance (bench/perf reports) executed.
- [ ] SBOM (CycloneDX 1.7) + SLSA v1.1 provenance + Cosign v3 bundle produced; Evidence Triplet complete; `run-manifest.json.reuseEvidence.passingTest` populated.

### G6 – Review

- [ ] AI reviewer (Reviewer Neuron) run; `evidence/review.json` captured.
- [ ] Human reviewer completes Section 4 checklist; dispositions logged in `evidence/review-notes.md`.
- [ ] Narrated diff acknowledged; waivers (if any) approved and stored.

### G7 – Document

- [ ] READMEs/API docs/runbooks updated; changelog entry linked.
- [ ] `ops/rollout-plan.md` + `rollback-plan.md` finalized; `work/implementation-log.md` references docs.

### G8 – Ship

- [ ] Deployment executed per rollout plan; feature flags managed; Cosign bundles referenced.
- [ ] Validation logs stored under `validation/` or `ops/`.

### G9 – Monitor

- [ ] Logs/metrics/traces monitored; alert tuning documented; `logs/models/*` updated if models changed.
- [ ] Reuse telemetry + tier escalation metrics pushed to `ops/observability/*` dashboards.
- [ ] For SEV ≥ 2 incidents, run `/incident-review` to structure postmortem; store in `ops/postmortem.md`.

### G10 – Archive

- [ ] Run `/memorize` to persist session context to Local Memory; verify entry IDs in `json/memory-ids.json`.
- [ ] `SUMMARY.md`, `lessons-learned.md`, `archive.json` completed; Local Memory entries recorded (`json/memory-ids.json`).
- [ ] Review checklist snapshot mirrored to `governance/audit/reviews/<PR>-<sha>.md`.

---

## 7. Cortex-Aegis Checklists

> Assurance system hooking plan/evidence validation.
>
> **Installation:** `npm i -g @brainwav/cortex-aegis-mcp@latest`  
> **Documentation:** [cortex-aegis.md](../docs/cortex-aegis.md)

### 7.1 When Aegis MUST Run

- [ ] Feature flows at G2 (plan) and again at G5 (verification) for any risk tag ≥ `medium` or touching user-facing / contract surfaces.
- [ ] Fix flows impacting security, privacy, data protection, or critical infrastructure.
- [ ] Refactor flows when contracts, storage schemas, or security boundaries change.
- [ ] Any task introducing a new MCP tool, connector, or ML model integration.

### 7.2 Inputs Required

- [ ] `plan/PLAN.md` (≤7 steps) + `plan/tdd-plan.md` summarised in the Aegis request (`steps` field, ≤7 items).
- [ ] `context/research.md` citations + connector health log references.
- [ ] Risk tags + tier from `meta/task.json` / `meta/tags.json`.
- [ ] Time freshness note (ISO date) referencing [cortex-aegis.md](../docs/cortex-aegis.md).

### 7.3 Outputs & Policy

- [ ] Raw response saved to `evidence/aegis-report.json`; `logs/vibe-check/*.json` for audit.
- [ ] `block` verdict halts the gate until resolved; attach mitigation evidence before retrying.
- [ ] `warn` verdict requires human disposition in `evidence/review-notes.md`.
- [ ] `run-manifest.json.evidence.aegisReport` pointer added (relative path).

---

## 8. Accessibility & Inclusive UX Checklist (Global)

- [ ] Keyboard-only path works; focus order logical and visible.
- [ ] Screen readers announce controls/errors; ARIA labels/roles present.
- [ ] No color-only signalling; icons/text used; contrast meets WCAG 2.2 AA.
- [ ] Respects reduced-motion preferences; animations limited.
- [ ] A11y report (axe/jest-axe or equivalent) attached in `evidence/test-results/`.

---

<!-- PROJECT-SPECIFIC: START -->
## 8.1 Project-Specific Checklist Items

> **Instructions:** Add project-specific checklist items here. This section is NOT overwritten when upgrading the governance pack.

### Additional PR Checklist Items

- [ ] _Project-specific item 1_
- [ ] _Project-specific item 2_

### Additional Review Checklist Items

- [ ] _Project-specific review item 1_

### Project-Specific Quality Gates

| Gate | Requirement | Evidence |
|------|-------------|----------|
| _none_ | — | — |

<!-- PROJECT-SPECIFIC: END -->

---

## 9. Change Management for This File

- [ ] Updates reviewed/approved by GovOps maintainers.
- [ ] `governance-index.json`, `structure-guard.json`, and `export-freeze.snapshot.json` updated to reference new sections; follow `governance-hash-update.md`.
- [ ] CI jobs referencing legacy checklist names updated to point here (`CHECKLIST_SECTION` tags).
- [ ] Redundant checklist files (`ci-review-checklists.md`, `code-review-checklist.md`) either migrate content here or become stubs referencing this file.

### 9.1 Changelog

- `[2025-12-04] v2025.12.0 – Added Cortex Aegis MCP installation info; fixed file path references (lowercase governance-hash-update.md); linked cortex-aegis.md documentation.`
- `[2025-11-22] v2025.11.0 – Consolidated local, PR, review, CI, gate, and Aegis checklists into a single canonical source under 20-checklists/.`
