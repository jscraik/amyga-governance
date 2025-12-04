<!-- governance/10-flow/agentic-coding-workflow.md -->

# Agentic Coding Workflow

> Canonical, enforceable workflow for humans + agents across feature, research, fix, refactor, and review flows.

---

## 0. Document Metadata

- **Doc ID**: `agentic-coding-workflow`
- **Version**: `2025.12.0`
- **Status**: `active`
- **Owner**: `Governance & Reliability (GovOps)`
- **Last Updated**: `2025-12-03`

> Governance: This document is normative. CI, humans, and agents MUST treat this as the source of truth for coding flows. Violations block the `charter-enforce` pipeline and require waivers recorded under `governance/waivers/`.

---

## 1. Purpose & Scope

- **Purpose**  
  Provide a single operational specification that connects ArcTDD gates, task folders, and Assurance System oversight so that humans and agents can execute work consistently and audibly. This workflow is referenced by `governance-quickstart.md`, `00-core/constitution.md`, and `00-core/AGENT_CHARTER.md`.

- **In Scope**  
  - Agentic workflows for: Feature implementation, Research/Spike, Fix (bug/incident), Refactor/Cleanup, and Code Review.  
  - ArcTDD gates **G0–G10**.  
  - Mandatory evidence (task folders, Assurance logs, Evidence Triplet, SBOM/provenance data).  
  - Tooling hooks (vibe check → Assurance System, Local Memory parity, knowledge connectors, MCP usage, OpenFeature requirement).

- **Out of Scope**  
  - People management, HR, or roadmap governance (see `governance/rules/vision.md`).  
  - Product/portfolio intake (handled by Strategy Council).  
  - Non-code business processes (finance, vendor, HR).

- **Upstream References**  
  - `00-core/constitution.md`
  - `00-core/AGENT_CHARTER.md`
  - `10-flow/governance-quickstart.md` (front door)
  - `10-flow/assurance-system.md`
  - `20-checklists/checklists.md`

---

## 2. Task Types & Canonical Flows

> Map every piece of work to ONE of the supported flows before entering G0. This choice drives required artefacts, Assurance System policy, and CI gating.

### 2.1 Task Classification

- **Feature** – Introduces a new capability, contract, or user-facing behaviour. Requires North-Star acceptance criteria and full ArcTDD coverage.
- **Research / Spike** – Exploration or feasibility work. Produces validated research and recommendations rather than code changes.
- **Fix** – Bug, incident, or regression work with a reproducible failing case and a minimal corrective change.
- **Refactor / Cleanup** – Internal quality improvements intended to preserve external behaviour while improving design/operability.
- **Code Review** – Dedicated review-only efforts (e.g., Reviewer Neuron runs, HITL review). Produces dispositions, not code.

### 2.2 Flow Selection Matrix

| Work item type         | Primary flow        | Typical ArcTDD gates            | Notes |
|------------------------|---------------------|---------------------------------|-------|
| New feature / story    | Feature             | G0–G7 (extend to G8–G10 for rollout/monitoring) | Requires North-Star test + Cortex-Aegis at G2 and G5. |
| Research / feasibility | Research / Spike    | G0–G3 → G10                      | Produces decision memo; code optional; Aegis validates sources/time freshness. |
| Bug / incident         | Fix                 | G0–G7 (extend to G8–G10 for hotfix rollout) | Needs reproducer, failing test, and postmortem if SEV ≥ 2. |
| Refactor / cleanup     | Refactor            | G0–G7 → G10                      | Behaviour-preserving; emphasise invariants + perf baselines. |
| Review-only work       | Code Review         | G5–G7 → G10                      | No authoring; consumes Evidence Triplet + manifests. |

---

## 3. Standard Task Folder Layout

> Every flow operates inside a task folder. Humans and agents MUST use this layout so that automation, audits, and Cortex-Aegis can reason about work. Task folders live under the single root `tasks/<task-slug>/`.

### 3.1 Location & Naming

