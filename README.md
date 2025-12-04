# brAInwav Agentic Governance Framework

> **A project-neutral governance framework for AI-assisted development workflows**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

## Overview

The brAInwav Agentic Governance Framework provides a comprehensive set of policies, templates, and operational guidelines for managing AI agent workflows in software development projects. This framework is designed to be adopted by any project requiring structured governance for human-AI collaboration.

## Key Features

- **ArcTDD Workflow**: Test-driven development methodology with structured vertical slices
- **Phase Machine**: R→G→F→REVIEW workflow ensuring quality gates at each stage
- **Evidence Triplet**: Mandatory documentation of milestone tests, contract snapshots, and reviewer approvals
- **Preflight Guards**: Academic research, license validation, connector health, and identity verification
- **Governance Index**: SHA-pinned document verification for policy integrity

## Quick Start

### 1. Copy the Framework

Copy the `.cortex/` directory and governance files to your project:

```bash
# Clone this repository
git clone https://github.com/jscraik/brainwav-agentic-governance.git

# Copy governance files to your project
cp -r brainwav-agentic-governance/.cortex /path/to/your-project/
cp brainwav-agentic-governance/AGENTS.md /path/to/your-project/
cp brainwav-agentic-governance/CODESTYLE.md /path/to/your-project/
```

### 2. Bootstrap Governance

Run the governance bootstrap in your project:

```bash
pnpm cortex:governance-bootstrap
```

### 3. Configure for Your Project

Update the following files with your project-specific details:

- `AGENTS.md` - Update maintainer and contact information
- `.cortex/rules/constitution.md` - Define your project's core principles
- `.cortex/templates/` - Customize templates as needed

## Framework Structure

```
brainwav/governance/
├── 00-core/                  # Foundational law (constitution, charters)
│   ├── constitution.md       # Supreme governing document
│   ├── AGENT_CHARTER.md      # Agent behavior and ArcTDD guardrails
│   ├── CHARTER_FRAGMENT.md   # Charter summary for quick reference
│   ├── vision.md             # Project vision and north star
│   ├── RULES_OF_AI.md        # AI operational constraints
│   ├── llm-threat-controls.md # LLM security controls
│   └── skills-system-governance.md
├── 10-flow/                  # Operational workflows
│   ├── governance-quickstart.md      # Entry point for all workflows
│   ├── agentic-coding-workflow.md    # G0-G10 gates
│   ├── agentic-phase-policy.md       # R→G→F→REVIEW phases
│   ├── assurance-system.md           # Validation system
│   └── TASK_FOLDER_STRUCTURE.md
├── 20-checklists/            # Quality validation
│   └── checklists.md         # Unified checklist source
├── 90-infra/                 # Machine-readable configs
│   └── governance-index.json # SHA-pinned document index
├── templates/                # Standardized templates
└── docs/                     # Extended documentation

AGENTS.md                     # Root agent operational instructions
CODESTYLE.md                  # Code style enforcement rules
```

## Core Concepts

### Hierarchy of Authority

1. **Governance Pack** (`brainwav/governance/`) - Highest authority
2. **CODESTYLE.md** - CI-enforced code standards
3. **Root AGENTS.md** - Repository-wide agent rules
4. **Package AGENTS.md** - May tighten but not weaken root rules

### Agent Personas

| Persona | Permitted Actions | Hard Limits |
|---------|-------------------|-------------|
| **Assistant** | Explain/summarize/answer | No source modifications |
| **Analyst** | Scan repo, emit insights | No code changes |
| **Generator** | Scaffold code/tests under TDD | Draft only; human reviews |
| **Guardian** | Threat-model, security audits | Reports only |
| **Refactorer** | Identify debt, produce plans | No direct code changes |

### Task & Evidence Contract

Each task must produce:

```
tasks/<slug>/
├── implementation-plan.md
├── tdd-plan.md
├── json/
│   ├── run-manifest.json
│   └── memory-ids.json
├── logs/
│   ├── vibe-check/
│   └── academic-research/
└── verification/
```

## Integration

### CI/CD Integration

The framework integrates with CI through:

- Governance index verification
- Charter SHA validation
- Evidence triplet enforcement
- Security scanning gates

### MCP Server Integration

Default ports for MCP services:
- MCP Server: 3024
- Local Memory: 3002
- Oversight (Aegis): 2091

## Documentation

- [Governance Quickstart](brainwav/governance/10-flow/governance-quickstart.md) - Start here
- [Governance Pack](brainwav/governance/) - Full policy documentation
- [Templates](brainwav/governance/templates/) - Standardized templates
- [Code Style](CODESTYLE.md) - Coding standards

## Contributing

1. Fork this repository
2. Create a feature branch
3. Submit a PR following the governance workflow
4. Ensure all CI checks pass

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

## Maintainer

- GitHub: [@jamiescottcraik](https://github.com/jamiescottcraik)
- Organization: brAInwav
