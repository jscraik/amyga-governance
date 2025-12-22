# AI-Native Agentic Governance Quickstart

> One-page front door for humans and agents. Start here before diving into the deeper governance docs.

---

## Table of Contents

- [1. Purpose & Audience](#1-purpose--audience)
- [2. Core Principles (AI-Native, Human-Owned)](#2-core-principles-ai-native-human-owned)
- [3. SDLC → ArcTDD → Flow Map](#3-sdlc--arctdd--flow-map)
- [4. Standard Flows (5 Canonical Workflows)](#4-standard-flows-5-canonical-workflows)
- [5. Roles & Responsibilities](#5-roles--responsibilities-delegate--review--own)
- [6. Assurance System in the Loop](#6-assurance-system-in-the-loop)
- [7. Checklists & CI Integration](#7-checklists--ci-integration)
- [8. Where to Go Next (References)](#8-where-to-go-next-references)
- [9. Project-Specific Workflow Configuration](#9-project-specific-workflow-configuration)

---

## 1. Purpose & Audience

**What this is**: The operational "how we work with agents" guide for AI-assisted development. This document provides the essential workflow patterns, gate policies, and responsibilities for AI-native software development.

**Who it is for**:

- Human engineers, reviewers, and maintainers
- Agent presets (Codex CLI, Claude Code, VS Code / Qoder, ChatGPT agents, etc.)
- CI/CD systems and automated tooling
- External contributors and collaborators

**What it is not**: This is not the full Constitution or detailed technical specifications; it points to the canonical governance docs and provides practical workflow guidance.

---

## 2. Core Principles (AI-Native, Human-Owned)

- **Agents do first-pass implementation**, humans own **direction and merge decisions**
- Every change flows through **task folders** and **ArcTDD gates** (G0-G10)
- Evidence is mandatory: **tests, logs, and review artifacts** (Evidence Triplet)
- Governance is **code-like**: versioned, enforced, and auditable
- **North-Star Test**: Every change must pass the "does this advance the mission?" check
- **JEDI principles**: Just, Ethical, Diverse, Inclusive development practices
- **Assurance System integration**: Validates plans and changes against governance

**Detailed foundations**:

- [Constitution](../00-core/constitution.md) - Core law and principles
- [Agent Charter](../00-core/AGENT_CHARTER.md) - Agent behavior and responsibilities

---

## 3. SDLC → ArcTDD → Flow Map

### 3.1 SDLC Phases

1. **Plan** - Requirements, acceptance criteria, task folder creation
2. **Design** - Architecture, research, risk assessment
3. **Build** - Implementation, testing, documentation
4. **Test** - Validation, security, performance verification
5. **Review** - Code review, governance compliance, evidence validation
6. **Deploy** - Integration, monitoring, rollback planning

### 3.2 ArcTDD Gates (G0–G10)

- **G0-G2**: Foundation (Security, Build, Tests)
- **G3-G4**: Integration (Observability, Interfaces)
- **G5-G7**: Quality (E2E, Accessibility, Documentation)
- **G8-G10**: Deployment (Release, Production, Monitoring)

### 3.3 Flow Selection Matrix

| SDLC Phase | ArcTDD Gates | Recommended Flow |
|------------|--------------|------------------|
| Plan → Design | G0-G1 | Research / Spike Flow |
| Design → Build | G1-G3 | Feature Implementation Flow |
| Build (Bugs) | G1-G4 | Fix Implementation Flow |
| Build (Cleanup) | G1-G4 | Refactor / Cleanup Flow |
| Test → Review | G4-G7 | Code Review Flow |
| Review → Deploy | G7-G10 | (Follow deployment runbooks) |

---

## 4. Standard Flows (5 Canonical Workflows)

### 4.1 Feature Implementation Flow

**When to use**: New feature / capability work

**Steps**:

1. Create task folder and register North-Star acceptance criteria
2. Run repo context sweep and write `research.md`
3. Draft `PLAN.md` / `implementation-plan.md` (agent first, human review)
4. Call **Cortex-Aegis** to validate the plan vs governance + external evidence
5. Implement code + tests (agent first-pass under JEDI rules)
6. Run tests, a11y, security checks, and any extra Aegis requirements
7. Submit PR with Evidence Triplet and link to task folder

**Evidence required**: PLAN.md, tests, logs, Aegis verdict, task folder artifacts

### 4.2 Research / Spike Flow

**When to use**: Exploration, feasibility, academic research, design spikes

**Steps**:

1. Context sweep, research queries, academic source validation
2. Run Cortex-Aegis for research validity / time-freshness
3. Produce `research.md` and recommended next steps
4. Store findings in task folder with provenance links

**Outputs**: Decision memo, research summary; no code changes required

### 4.3 Fix Implementation Flow (Bug / Incident)

**When to use**: Reproducible bug, incident, or regression

**Steps**:

1. Capture bug details and create task folder
2. Produce reproducible steps and add failing test
3. Draft minimal fix plan and run Aegis if risk is non-trivial
4. Implement fix, then ensure failing test now passes
5. Verify no collateral regressions (smoke / regression tests)

**Evidence**: Reproducer, failing → passing test, logs/traces, Aegis verdict when used

### 4.4 Refactor / Cleanup Flow

**When to use**: Internal quality improvements without behavior change

**Steps**:

1. Identify invariants and current behavior (tests, tracing)
2. Draft refactor plan and risk assessment
3. Apply refactor with strong tests and observability checks
4. Validate performance and behavior baselines maintained

**Evidence**: Before/after tests, performance/behavior baselines, invariant preservation

### 4.5 Code Review Flow

**When to use**: Every PR, including agent-authored ones

**Participants**:

- AI reviewer neuron (read-only analysis)
- Human reviewer (merge authority)

**Steps**:

1. Run AI review with checklist validation
2. Human reviews AI findings + diff + Evidence Triplet
3. Disposition all findings (accept, reject, follow-up)
4. Verify gate compliance and merge authorization

**Evidence**: Review JSON from reviewer neuron, human comments and decisions

---

## 5. Roles & Responsibilities (Delegate / Review / Own)

### 5.1 Planning & Design

| Phase | Agent (Delegate) | Human (Review) | Human (Own) |
|-------|------------------|----------------|-------------|
| Requirements | Draft acceptance criteria | Validate completeness | Final approval |
| Research | Execute research, gather sources | Validate findings | Direction decisions |
| Architecture | Propose design options | Technical review | Architecture decisions |

### 5.2 Build & Test

| Phase | Agent (Delegate) | Human (Review) | Human (Own) |
|-------|------------------|----------------|-------------|
| Implementation | First-pass code + tests | Code quality review | Design decisions |
| Testing | Test automation, coverage | Test strategy review | Quality gates |
| Documentation | Draft docs, examples | Technical accuracy | Content approval |

### 5.3 Review, Documentation & Deployment

| Phase | Agent (Delegate) | Human (Review) | Human (Own) |
|-------|------------------|----------------|-------------|
| Code Review | Automated analysis | Review findings | Merge decisions |
| Documentation | Content generation | Accuracy validation | Publication approval |
| Deployment | Execution automation | Health monitoring | Production decisions |

---

## 6. Assurance System in the Loop

**What the Assurance System is**: A validation system for agentic workflows that validates plans and changes against governance, security, and compliance requirements.

**When to call it**:

- Before major builds (feature/fix implementation)
- For high-risk changes (security, privacy, compliance, infrastructure)
- For research validity and time-freshness checks
- When governance compliance is uncertain

**What it consumes**:

- Implementation plans, research summaries, risk tags
- Time-freshness context and academic sources
- Governance policy references and compliance requirements

**What it returns**:

- JSON verdict (pass / warn / block) with detailed reasoning
- Required follow-ups and mitigation actions
- Compliance evidence and audit trail

---

## 7. Checklists & CI Integration

This quickstart connects to comprehensive checklists in:

- [Unified Checklists](../20-checklists/checklists.md)

**Integration approach**:

- Local runs, PRs, and CI jobs all reference the same checklist source
- Failing checklist items block gate progression (G5+)
- Evidence requirements are enforced at each gate
- Automated validation where possible, human verification for judgment calls

---

## 8. Where to Go Next (References)

### Foundational Law

- [Constitution](../00-core/constitution.md) - Core principles and governance framework
- [Agent Charter](../00-core/AGENT_CHARTER.md) - Agent behavior, skills, and risk controls (consolidates Rules of AI)

### Operational Details

- [Agentic Coding Workflow](../10-flow/agentic-coding-workflow.md) - Complete workflow specification
- [Assurance System](../10-flow/assurance-system.md) - Assurance system documentation
- [Time Freshness Policy](../10-flow/assurance-system.md#time-freshness-policy) - Time-sensitive validation rules

### Checklists & Quality

- [Unified Checklists](../20-checklists/checklists.md) - All quality gates and validation criteria

### Infrastructure

- [Governance Infrastructure](../90-infra/) - Machine-readable governance files and automation

---

<!-- PROJECT-SPECIFIC: START -->
## 9. Project-Specific Workflow Configuration

> **Instructions:** Add project-specific workflow tweaks, custom gates, or additional requirements here. This section is NOT overwritten when upgrading the governance pack.

### Custom Gates

<!-- Define any project-specific gates beyond G0-G10 -->

| Gate | Name | Requirements |
|------|------|-------------|
| _none_ | — | — |

### Project Flow Overrides

<!-- Document any project-specific flow modifications (tighten only, cannot weaken) -->

### Additional Tools & Integrations

<!-- List project-specific tools that integrate with the governance workflow -->

| Tool | Purpose | Integration Point |
|------|---------|------------------|
| _none_ | — | — |

<!-- PROJECT-SPECIFIC: END -->