- Root pattern: `[REPO_ROOT]/tasks/<task-slug>/` (kebab-case).
  Examples: `tasks/feat-user-profile-page/`, `tasks/fix-api-timeout-500/`.

### 3.2 Directory & File Structure

```text
tasks/<task-slug>/
  meta/
    task.json                # id, tier (fix/feature/refactor), owners, links
    tags.json                # domains, risk levels, feature flags, ArcTDD tier
  context/
    research.md              # repo scan, RAID, academic evidence, connector health log
    requirements.md          # story, bug report, acceptance criteria
    design.md                # diagrams, API contracts, state charts
  plan/
    PLAN.md                  # ≤7-step arc plan, references reuse candidates
    risk-register.md         # identified risks + mitigations
    tdd-plan.md              # Milestone test plan, BDD specs
  work/
    implementation-log.md    # chronological decisions + evidence links
    patches/                 # optional saved diff bundles
  evidence/
    tests.md                 # what ran, coverage, mutation, perf, a11y, security
    test-results/            # raw logs, screenshots, junit xml
    review.json              # AI reviewer neuron output
    review-notes.md          # human reviewer dispositions + checklist summary
    aegis-report.json        # Cortex-Aegis verdict(s)
    recaps.log               # session recaps (≤500 tokens) per Charter §5
  ops/
    rollout-plan.md          # deploy steps, flags, migrations
    rollback-plan.md         # triggers + procedures
    postmortem.md            # required for Fix/incident flows
```

> **Governance hooks**: `research/connectors-health.log`, `logs/vibe-check/*.json`, and `run-manifest.json` MUST be present whenever connectors, vibe check, or Arc manifests are invoked.
> **MCP session tracking**: After each MCP connection (RepoPrompt, Cortex-Aegis, academic connectors), append an entry to `run-manifest.json.mcp_sessions` via `just mcp-session-manifest <slug> <server> <transport> <endpoint> <session_log> <evidence_log>`.

### 3.3 Minimum Required Artefacts by Flow

| Flow      | Required artefacts (minimum) |
|-----------|------------------------------|
| Feature   | `meta/task.json`, `context/requirements.md`, `context/research.md`, `plan/PLAN.md`, `plan/tdd-plan.md`, `evidence/tests.md`, `evidence/aegis-report.json`, `work/implementation-log.md`, `run-manifest.json` pointer to Evidence Triplet. |
| Research  | `meta/task.json`, `context/research.md`, `plan/PLAN.md` (research plan), `evidence/aegis-report.json` (if Aegis run), `research/connectors-health.log` for Lifelines. |
| Fix       | `meta/task.json`, `context/requirements.md` (bug description + repro), failing + passing tests recorded in `evidence/tests.md`, `ops/postmortem.md` for SEV ≤ 2+, `evidence/aegis-report.json` when risk tags ≠ low. |
| Refactor  | `meta/task.json`, `context/research.md` (current behaviour + invariants), `plan/PLAN.md`, baseline & post-change data in `evidence/tests.md`, perf deltas in `evidence/test-results/`. |
| Review    | `meta/task.json`, `evidence/review.json`, `evidence/review-notes.md`, `checklistsgovernance-os.md` excerpt attached to PR/comment. |

---

## 4. ArcTDD Gate Policy (G0–G10)

> Every gate defines objectives, inputs, required artefacts, and exit criteria. Automation inspects `run-manifest.json`, `quality-report.json`, and the task folder to confirm compliance.

### 4.0 Repo Prompt Integration

**Repo Prompt** is the default repo-aware MCP server for context building, planning, and minimal edits in governance framework. It provides:

- **Context Builder**: Assembles bounded context with codemaps and API overviews
- **Plan Preset**: Generates architectural plans grounded in existing code
- **Pro Edit (XML)**: Produces minimal, reviewable diffs for targeted changes
- **MCP Pair**: Orchestrates multi-step implementations with repo awareness

