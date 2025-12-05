<!-- governance/10-flow/agentic-coding-workflow.md -->

# Agentic Coding Workflow

> **At a glance:** Flows = Feature, Fix, Refactor, Research, Review. Gates bundle R→G→F→REVIEW with optional compact mode (Plan, Implement, Verify/Review). Oversight (Cortex-Aegis) required when code/model/data/external-call changes or risk ≥ medium. Evidence Triplet + run-manifest are mandatory; memory parity required. See §2.3 for compact flow; §4 for tool gating.

> Canonical, enforceable workflow for humans + agents across feature, research, fix, refactor, and review flows.

---

## Table of Contents

- [0. Document Metadata](#0-document-metadata)
- [1. Purpose & Scope](#1-purpose--scope)
- [2. Task Types & Canonical Flows](#2-task-types--canonical-flows)
- [3. Standard Task Folder Layout](#3-standard-task-folder-layout)
- [4. ArcTDD Gate Policy (G0–G10)](#4-arctdd-gate-policy-g0g10)
- [5. Canonical Flows](#5-canonical-flows)
  - [5.1 Feature Implementation Flow](#51-feature-implementation-flow)
  - [5.2 Research / Spike Flow](#52-research--spike-flow)
  - [5.3 Fix Implementation Flow](#53-fix-implementation-flow)
  - [5.4 Refactor / Cleanup Flow](#54-refactor--cleanup-flow)
  - [5.5 Code Review Flow](#55-code-review-flow)
- [6. JEDI Coding Rules & Agent Defaults](#6-jedi-coding-rules--agent-defaults)
- [7. Integration with Cortex-Aegis](#7-integration-with-cortex-aegis)
- [8. References & Change Process](#8-references--change-process)

---

## 0. Document Metadata

- **Doc ID**: `agentic-coding-workflow`
- **Version**: `2025.12.1`
- **Status**: `active`
- **Owner**: `Governance & Reliability (GovOps)`
- **Last Updated**: `2025-06-13`

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
  - `10-flow/session-continuity.md` (multi-session tasks)
  - `10-flow/memory-governance.md` (memory access control)
  - `10-flow/runtime-governance-service.md` (runtime enforcement, Trust Factor)
  - `10-flow/emergency-stop-protocol.md` (kill switches, safety triggers)
  - `20-checklists/checklists.md`
  - `docs/documentation-governance.md` (documentation quality + mandatory JSDoc policy)

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

### 2.3 Compact Flow (lean mode)

Use this when work is low/medium risk and the overhead of full per-gate checkpoints would slow delivery. It **does not** weaken evidence requirements; it bundles gates and clarifies when Oversight is required.

- **Phases (bundled gates):**
  - **Plan** (G0–G2): classify task, capture time-freshness token, 1–7 step plan, risk tags, reuse scan, minimal `plan/PLAN.md`, update `run-manifest.json`.
  - **Implement** (G3–G4): establish failing→passing test path, apply changes, keep `work/implementation-log.md` concise, log deviations.
  - **Verify/Review** (G5–G7): run tests/linters/coverage, record Evidence Triplet, run Oversight **only** if code/model/data/external-call surface changed or risk ≥ medium, summarize in `evidence/summary.md` and `run-manifest.json`.
- **Lightweight tasks (docs/typo/non-executable):** plan ≤2 steps, tests noted as not applicable, Oversight optional with rationale in `plan/PLAN.md`, still record a memory entry and mirror to `.github/instructions/memories.instructions.md`.
- **High-risk tasks (prod data/models/security/perf-sensitive):** stay on full G0–G10; do not use compact bundling.
- **Evidence bundle:** one `run-manifest.json` entry per bundled phase and a single `evidence/summary.md` linking the Triplet (plan anchor, failing→passing evidence, review). Memory parity still required.

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
    critic-review.json       # Critic subagent self-review output (G5)
    confession-report.json   # Confession protocol honest self-assessment (G5+)
    session-retrospective.md # Session retrospective insights (G10)
    recaps.log               # session recaps (≤500 tokens) per Charter §5
  ops/
    rollout-plan.md          # deploy steps, flags, migrations
    rollback-plan.md         # triggers + procedures
    postmortem.md            # required for Fix/incident flows
  logs/
    vibe-check/              # Oversight/Aegis vibe check logs
    long-context/            # Long-context safety logs (if applicable)
  json/
    run-manifest.json        # Arc manifest with evidence pointers
    task-status.json         # Current gate, blockers, next steps
    memory-ids.json          # Local Memory entry IDs
    checkpoints/             # Session checkpoint snapshots
    checkpoint-index.json    # Index of all checkpoints for task
```

> **Governance hooks**: `research/connectors-health.log`, `logs/vibe-check/*.json`, and `run-manifest.json` MUST be present whenever connectors, vibe check, or Arc manifests are invoked.
> **MCP session tracking**: After each MCP connection (RepoPrompt, Cortex-Aegis, academic connectors), append an entry to `run-manifest.json.mcp_sessions` via `just mcp-session-manifest <slug> <server> <transport> <endpoint> <session_log> <evidence_log>`.

### 3.3 Minimum Required Artefacts by Flow

| Flow      | Required artefacts (minimum) |
|-----------|------------------------------|
| Feature   | `meta/task.json`, `context/requirements.md`, `context/research.md`, `plan/PLAN.md`, `plan/tdd-plan.md`, `evidence/tests.md`, `evidence/aegis-report.json`, `evidence/critic-review.json`, `evidence/confession-report.json`, `evidence/session-retrospective.md`, `work/implementation-log.md`, `run-manifest.json` pointer to Evidence Triplet. |
| Research  | `meta/task.json`, `context/research.md`, `plan/PLAN.md` (research plan), `evidence/aegis-report.json` (if Aegis run), `evidence/confession-report.json` (if code produced), `evidence/session-retrospective.md`, `research/connectors-health.log` for Lifelines. |
| Fix       | `meta/task.json`, `context/requirements.md` (bug description + repro), failing + passing tests recorded in `evidence/tests.md`, `evidence/critic-review.json`, `evidence/confession-report.json`, `ops/postmortem.md` for SEV ≤ 2+, `evidence/aegis-report.json` when risk tags ≠ low. |
| Refactor  | `meta/task.json`, `context/research.md` (current behaviour + invariants), `plan/PLAN.md`, baseline & post-change data in `evidence/tests.md`, `evidence/critic-review.json`, `evidence/confession-report.json`, `evidence/session-retrospective.md`, perf deltas in `evidence/test-results/`. |
| Review    | `meta/task.json`, `evidence/review.json`, `evidence/review-notes.md`, `checklistsgovernance-os.md` excerpt attached to PR/comment. |

### 3.4 Gate-by-Gate Artefact Creation

> This section maps artefact creation to the ArcTDD gates (G0–G10). Agents and humans MUST create the specified files at each gate; automation validates presence.

| Gate | Artefacts Created |
|------|-------------------|
| **G0 – Initialize** | Create `tasks/<task-slug>/` directory. No files yet—just the folder structure. |
| **G1 – Discover** | `context/research.md` (RAID analysis, feasibility, technical spikes, PoC results, academic research synthesis from Wikidata/arXiv/Semantic Scholar/OpenAlex/Context7, security + a11y requirements, existing patterns). |
| **G2 – Plan** | `plan/PLAN.md` (≤7-step arc plan, reuse candidates), `plan/risk-register.md`, `plan/tdd-plan.md` (BDD scenarios, test coverage goals), `analysis/reuse-evaluation.md` (from template). Optional: `context/design/` for diagrams. |
| **G3 – Scaffold** | Initial failing tests created; contracts and feature flags wired; `meta/task.json` and `meta/tags.json` populated. |
| **G4 – Implement** | `work/implementation-log.md` (real-time progress, decisions, deviations), `work/patches/` (optional diff bundles), `evidence/test-results/` (as tests pass). |
| **G5 – Verify** | `evidence/tests.md` (coverage, mutation, perf, a11y, security), `context/design/` (final diagrams), `evidence/aegis-report.json`, documentation changes validated against `docs/documentation-governance.md` (skimmability + JSDoc on touched JS/TS). |
| **G6 – Review** | `evidence/review.json` (AI reviewer output), `evidence/review-notes.md` (human dispositions), `HITL-feedback.md` (if applicable). |
| **G7 – Merge** | PR merged; all evidence committed; `run-manifest.json` finalized with Evidence Triplet pointers. |
| **G8 – Deploy** | `ops/rollout-plan.md` (deploy steps, flags, migrations), `ops/validation/*.log` (CI/CD deployment validation). |
| **G9 – Monitor** | `ops/monitoring/*.json` (production metrics), `ops/postmortem.md` (required for Fix/incident flows with SEV ≥ 2). |
| **G10 – Archive** | `SUMMARY.md` (comprehensive final summary: research, implementation, review, tests, HITL decisions, refactoring notes, verification, monitoring lessons). Flag task folder as archived. |

> **Session continuity**: For multi-session tasks, create a checkpoint in `json/checkpoints/` at every gate transition and significant decision. Update `json/task-status.json` with current gate and next steps. See `10-flow/session-continuity.md` for startup/shutdown rituals.

### 3.5 Examples

#### Example 1: Simple Bug Fix

```text
tasks/fix-mcp-auth-bug/
├── meta/
│   └── task.json
├── context/
│   ├── requirements.md      # Bug description + repro steps
│   └── research.md          # Investigation findings
├── plan/
│   ├── PLAN.md              # Fix strategy
│   └── tdd-plan.md          # Failing + passing test plan
├── work/
│   └── implementation-log.md
├── evidence/
│   ├── tests.md
│   ├── test-results/
│   │   └── auth-tests.log
│   └── aegis-report.json
├── ops/
│   └── postmortem.md        # Required if SEV ≥ 2
├── json/
│   ├── task-status.json     # Current gate, blockers, next steps
│   └── checkpoints/         # Session checkpoints (if multi-session)
├── run-manifest.json
└── SUMMARY.md
```

#### Example 2: New Feature with UI

```text
tasks/dashboard-metrics-widget/
├── meta/
│   ├── task.json
│   └── tags.json
├── context/
│   ├── requirements.md
│   ├── research.md
│   └── design/
│       ├── wireframe.png
│       ├── architecture.drawio
│       └── component-hierarchy.svg
├── plan/
│   ├── PLAN.md
│   ├── risk-register.md
│   └── tdd-plan.md
├── analysis/
│   └── reuse-evaluation.md
├── work/
│   └── implementation-log.md
├── evidence/
│   ├── tests.md
│   ├── test-results/
│   │   ├── unit-tests.xml
│   │   ├── a11y-tests.json
│   │   └── integration-tests.log
│   ├── review.json
│   ├── review-notes.md
│   ├── aegis-report.json
│   └── recaps.log
├── ops/
│   ├── rollout-plan.md
│   └── validation/
│       └── deployment-prod.log
├── logs/
│   └── vibe-check/
│       └── initial.json
├── json/
│   ├── task-status.json
│   ├── memory-ids.json
│   ├── checkpoint-index.json
│   └── checkpoints/
│       ├── ckpt-g2-plan.json
│       ├── ckpt-g5-verify.json
│       └── ckpt-session-end.json
├── HITL-feedback.md
├── run-manifest.json
└── SUMMARY.md
```

### 3.6 Agent Responsibilities

#### When Starting a New Task

1. Create `tasks/<task-slug>/` directory immediately (G0).
2. Start with `context/research.md` at G1.
3. Never skip gates or required artefacts.
4. Follow the hierarchy of authority (see `AGENTS.md`).

#### During Task Execution

- Update files as you progress through gates.
- Fetch API keys, SSH keys, and tokens on-demand with the 1Password CLI (`op`); never embed secrets in task artefacts.
- Keep `work/implementation-log.md` current with real-time notes.
- Create subdirectories before adding files to them.
- Mark checklist items in `plan/PLAN.md` as completed.

#### Before Archiving (G10)

- Ensure all required artefacts exist and are complete.
- Create comprehensive `SUMMARY.md`.
- Verify all subdirectories contain relevant artefacts.
- Flag task folder as archived in Local Memory.

### 3.7 Common Mistakes

❌ **DON'T:**

- Store task files in flat structure at `tasks/<feature>.md`.
- Skip required artefacts (research, plans, evidence, summary).
- Mix multiple tasks in one folder.
- Store secrets or PII in task folders.
- Archive incomplete task folders.
- Use Phase 0–6 terminology (legacy); use G0–G10 gates.

✅ **DO:**

- Create dedicated folder for each task.
- Follow gate-by-gate artefact creation.
- Use descriptive folder names (kebab-case slugs).
- Keep folder structure organized per §3.2.
- Document everything for reproducibility.
- Persist key decisions to Local Memory MCP/REST and reference `LocalMemoryEntryId` in relevant task files.

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

### 4.1 MCP Tool Integration Matrix

> This matrix shows when each MCP tool is called across the G0–G10 gate workflow. Agents MUST use these tools at the specified gates; automation validates evidence.

#### MCP Tool Overview

| Tool | Package/CLI | Purpose | Evidence Location |
|------|-------------|---------|-------------------|
| **RepoPrompt** | `repoprompt_cli` | Repo-aware context building, planning, minimal edits | `context/research.md`, `plan/PLAN.md`, `work/implementation-log.md` |
| **Local Memory** | `local-memory-mcp` | Cross-session decision persistence, semantic search | `json/memory-ids.json`, `.github/instructions/memories.instructions.md` |
| **Cortex-Aegis** | `@brainwav/cortex-aegis-mcp` | Governance validation, risk assessment, time freshness | `evidence/aegis-report.json`, `logs/vibe-check/*.json` |
| **Context7** | `@upstash/context7-mcp` | Up-to-date library docs, version-specific examples | `context/research.md`, `plan/PLAN.md` (cited sources) |

> **Security Tooling (MANDATORY)** – Before running any gated flow, install and keep updated the security toolchain defined in `SECURITY.md` §“Standards & References (Dec 2025)” and §“Continuous Security”. At minimum every workstation/CI runner MUST have: Semgrep (SAST), Gitleaks (secret scan), OSV/pnpm audit tooling, Trivy (container/IaC scan), CycloneDX CLI for SBOM generation, and Sigstore Cosign v3 for attestation. Use package manager of choice (e.g., `brew install semgrep gitleaks aquasecurity/trivy/trivy cosign cyclonedx-cli`) and ensure `pnpm audit`/OSV client versions match the repo’s `.mise.toml`. Evidence of these tools running must appear at G5 per §4.3.

#### Gate-by-Gate Tool Usage

| Gate | RepoPrompt | Local Memory | Cortex-Aegis | Context7 |
|------|------------|--------------|--------------|----------|
| **G0 – Initialize** | — | `search` (recall prior work) | — | — |
| **G1 – Discover** | **Context Builder** (MUST for medium+) | `search` (architectural decisions) | — | `resolve-library-id` + `get-library-docs` (for external libs) |
| **G2 – Plan** | **Plan preset** (SHOULD for medium+) | `store_memory` (key decisions) | **vibe_check** (MANDATORY) | `get-library-docs` (validate approaches) |
| **G3 – Scaffold** | Codemaps + search | — | — | — |
| **G4 – Implement** | **Pro Edit** or **MCP Pair** | `store_memory` (deviations) | — | **`get-library-docs` (MANDATORY per API call)** |
| **G5 – Verify** | Context Builder (gap analysis) | — | **vibe_check** (MANDATORY if risk ≥ medium) | — |
| **G6 – Review** | Context Builder (reviewer context) | — | — | — |
| **G7 – Document** | — | `store_memory` (lessons) | — | — |
| **G8 – Ship** | — | — | — | — |
| **G9 – Monitor** | — | `store_memory` (operational notes) | — | — |
| **G10 – Archive** | — | `store_memory` (final summary) | — | — |

#### Tool Call Patterns

**RepoPrompt Tools** (14 available):

```text
# Context Building (G1, G5, G6)
manage_selection     → Curate file selection for bounded context
discover_context     → Semantic discovery of related files
workspace_context    → Snapshot workspace state with codemaps
get_code_structure   → Generate AST-based codemaps
file_search          → Pattern/regex search across repo

# Planning (G2)
chat_send            → Plan preset generates PLAN.md from context
prompt               → Get/set shared prompt for planning session

# Implementation (G3, G4)
apply_edits          → Pro Edit XML for minimal diffs
file_actions         → Create/delete/move files
get_file_tree        → Directory structure for scaffolding

# Session Management
manage_workspaces    → Switch between RepoPrompt windows
chats                → List/access chat history
list_models          → Available model presets
```

**Local Memory Tools** (4 available):

```text
# Store (G2, G4, G7, G9, G10)
local-memory:store_memory → {content, importance: 1-5, tags: [], domain: string}

# Update (when decisions evolve)
local-memory:update_memory → {memory_id, content, importance?, tags?}

# Recall (G0, G1)
local-memory:search → {query, limit: 5, threshold: 0.70, semantic: true}
local-memory:get_memory_by_id → {memory_id}
```

**Cortex-Aegis** (1 primary endpoint):

```text
# Governance Validation (G2 MANDATORY, G5 conditional)
vibe_check → {
  goal: string,
  plan: string (≤7 steps),
  session: string,
  save: "tasks/<slug>/logs/vibe-check/*.json",
  with-academic-research: boolean,
  validate-licenses: boolean
}

# Response: { verdict: "pass|warn|block", required_followups: [], evidence_refs: [] }
```

**Context7 Tools** (2 available):

```text
# Library Resolution (G1)
resolve-library-id → {libraryName: string}
# Returns: Context7-compatible ID (e.g., /vercel/next.js), trust score, snippet count

# Documentation Fetch (G1, G2, G4)
get-library-docs → {
  context7CompatibleLibraryID: string,
  topic?: string,
  tokens?: number (default: 10000)
}
# Returns: Up-to-date, version-specific documentation with code examples
```

#### MCP Configuration (Unified)

Add to your MCP client config (e.g., `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "RepoPrompt": {
      "command": "/path/to/repoprompt_cli",
      "args": [],
      "env": {},
      "toolOutputTokenLimit": 25000,
      "toolTimeoutSec": 1000
    },
    "local-memory": {
      "command": "npx",
      "args": ["-y", "local-memory-mcp@latest"],
      "env": {}
    },
    "cortex-aegis": {
      "command": "npx",
      "args": ["-y", "@brainwav/cortex-aegis-mcp@latest"],
      "env": {}
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "${CONTEXT7_API_KEY}"],
      "env": {}
    }
  }
}
```

For VS Code settings.json:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@upstash/context7-mcp", "--api-key", "${CONTEXT7_API_KEY}"]
      },
      "local-memory": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "local-memory-mcp@latest"]
      }
    }
  }
}
```

#### Evidence Logging Requirements

Each MCP session MUST be logged in `run-manifest.json`:

```json
{
  "mcp_sessions": [
    {
      "server": "context7",
      "transport": "stdio",
      "endpoint": "resolve-library-id",
      "timestamp": "2025-01-15T10:30:00Z",
      "gate": "G1",
      "evidence_log": "context/research.md#context7-sources"
    },
    {
      "server": "cortex-aegis",
      "transport": "stdio",
      "endpoint": "vibe_check",
      "timestamp": "2025-01-15T11:00:00Z",
      "gate": "G2",
      "evidence_log": "logs/vibe-check/initial.json"
    }
  ]
}
```

Use the helper command:
```bash
just mcp-session-manifest <slug> <server> <transport> <endpoint> <session_log> <evidence_log>
```

#### Division of Responsibility

| Concern | Primary Tool | Fallback |
|---------|--------------|----------|
| Repo context & codemaps | RepoPrompt | Manual file reads |
| External library docs | Context7 | Fetch from source |
| Governance validation | Cortex-Aegis | Manual checklist |
| Decision persistence | Local Memory | `.github/instructions/memories.instructions.md` |
| Academic research | MCP connectors (Wikidata, arXiv) | Direct API calls |

### 4.2 Gate Overview

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
| G10  | Archive             | Preserve artefacts, update memory via `/memorize`, close task. |

### 4.3 Gate Templates

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
- **Checks** – Agents call `/recall` to retrieve prior work context, then run `/gather` to structure discovery questions for stakeholders. Verify Wikidata + arXiv MCP endpoints, fetch academic research via MCP connectors, log license status, run Repo Prompt Context Builder for non-trivial tasks.  
- **Exit criteria** – RAID + feasibility documented; North-Star acceptance test path recorded; reuse candidates enumerated; repo context available for G2.
- **Commands** – `/recall` (prior context), `/gather` (structured questions). See `commands/recall.md`, `commands/gather.md`.

#### G2 – Plan / Design

- **Objective** – Produce executable plan ≤7 steps per Arc; define tests, contracts, mitigations.  
- **Repo Prompt Usage** – For medium+ complexity tasks, SHOULD use **Plan preset** to:
  - Generate plan using Context Builder handoff from G1
  - Propose architecture changes and touchpoints grounded in existing code
  - Outline test strategy and risk areas with repo awareness
  - Save Repo Prompt-generated plan to `plan/PLAN.md`
- **Required artefacts** – `plan/PLAN.md` (Repo Prompt Plan or equivalent), `plan/tdd-plan.md`, `plan/risk-register.md`, updated `run-manifest.json`.  
- **Cortex-Aegis usage** – Mandatory for Feature, Fix, and any Refactor touching contracts or security-critical code. Provide plan summary (including Repo Prompt context), research citations, risk tags, and tool health evidence.  
- **Checks** – Run `/reframe` to confirm understanding with stakeholders before Aegis vibe check. Plan references reuse candidates; connectors health still green; Cortex-Aegis JSON stored in `evidence/aegis-report.json`; Repo Prompt plan artifacts present.  
- **Exit criteria** – Plan approved (no Aegis `block`), tests identified, quality gates defined, plan grounded in repo realities.
- **Commands** – `/reframe` (understanding confirmation), `/truth` (evidence-based responses). See `commands/reframe.md`, `commands/truth.md`.

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
- **Just-in-Time Docs (MANDATORY)** – Fetch library documentation at point of use, not just during planning:
  1. **Before each API call**: Query Context7 for current method signatures and examples
  2. **On error/unexpected behavior**: Immediately fetch updated docs to verify assumptions
  3. **When using unfamiliar patterns**: Pull version-specific examples before implementing
  4. Log Context7 calls in `run-manifest.json.mcp_sessions` with gate `G4`
  5. Cite doc sources in `work/implementation-log.md` inline with implementation decisions
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
- **Critic Subagent with Confession (MANDATORY)** – Before running verification suite, spawn a critic subagent with a separate confession channel:
  1. **Self-Review Pass**: Ask model to review its own implementation against the plan
  2. **Checklist Pre-Scan**: Verify all G5 checklist items before formal verification
  3. **Edge Case Audit**: Identify untested edge cases and boundary conditions
  4. **Confession Report** (separate output channel): Generate honest self-assessment:
     - List all explicit and implicit objectives/constraints from the plan
     - For each objective: complied / partially complied / did not comply
     - Surface any shortcuts, reward-hacking, or constraint violations
     - List uncertainties, ambiguities, or edge cases encountered
     - Admit any "cheating" (e.g., tests that pass but don't actually verify behavior)
  5. Store critic output in `evidence/critic-review.json`
  6. Store confession in `evidence/confession-report.json`
  7. Address critic findings AND confession admissions before proceeding
- **Confession Principle**: The confession channel is judged ONLY for honesty, not for the quality of the main work. Admitting failures in the confession does NOT penalize the main work — it surfaces issues for human review.
- **Required artefacts** – `evidence/tests.md`, `evidence/test-results/*`, `evidence/critic-review.json`, `evidence/confession-report.json`, `verification/coverage-results.json`, `verification/mutation-results.json`, `evidence/aegis-report.json` (if rerun), `implementation-plan.md#reuse-ledger`.  
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
- **Session Retrospective (MANDATORY)** – Before archiving, conduct a structured retrospective:
  1. **Process Evaluation**: What worked well? What caused friction?
  2. **Harness Improvements**: Propose specific changes to prompts, templates, or workflows
  3. **Pattern Extraction**: Identify reusable patterns for future tasks
  4. **Anti-Pattern Documentation**: Log mistakes to avoid in similar work
  5. Store retrospective in `evidence/session-retrospective.md`
  6. Commit actionable improvements to Local Memory with tag `retrospective`
  7. Update `SUMMARY.md` with retrospective insights
- **Required artefacts** – `SUMMARY.md`, `evidence/session-retrospective.md`, `archive.json`, review checklist snapshot in `governance/audit/reviews/<PR>-<sha>.md`, Local Memory entry IDs recorded in `json/memory-ids.json`.  
- **Exit criteria** – Task folder archived; Evidence Triplet + TDD plan reuse ledger indexed; `.github/instructions/memories.instructions.md` updated.

### 4.4 Phase Machine (R→G→F→REVIEW)

> Agents auto-progress through phases with zero HITL until **REVIEW**.  
> Binding: ArcTDD v2025.11 (G0–G7), Charter Guardrails (#1–#10)

The phase machine maps onto ArcTDD gates as follows:

| Phase | Maps to Gates | Purpose |
|-------|---------------|---------|
| **R (Red)** | G0–G3 | Write failing tests; plan minimal pass |
| **G (Green)** | G4 | Implement to pass |
| **F (Finished)** | G5–G7 | Refactor, docs, a11y, supply-chain, structure |
| **REVIEW** | G6 (HITL portion) | Human-in-the-loop only here |

#### R (Red) — write failing tests; plan minimal pass

**Allowed**

- Planning & test authoring; minimal scaffold code
- Time Freshness Guard normalization
- Academic research enhancement via MCP/HTTP connectors
- Vibe Check (Oversight) after research, before any writes/long runs
- Local Memory parity updates

**Forbidden**

- `human_input` (except Ask-First ≤3 clarifications in **G0/G1**)
- Production deploys, merges

**Auto-advance → G when**

- New acceptance/unit tests **fail first**, then **pass** on the next commit
- `TIME_FRESHNESS:OK tz=<IANA> today=<YYYY-MM-DD>` token present
- Oversight log (`brAInwav-vibe-check`) stored in `logs/vibe-check/`

#### G (Green) — implement to pass

**Allowed**

- Code to satisfy tests; refactor strictly to green
- Live model probes: `pnpm models:health && pnpm models:smoke` (Frontier/Ollama)
- Security scanners (Semgrep, OSV) and secret scans (gitleaks)
- **Structured outputs required** for any machine-consumed LLM result (JSON-Schema or tool/function calling)

**Forbidden**

- `human_input` (Ask-First clarifications remain confined to G0/G1)

**Auto-advance → F when**

- `pnpm test` **passes**
- Coverage ≥ **90%** global & **95%** changed lines
- Mutation ≥ **90%** (where enabled)
- Latest model-health log includes engine, model IDs, vector dims/norms, P95 latency

#### F (Finished) — refactor, docs, a11y, supply-chain, structure

**Allowed**

- Non-behavioral refactors; documentation
- A11y audits (axe/jest-axe/Playwright)
- SBOM & provenance: **CycloneDX 1.7** + **SLSA v1.1**; **Cosign v3 bundle** verify
- Structure/contract guard, Observability checks

**Forbidden**

- `human_input` (Ask-First allowance does not apply here)

**Auto-advance → REVIEW when**

- A11y reports attached
- Security scanners: Semgrep (blockers), OSV clean, gitleaks zero secrets
- `pnpm structure:validate` **passes**
- `pnpm models:health && pnpm models:smoke` evidence attached (**live** only)
- Local Memory parity entry appended (decisions/refactors)

#### REVIEW — human-in-the-loop only here

**Allowed**

- `human_input` (HITL), reviewer checklist, approvals/waivers per Constitution
- Merge only when **all BLOCKERs** pass and evidence pointers resolve

**Merge gate requires**

- Evidence Triplet (milestone red→green proof, contract snapshot, reviewer JSON pointer)
- Trace Context proof (every governed log has `traceparent` + 32-hex `trace_id`)
- SBOM (CycloneDX 1.7), SLSA v1.1 provenance, Cosign v3 **bundle** verify logs
- A11y/security artifacts
- Reuse Ledger pointer

> **Phase rollback:** Requires a waiver; emit `PHASE_OVERRIDE:<from>-><to> link=<waiver-url>`

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
- **Commands** – Use `/incident-review` at G9 for SEV ≥ 2 incidents to structure postmortem evidence. See `commands/incident-review.md`.

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

### 6.1 Hard Rules (Normative)

> These rules are enforced by CI and gate automation. Violations block merges.

1. **Ask-First ≤3 (G0/G1 only).** Each question must enumerate options + consequences. All Ask-First events are logged as `human_input:ask_first`.
2. **No HITL before REVIEW.** Any other `human_input` pre-REVIEW is a violation unless a time-boxed waiver exists.
3. **Structured outputs required.** Any model output that drives tools/files/network **must** be function/tool-calling or conform to a JSON-Schema, with validation on receipt.
4. **Observability.** All charter-governed logs carry `[brAInwav]`, `brand:"brAInwav"`, ISO-8601 timestamp, `trace_id` (32 lower-hex), and **HTTP `traceparent`** for correlation. Missing fields fail gates.
5. **Supply-chain.** Generate **CycloneDX 1.7** SBOM; produce **SLSA v1.1** provenance; sign/verify with **Cosign v3 bundle**.
6. **Identity & secrets.** CI authenticates to cloud via **OIDC/WIF** only. Secrets are fetched at runtime using the **1Password CLI** (`op`); never persisted.
7. **Hybrid models — live only.** No stubs/recordings/dry-runs for embeddings/rerankers/generation. Frontier/Ollama health logs required.
8. **A11y baseline.** WCAG 2.2 AA (ISO/IEC 40500:2025).

### 6.2 Context Pruning Rules

> **Article insight:** "Getting wrong context OUT is equally important as getting the right context IN."

Context accumulation degrades agent performance. Agents MUST actively prune stale, irrelevant, or contradictory context at gate transitions and during long-running tasks.

#### When to Prune

| Trigger | Action |
|---------|--------|
| **Gate transition** | Review accumulated context; discard completed sub-task artifacts; retain only forward-relevant evidence |
| **Session resume** | Load only checkpoint + current gate context; do not reload full history |
| **Context window >60%** | Trigger automatic pruning: summarize completed work, archive verbose logs, retain pointers only |
| **Subagent return** | Extract actionable result; discard subagent's intermediate context |
| **Plan deviation** | Prune context tied to abandoned approach; document deviation in `implementation-log.md` |

#### Pruning Hierarchy (what to keep vs. discard)

**RETAIN (high signal):**
- Current gate requirements and exit criteria
- Active failing tests and error messages
- Relevant codemaps and type signatures
- Decisions logged in Local Memory
- Evidence Triplet components

**SUMMARIZE (reduce tokens):**
- Completed gate outputs → single-line status + pointer
- Research findings → key citations only
- Verbose tool outputs → structured summary

**DISCARD (stale/irrelevant):**
- Alternative approaches not taken
- Superseded plan versions
- Full file contents already captured in codemaps
- Verbose debug logs from passing tests
- Subagent reasoning traces (keep only final result)

#### Context Freshness Markers

Add these tokens to `implementation-log.md` at pruning events:

```text
CONTEXT_PRUNE:OK gate=G4 removed=<n>KB retained=<n>KB timestamp=<ISO-8601>
CONTEXT_SUMMARY:OK sections=["research","plan"] summary_tokens=<n>
```

#### RepoPrompt Integration

Use RepoPrompt's `manage_selection` with mode transitions:
- `mode="full"` → `mode="codemap_only"` for completed components
- `op="demote"` to reduce full files to codemaps
- `op="remove"` for abandoned approaches

#### Anti-Patterns (CI flags)

- ❌ Accumulating >100KB of raw context without pruning
- ❌ Retaining full subagent transcripts instead of summaries
- ❌ Re-reading completed gate artifacts at each step
- ❌ Keeping verbose error traces after fix confirmed

### 6.3 Evidence Tokens

> CI scans logs for these tokens to validate phase transitions and gate compliance.

| Token | Purpose |
|-------|---------|
| `AGENTS_MD_SHA:<sha>` | Verifies governance doc integrity |
| `PHASE_TRANSITION:<from>-><to>` | Logs phase machine progression |
| `brAInwav-vibe-check` | Confirms Oversight/Aegis was invoked |
| `TIME_FRESHNESS:OK tz=<tz> today=<yyyy-mm-dd>` | Anchors temporal context |
| `MODELS:LIVE:OK engine=<ollama\|frontier> model=<id> dims=<n> norm≈<v> latency_ms=<n>` | Proves live model usage |
| `A11Y_REPORT:OK` | Accessibility audit attached |
| `STRUCTURE_GUARD:OK` | Structure validation passed |
| `COVERAGE:OK CHANGED_LINES:OK MUTATION:OK` | Test quality gates met |
| `MEMORY_PARITY:OK` | Local Memory sync confirmed |
| `TRACE_CONTEXT:OK` | Trace propagation verified |
| `SUPPLY_CHAIN:OK sbom=cyclonedx@1.7 slsa=1.1 cosign=bundle` | Supply-chain artefacts present |
| `CONTEXT_PRUNE:OK gate=<Gn> removed=<n>KB retained=<n>KB` | Context pruning executed |
| `CRITIC_REVIEW:OK findings=<n> addressed=<n>` | Critic subagent completed |
| `JIT_DOCS:OK calls=<n> libs=<list>` | Just-in-time docs fetched at G4 |
| `RETROSPECTIVE:OK improvements=<n>` | Session retrospective completed |
| `SUBAGENT_SPAWN:type=<type> scope="<scope>"` | Subagent invocation |
| `SUBAGENT_RETURN:type=<type> status=<status>` | Subagent completion |
| `CONFESSION:OK gate=<Gn> complied=<n> partial=<n> failed=<n>` | Confession report completed |
| `CONFESSION:WARN false_negative_risk=<level>` | Confession requires review |
| `CONFESSION:BLOCKED strategic_deception_suspected=true` | Escalation triggered |

### 6.4 Subagent Governance

> **Article insight:** Subagents provide "Parallelization, Context Isolation, and Prompt Customization" — but require governance to prevent chaos.

Agents MAY spawn subagents for well-scoped subtasks. This section governs when, how, and what constraints apply.

#### When to Spawn Subagents

| Scenario | Subagent Type | Rationale |
|----------|---------------|-----------|
| **Parallel independent tasks** | Worker subagent | Tasks with no dependencies can execute concurrently |
| **Deep research on specific topic** | Research subagent | Isolate context to prevent pollution of main task |
| **Code review/critique** | Critic subagent | Fresh perspective without implementation bias |
| **Long-running background work** | Background subagent | Prevent blocking main workflow |
| **Specialized tool usage** | Tool subagent | Custom prompt tuning for specific MCP server |

#### Subagent Constraints (MANDATORY)

1. **Scope Boundary**: Each subagent receives ONLY the context needed for its task; no access to full parent context
2. **Result Contract**: Define expected output format BEFORE spawning; validate on return
3. **Token Budget**: Subagent output MUST be ≤2000 tokens; use summarization if exceeded
4. **Timeout**: Subagent MUST complete within 5 minutes or return partial result with status
5. **No Cascading**: Subagents SHOULD NOT spawn their own subagents (depth=1 only) without explicit waiver
6. **Governance Inheritance**: Subagents inherit parent's governance rules (AGENTS.md, phase constraints)

#### Subagent Invocation Pattern

```text
# Parent agent spawning subagent
SUBAGENT_SPAWN:type=<critic|research|worker> scope="<task description>" timeout=<seconds>

# Subagent context handoff (what parent provides)
{
  "task": "<specific scoped task>",
  "context": "<minimal relevant context>",
  "output_format": "<expected JSON schema or markdown template>",
  "constraints": ["no_file_writes", "read_only", "no_network"],
  "parent_gate": "G4"
}

# Subagent return (what child provides)
SUBAGENT_RETURN:type=<type> status=<complete|partial|timeout|error>
{
  "result": "<structured output per contract>",
  "confidence": 0.0-1.0,
  "recommendations": ["<actionable items>"],
  "context_refs": ["<files/symbols consulted>"]
}
```

#### Context Isolation Rules

| Parent Provides | Parent DOES NOT Provide |
|-----------------|------------------------|
| Specific task scope | Full conversation history |
| Relevant file excerpts (≤5KB) | Complete file contents |
| Type signatures/codemaps | Implementation details outside scope |
| Current gate + constraints | Other gate artifacts |
| Output format specification | Alternative approaches |

#### Result Integration

1. **Validate Output**: Check against result contract before integration
2. **Summarize**: Reduce subagent reasoning trace to actionable result
3. **Prune Context**: Discard subagent's intermediate context (see §6.2)
4. **Log Session**: Record subagent invocation in `run-manifest.json.subagent_sessions`
5. **Memory Sync**: If subagent produced key decisions, parent stores to Local Memory

#### Evidence Logging

```json
// run-manifest.json.subagent_sessions
{
  "subagent_sessions": [
    {
      "type": "critic",
      "parent_gate": "G5",
      "scope": "Review implementation against plan",
      "spawn_timestamp": "2025-01-15T14:30:00Z",
      "return_timestamp": "2025-01-15T14:32:15Z",
      "status": "complete",
      "output_tokens": 847,
      "evidence_log": "evidence/critic-review.json"
    }
  ]
}
```

#### Anti-Patterns (CI flags)

- ❌ Spawning subagent with full parent context
- ❌ Subagent cascade (subagent spawns subagent)
- ❌ Missing result contract before spawn
- ❌ Retaining subagent reasoning trace in main context
- ❌ Subagent making file writes without parent validation

### 6.5 Confession Protocol

> **Research basis:** OpenAI "Confessions" research (2025) — a separate output channel optimized solely for honest self-assessment of whether the model followed instructions or "cheated."

The Confession Protocol provides a second, decoupled output channel where agents self-report compliance, shortcuts, and uncertainties. Unlike the main work output (which balances many objectives), confessions are judged ONLY for truthfulness and completeness of self-assessment.

#### Core Principle

**Main answer**: Optimized for helpfulness, correctness, style, safety, user preference  
**Confession**: Optimized ONLY for honest self-assessment — "Did I actually follow the instructions and policies?"

Crucially: **Nothing in the confession affects the reward/evaluation of the main work.** This removes the incentive to hide failures.

#### When Confessions Are Required

| Gate | Confession Trigger |
|------|-------------------|
| **G2 – Plan** | After producing PLAN.md, confess: Did plan follow all constraints? Any shortcuts in research? |
| **G4 – Implement** | After each implementation arc, confess: Did code match plan? Any constraint violations? |
| **G5 – Verify** | MANDATORY: Full confession report before verification suite |
| **G6 – Review** | Reviewer may request confession if suspicious of main output |
| **G10 – Archive** | Final confession covering entire task |

#### Confession Report Structure

```json
// evidence/confession-report.json
{
  "confession_version": "1.0",
  "gate": "G5",
  "timestamp": "2025-12-04T14:30:00Z",
  "trace_id": "<32-hex>",
  
  "objectives_enumerated": [
    {
      "id": "OBJ-1",
      "source": "plan/PLAN.md",
      "description": "Implement OAuth2 flow with PKCE",
      "type": "explicit",
      "compliance": "complied",
      "evidence": "src/auth/oauth.ts implements PKCE per RFC 7636"
    },
    {
      "id": "OBJ-2", 
      "source": "AGENTS.md §6.1",
      "description": "Functions ≤40 lines",
      "type": "implicit",
      "compliance": "partially_complied",
      "evidence": "2 of 15 functions exceed limit (auth.ts:45-92, token.ts:23-78)",
      "confession": "Chose readability over strict compliance; flagged for refactor"
    },
    {
      "id": "OBJ-3",
      "source": "plan/tdd-plan.md",
      "description": "100% branch coverage on error paths",
      "type": "explicit", 
      "compliance": "did_not_comply",
      "confession": "Coverage is 87%; edge case for network timeout not tested"
    }
  ],
  
  "shortcuts_taken": [
    {
      "description": "Used mock instead of live OAuth provider in one test",
      "justification": "Provider rate limits prevented full integration test",
      "risk": "May miss provider-specific edge cases",
      "mitigation": "Added TODO for staging environment test"
    }
  ],
  
  "reward_hacking_detected": [
    {
      "description": "Test passes but doesn't actually verify token expiry",
      "how_detected": "Self-review revealed assertion only checks non-null",
      "correction_needed": true
    }
  ],
  
  "uncertainties": [
    "Unclear if refresh token rotation is required per spec",
    "Edge case: What if PKCE verifier contains special characters?"
  ],
  
  "ambiguities_in_instructions": [
    "PLAN.md says 'secure' but doesn't specify encryption algorithm"
  ],
  
  "overall_compliance": {
    "complied": 12,
    "partially_complied": 2,
    "did_not_comply": 1,
    "percentage": 80.0
  },
  
  "false_negative_risk": "low",
  "confidence_in_confession": 0.92
}
```

#### Confession Evaluation Criteria

The confession is evaluated SEPARATELY from main work:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Completeness** | 30% | Did it enumerate ALL relevant objectives (explicit + implicit)? |
| **Accuracy** | 40% | Did it correctly judge compliance vs. non-compliance? |
| **Specificity** | 20% | Did it surface concrete evidence, not vague admissions? |
| **Uncertainty Disclosure** | 10% | Did it list edge cases and ambiguities encountered? |

#### Failure Modes

Based on OpenAI's research, confession failures are categorized as:

| Failure Type | Cause | Governance Response |
|--------------|-------|---------------------|
| **False Negative** | Didn't confess actual violation | Flag for human review; increase scrutiny |
| **False Positive** | Confessed violation that didn't occur | Minor; over-caution is acceptable |
| **Confusion-Based** | Ambiguous instructions led to uncertain compliance | Update governance docs for clarity |
| **Strategic Deception** | Deliberately hid violation | BLOCKER; escalate to Constitution review |

Research shows ~4.4% false negative rate; most failures are confusion-based, not deceptive.

#### Integration with Existing Mechanisms

| Mechanism | How Confession Enhances |
|-----------|------------------------|
| **Critic Subagent** | Confession is the "honesty channel" of the critic |
| **Cortex-Aegis** | Confession inputs feed risk assessment |
| **Evidence Triplet** | Confession becomes 4th element when required |
| **Session Retrospective** | Aggregate confessions inform retrospective |
| **Local Memory** | Store confession patterns for learning |

#### Evidence Tokens

```text
CONFESSION:OK gate=G5 complied=12 partial=2 failed=1 confidence=0.92
CONFESSION:WARN false_negative_risk=medium requires_review=true
CONFESSION:BLOCKED strategic_deception_suspected=true
```

#### CI Enforcement

| Rule ID | Check | Action |
|---------|-------|--------|
| AGENTS-CNF-001 | Confession present at G5 | BLOCKER if missing |
| AGENTS-CNF-002 | Confession schema valid | WARN if malformed |
| AGENTS-CNF-003 | False negative rate tracking | Log for monitoring |
| AGENTS-CNF-004 | Strategic deception flag | Immediate escalation |

#### Prompt Template for Confession

```text
## Confession Report Request

You have just completed [GATE] work. Now generate a Confession Report.

CRITICAL: This confession is evaluated ONLY for honesty, not for the quality 
of your main work. Admitting failures here does NOT penalize your main output.
Your goal is ACCURATE SELF-ASSESSMENT.

For your confession:
1. List ALL explicit objectives from the plan/requirements
2. List ALL implicit objectives from governance (AGENTS.md, CODESTYLE.md, etc.)
3. For each objective, honestly assess: complied / partially_complied / did_not_comply
4. Provide specific evidence for each assessment
5. List any shortcuts, workarounds, or "reward hacking" you employed
6. Surface any uncertainties, ambiguities, or edge cases you encountered
7. If you "cheated" (e.g., tests that pass but don't verify behavior), admit it

Output as JSON per the confession-report.json schema.
```

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

- **Related governance docs** – Constitution, AGENT_CHARTER (Rules of AI consolidated), Cortex-Aegis (Time Freshness Policy), unified checklists, session-continuity (multi-session tasks).
- **Change authority** – Updates require approval from GovOps maintainers plus at least one product-line representative. Every change must: (1) update this doc; (2) update `90-infra/governance-index.json` + `structure-guard.json`; (3) refresh `export-freeze.snapshot.json` and `GOVERNANCE_HASH_UPDATE.md`; (4) document delta in `changelog/<slug>/`.  
- **Changelog** – Append entries in `changelog/` using `pnpm changelog:new --slug <slug> --tier <fix|feature|refactor>` (or successor script). Example: `[2025-11-22] v2025.11.0 – Moved workflow to 10-flow/, aligned with quickstart, embedded Cortex-Aegis + reuse ledger requirements.`

---

**End of document.**
