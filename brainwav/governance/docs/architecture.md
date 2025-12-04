# Architecture

The brAInwav Agentic Governance Framework is a document-based governance system with optional MCP tooling.

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