**MCP Configuration** (example for `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "RepoPrompt": {
      "command": "/path/to/repoprompt_cli",
      "args": [],
      "env": {},
      "toolOutputTokenLimit": 25000,
      "toolTimeoutSec": 1000
    }
  }
}
```

**Integration Points by Gate**:

- **G1 (Discover)**: MUST use Context Builder for tasks above size threshold to assemble repo context
- **G2 (Plan)**: SHOULD use Plan preset for medium+ tasks to produce PLAN.md grounded in existing code
- **G3-G4 (Scaffold/Implement)**: SHOULD use Pro Edit for small/medium changes; MCP Pair for complex multi-step work
- **G5 (Verify)**: MAY use Repo Prompt to find additional test coverage gaps via codemaps
- **G6 (Review)**: MAY use Context Builder to provide reviewers with architectural context

**Division of Responsibility**:

- **Repo Prompt**: Repo-local context engine and edit applier (stays within codebase boundaries)
- **Cortex-Aegis**: Governance + external evidence + risk assessment (validates against policies and freshness)

### 4.1 Gate Overview

| Gate | Name                | Description |
|------|---------------------|-------------|
| G0   | Initialize          | Classify task, create folder, capture metadata + tier. |
| G1   | Discover / Research | Understand existing behaviour, dependencies, academic context. |
| G2   | Plan / Design       | Produce PLAN.md, risk register, and cortex-aegis validated approach. |
| G3   | Scaffold            | Establish failing tests, feature flags, contracts, and wiring. |
| G4   | Implement           | Execute plan (≤7 steps per arc) with TDD micro-loops. |
| G5   | Verify              | Run tests, security/a11y/perf checks, gather Evidence Triplet. |
| G6   | Review              | AI reviewer + human reviewer dispositions, waiver handling. |
| G7   | Document            | Update docs, changelog, runbooks, arc manifests. |
| G8   | Ship                | Deploy & flag management with rollback paths. |
| G9   | Monitor             | Observe telemetry, model health, error budgets. |
| G10  | Archive             | Preserve artefacts, update memory, close task. |

### 4.2 Gate Templates

#### G0 – Initialize

- **Objective** – Declare task type/tier, create folder, and anchor time freshness.  
- **Inputs** – Work request (ticket, incident, roadmap item).  
- **Required artefacts** – `meta/task.json`, `meta/tags.json`, initial `run-manifest.json`.  
- **Checks** – Confirm tier selection (fix/feature/refactor), connectors accessible, <7 clarifying questions (Charter §2).  
- **Exit criteria** – Task folder exists; owner + reviewer assigned; `time-freshness` entry logged.

#### G1 – Discover / Research

- **Objective** – Build context through repo scans, Local Memory recall, and academic sources.  
- **Repo Prompt Usage** – For tasks above size threshold, MUST run **Context Builder** to:
  - Identify relevant files, symbols, and modules
  - Generate **codemaps** for key areas (APIs, types, call graphs)
  - Produce **handoff prompt** summarizing repo-aware context
  - Save Context Builder output summary to `context/research.md`
- **Required artefacts** – `context/research.md` (including Repo Prompt context summary), `research/connectors-health.log`, `analysis/reuse-evaluation.md` (if reuse study already started).  
- **Checks** – Agents call `/recall` commands, verify Wikidata + arXiv MCP endpoints, fetch academic research via MCP connectors, log license status, run Repo Prompt Context Builder for non-trivial tasks.  
- **Exit criteria** – RAID + feasibility documented; North-Star acceptance test path recorded; reuse candidates enumerated; repo context available for G2.

#### G2 – Plan / Design

- **Objective** – Produce executable plan ≤7 steps per Arc; define tests, contracts, mitigations.  
- **Repo Prompt Usage** – For medium+ complexity tasks, SHOULD use **Plan preset** to:
  - Generate plan using Context Builder handoff from G1
  - Propose architecture changes and touchpoints grounded in existing code
  - Outline test strategy and risk areas with repo awareness
  - Save Repo Prompt-generated plan to `plan/PLAN.md`
- **Required artefacts** – `plan/PLAN.md` (Repo Prompt Plan or equivalent), `plan/tdd-plan.md`, `plan/risk-register.md`, updated `run-manifest.json`.  
- **Cortex-Aegis usage** – Mandatory for Feature, Fix, and any Refactor touching contracts or security-critical code. Provide plan summary (including Repo Prompt context), research citations, risk tags, and tool health evidence.  
- **Checks** – Plan references reuse candidates; connectors health still green; Cortex-Aegis JSON stored in `evidence/aegis-report.json`; Repo Prompt plan artifacts present.  
- **Exit criteria** – Plan approved (no Aegis `block`), tests identified, quality gates defined, plan grounded in repo realities.

#### G3 – Scaffold

- **Objective** – Create failing milestone tests, feature flags (OpenFeature only), wiring, and contract snapshots.  
- **Repo Prompt Usage** – SHOULD use **Codemaps + search** to:
  - Confirm where scaffolding should attach (entrypoints, DI boundaries)
  - Verify new modules integrate with existing types and call graphs
  - Validate wiring against architectural patterns shown in codemaps
- **Required artefacts** – Failing tests recorded in `run-manifest.json.reuseEvidence.failingTest`, `design/contracts/<timestamp>-before.json`.  
- **Checks** – No placeholder adapters; scaffolds compile; cancellation tokens wired for HTTP/tooling; Repo Prompt codemap confirms proper integration.  
- **Exit criteria** – Repo builds; failing tests prove gap; feature flag default = off; scaffolding properly wired.

#### G4 – Implement

- **Objective** – Execute micro TDD loops (≤20 min) to satisfy plan.  
- **Repo Prompt Usage**:
  - **For small/medium changes**: SHOULD use **Pro Edit (XML)** workflow to generate minimal diffs per file
  - **For complex multi-step changes**: SHOULD use **MCP Pair** workflow where:
    - Orchestrating agent steps through PLAN.md
    - Delegates repo edits to Repo Prompt via MCP
    - Maintains repo context across implementation steps
  - Reference Repo Prompt sessions in `work/implementation-log.md` where useful
- **Required artefacts** – Code + tests, `work/implementation-log.md` (including Repo Prompt session references), `logs/models/*` for live model usage, named exports only.  
- **Checks** – Named exports, ≤40-line functions, typed boundaries, no `Math.random()`, no TODO/FIXME/HACK, cancellation enforced, `OpenFeature` for flags, connectors logged, Local Memory updates appended.  
- **Exit criteria** – Tests now pass locally; Evidence Triplet outline captured (test path, contract snapshot, reviewer pointer); implementation matches plan or deviations documented.

#### G5 – Verify

- **Objective** – Provide hard evidence for change correctness, safety, and compliance.  
- **Required artefacts** – `evidence/tests.md`, `evidence/test-results/*`, `verification/coverage-results.json`, `verification/mutation-results.json`, `evidence/aegis-report.json` (if rerun), `implementation-plan.md#reuse-ledger`.  
- **Checks** – Coverage ≥ 90% global / 95% changed; mutation ≥ 90%; Semgrep/gitleaks/OSV clean; structure + Axe/jest-axe for UI/CLI; SBOM (CycloneDX 1.7) + SLSA v1.1 provenance + Cosign v3 bundle; model health logs; Evidence Triplet complete.  
- **Exit criteria** – All gates satisfied; `run-manifest.json.reuseEvidence` populated (`plan`, `failingTest`, `passingTest`, `reviewComment`).

#### G6 – Review

- **Objective** – Run AI reviewer neuron + human reviewer with unified checklist.  
- **Required artefacts** – `evidence/review.json`, `evidence/review-notes.md`, filled checklist pasted into PR referencing evidence anchors, reviewer acknowledgements appended to `work/implementation-log.md` or `decisions.md`.  
- **Checks** – All findings dispositioned; waivers recorded + approved; TDD plan reuse ledger link present; narrated diff acknowledged.  
- **Exit criteria** – Human reviewer approves; CI `danger` job green; waivers (if any) show Maintainer approval + expiry ≤30 days.

#### G7 – Document

- **Objective** – Align documentation, runbooks, changelog, and governance artefacts with the merged change.  
- **Required artefacts** – Updated READMEs/API docs/runbooks; changelog entry; `work/implementation-log.md` links to doc PRs; `ops/rollout-plan.md` completed.  
- **Exit criteria** – Documentation matches implementation; release notes ready; governance indexes updated.

#### G8 – Ship

- **Objective** – Execute rollout with feature flags, migrations, and telemetry hooks.  
- **Required artefacts** – `ops/rollout-plan.md`, `ops/rollback-plan.md`, deployment logs, Cosign bundle references.  
- **Exit criteria** – Release complete, feature flag strategy documented, rollback guardrails tested.

#### G9 – Monitor

- **Objective** – Observe impact, log trace context, track reuse telemetry, maintain error budgets.  
- **Required artefacts** – Monitoring dashboards, `logs/models/*`, `ops/observability/*`, alerts/resolution notes.  
- **Exit criteria** – No unresolved high-severity issues; telemetry stable; follow-ups filed if needed.

#### G10 – Archive

- **Objective** – Close the loop; persist artefacts for audits and Local Memory.  
- **Required artefacts** – `SUMMARY.md`, `archive.json`, review checklist snapshot in `governance/audit/reviews/<PR>-<sha>.md`, Local Memory entry IDs recorded in `json/memory-ids.json`.  
- **Exit criteria** – Task folder archived; Evidence Triplet + TDD plan reuse ledger indexed; `.github/instructions/memories.instructions.md` updated.

---

## 5. Canonical Flows

> Each flow specifies its gate path, highlights, and mandatory artefacts.

### 5.1 Feature Implementation Flow

- **Gate Path** – G0 → G1 → G2 → G3 → G4 → G5 → G6 → G7 → (G8/G9/G10 as needed).
- **Key Activities**  
  1. Classify task, set tier, create folder.  
  2. Run repo scan + academic research; log connectors health.  
  3. Draft PLAN.md (≤7 steps), TDD plan, risk register; run Cortex-Aegis.  
  4. Scaffold failing Milestone test, feature flags, contract snapshots.  
  5. Implement via TDD micro-loops with JEDI rules.  
  6. Run verification suite, SBOM/provenance, Aegis follow-up.  
  7. Perform AI + human review (checklist + Evidence Triplet).  
  8. Update docs/runbooks/changelog, then ship & monitor if applicable.
- **Mandatory Artefacts** – All items listed in §3.3 for Feature plus `implementation-plan.md#reuse-ledger`, `logs/vibe-check/*.json`, `research/connectors-health.log` entries.

### 5.2 Research / Spike Flow

- **Gate Path** – G0 → G1 → G2 → (optional G3/G5 for prototypes) → G10.  
- **Key Activities** – Context sweep, academic research (citations + license checks), hypothesis statement, evaluation criteria, and recommendation memo. Cortex-Aegis validates research parity/time freshness.  
- **Outputs** – Updated `context/research.md`, `plan/PLAN.md` (research-only), `evidence/aegis-report.json`, decision memo added to `SUMMARY.md`.  
- **Exit** – Recommendation accepted/rejected, follow-on task filed.

### 5.3 Fix Implementation Flow

- **Gate Path** – G0 → G1 → G2 → G3 → G4 → G5 → G6 → G7 → (G8/G9/G10).  
- **Key Activities** – Capture reproducer; add failing regression test; small plan; implement minimal fix; rerun tests + security checks; produce postmortem for incidents; ensure rollback ready.  
- **Mandatory Artefacts** – `context/requirements.md` (bug + repro), failing → passing test logs, `ops/postmortem.md` (if severity warrants), `evidence/aegis-report.json` for non-trivial risk tags.

### 5.4 Refactor / Cleanup Flow

- **Gate Path** – G0 → G1 → G2 → G3/G4 → G5 → G6 → G7 → G10.  
- **Key Activities** – Document invariants + baselines; plan safe sequence; implement behind feature flags if needed; prove behaviour unchanged via tests/perf metrics; record cleanup notes.  
- **Mandatory Artefacts** – Baseline/perf data, invariants summary, PLAN.md with guardrails, test evidence showing no regression.

### 5.5 Code Review Flow

- **Gate Path** – G5 → G6 → G7 → G10 (consumes artefacts produced by authoring flows).  
- **Key Activities** – Pull Evidence Triplet + plan reuse ledger; run Reviewer Neuron; fill checklist referencing evidence anchors; disposition findings; log reviewer acknowledgements.  
- **Mandatory Artefacts** – `evidence/review.json`, `evidence/review-notes.md`, checklist excerpt stored in task folder + PR, pointer to TDD plan reuse ledger.

---

## 6. JEDI Coding Rules & Agent Defaults

- **Patch-first** – Always edit via diffs (git apply / apply_patch). No wholesale rewrites.  
- **Test-first mindset** – Define/extend tests during G2–G4; enforce failing → passing evidence before refactor.  
- **Deterministic outputs** – Structured JSON responses for tools, no hidden scratchpads.  
- **Structured logs** – Include `[brAInwav]`, `brand:"brAInwav"`, `component`, and `trace_id` per log line; propagate W3C `traceparent`.  
- **OpenFeature only** – All feature flags must use OpenFeature APIs/providers.  
- **Cancellation mandatory** – Every HTTP/MCP/tool call must respect `AbortSignal` or equivalent.  
- **No stubs in prod** – No fake ML outputs, placeholder adapters, `Math.random()` data, TODO/FIXME/HACK tags, or console stubs.  
- **Named exports + ≤40 line functions** – Enforced via ESLint + Semgrep.  
- **Live model evidence** – Log model IDs, vector shapes, latency metrics; store under `logs/models/`.  
- **Secrets discipline** – Fetch secrets via `op` CLI only; never commit credentials or long-lived env vars.  
- **Agent startup checklist** – On every session start, agents MUST: (1) read `governance-quickstart.md`; (2) read this workflow; (3) classify task + flow; (4) locate task folder + gate; (5) honour Cortex-Aegis policy; (6) log recap cadence.

---

## 7. Integration with Cortex-Aegis

- **When to call**  
  - **Mandatory**: Feature, Fix, and Refactor flows at **G2** (plan approval).  
  - **Mandatory**: Feature and Fix flows at **G5** (evidence validation) when risk tags include security, privacy, a11y, or data-class ≥ restricted.  
  - **Recommended**: Research flow before publishing recommendation; Code Review flow when reviewers dispute Aegis warnings.  
- **Inputs** – Task summary, ≤7-step plan, research citations (with license status), connector health logs, risk tags, tier, and time-freshness anchor.  
- **Outputs** – JSON verdict (`pass|warn|block`), required follow-ups, evidence references. Store raw output in `evidence/aegis-report.json` and link inside `run-manifest.json`.  
- **Policy** – `block` halts the gate until addressed; `warn` requires documented mitigation + reviewer acknowledgement. Missing logs = automatic CI failure.  
- **Toolchain** – Use the `vibe_check` MCP endpoint per `cortex-aegis.md`, keeping plan step budget ≤7 and logging responses under `logs/vibe-check/`.

---

## 8. References & Change Process

- **Related governance docs** – Constitution, AGENT_CHARTER (Rules of AI consolidated), Cortex-Aegis (Time Freshness Policy), unified checklists, TASK_FOLDER_STRUCTURE.
- **Change authority** – Updates require approval from GovOps maintainers plus at least one product-line representative. Every change must: (1) update this doc; (2) update `90-infra/governance-index.json` + `structure-guard.json`; (3) refresh `export-freeze.snapshot.json` and `GOVERNANCE_HASH_UPDATE.md`; (4) document delta in `changelog/<slug>/`.  
- **Changelog** – Append entries in `changelog/` using `pnpm changelog:new --slug <slug> --tier <fix|feature|refactor>` (or successor script). Example: `[2025-11-22] v2025.11.0 – Moved workflow to 10-flow/, aligned with quickstart, embedded Cortex-Aegis + reuse ledger requirements.`

---

**End of document.**
