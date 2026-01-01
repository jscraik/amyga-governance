---
summary: "Governance structure and document hierarchy."
read_when: "Design or integration questions"
applies_to: "core"
owner: "Governance Team"
---

# Architecture

The brAInwav Agentic Governance Framework is a modular control framework with a fast local loop and strict merge/release gates. It is document-driven with optional MCP tooling and GitHub Actions adapters.

## Governance Hierarchy

1. **Governance Pack** (`brainwav/governance/*`) – Constitution, charter, workflows, checklists
2. **CODESTYLE.md** – Enforced coding and architectural rules
3. **Root AGENTS.md** – Repository-wide agent instructions
4. **Nearest package AGENTS.md** – May tighten rules, never weaken

## Directory Structure

```
brainwav/governance/
├── 00-core/          # Constitution, charter, threat controls, skills policy
├── 10-flow/          # Agentic coding workflow, assurance, session continuity
├── 20-checklists/    # Unified reviewer + gate checklists
├── 30-compliance/    # EU AI Act, standards mapping
├── 90-infra/         # Governance index, structure guards, schemas
├── commands/         # Executable commands (memorize, recall, daily-summary)
├── context/          # Research references and how-to guides
├── docs/             # Extended documentation (this folder)
├── runbooks/         # Incident and operational procedures
└── templates/        # Feature, research, TDD plan templates
```

## Core + Packs + Adapters

**Core (mandatory everywhere)**  
- AGENTS.md + step budget + evidence triplet + hash index  
- Creative vs Delivery modes (local speed vs merge-time rigor)  
- AI risk controls enabled by default  
- Control registry schema and core control set

**Capability packs (opt-in, versioned)**  
- `security-appsec` (OWASP Top 10:2025, ASVS 5.0.0 mappings)  
- `supply-chain` (SLSA provenance, SBOM, signing, Scorecard)  
- `a11y` (WCAG 2.2 + test gates)  
- `ai-risk` (OWASP LLM Top 10 + NIST AI RMF/GenAI Profile)  
- `compliance-overlays` (EU AI Act / ISO 42001 mappings)

**Adapters (how it runs)**  
- GitHub Actions templates (default, including pack-specific workflows)  
- Stack adapters (Node/Python/Go/iOS) that only change *commands*, not policy text

Pack manifests live under `brainwav/governance-pack/packs/` and are merged into rendered outputs for CI.

## Task Folder Structure

Each governed task produces evidence in a structured folder:

```
tasks/<slug>/
├── context/          # Research, requirements, connector health
├── plan/             # PLAN.md, risk register, TDD plan
├── work/             # Implementation log
├── evidence/         # Tests, critic review, aegis report
├── logs/             # Vibe check, academic research
├── json/             # Run manifest, memory IDs, baton
└── SUMMARY.md        # Task summary and retrospective
```

## MCP Integration

Optional MCP servers extend governance automation:

- **Cortex Aegis** (port 2091) – Oversight gate, vibe checks
- **Local Memory** (port 3002) – Persistent context store
- **Context7** – Library documentation retrieval
- **RepoPrompt** – Context building and planning

## Control Registry (Controls-as-Data)

Controls are defined as data in the control catalog `brainwav/governance/90-infra/control-registry.core.yaml` and validated by `control-registry.schema.json`. Each control specifies intent, rationale, enforcement level, scope, gates, evidence, exceptions, and mappings to public standards. This makes governance auditable outside the org and reduces policy drift.
