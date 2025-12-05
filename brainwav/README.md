# brainwav/ Governance Hub

<div align="center">

[![CI](https://github.com/jscraik/brainwav-agentic-governance/actions/workflows/ci.yml/badge.svg)](https://github.com/jscraik/brainwav-agentic-governance/actions/workflows/ci.yml)
[![GitHub Issues](https://img.shields.io/github/issues/jscraik/brainwav-agentic-governance)](https://github.com/jscraik/brainwav-agentic-governance/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/jscraik/brainwav-agentic-governance)](https://github.com/jscraik/brainwav-agentic-governance/pulls)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

</div>

This directory is the **single source of truth** for the agentic governance pack—policies, workflows, and validation rules.

## Authority Chain

1. **[`brainwav/governance/00-core/AGENT_CHARTER.md`](governance/00-core/AGENT_CHARTER.md)** - Immutable ethics and core charter
2. **[`AGENTS.md`](../AGENTS.md)** - "AGENTS.md is the boss" - Root agentic behavior rules
3. **[`brainwav/governance/00-core/RULES_OF_AI.md`](governance/00-core/RULES_OF_AI.md)** - Fundamental AI governance principles
4. **[`brainwav/governance/00-core/constitution.md`](governance/00-core/constitution.md)** - Constitutional framework
5. **Package-level configs** - Local overrides (must comply with global policies)

## Directory Structure

- **`governance/00-core/`** - Core governance documents (charter, constitution, rules)
- **`governance/10-flow/`** - Operational workflows and procedures
- **`governance/20-checklists/`** - Review and validation checklists
- **`governance/30-compliance/`** - Regulatory compliance mappings
- **`governance/90-infra/`** - Governance infrastructure (schemas, indexes)
- **`governance/audit/`** - Compliance tracking and audit logs
- **`governance/commands/`** - CLI command definitions and utilities
- **`governance/context/`** - Agent context and reference materials
- **`governance/docs/`** - Governance reference documentation
- **`governance/runbooks/`** - Operational procedures and incident response
- **`governance/templates/`** - Document and artifact templates
- **`governance-pack/`** - Portable governance configurations
- **`research/`** - Research notes and integrations

## Usage

All policies and schemas in this directory are enforced by:

1. **Pre-commit hooks** - Local validation before commits
2. **CI/CD pipelines** - Automated validation on PRs
3. **Runtime enforcement** - Policy engines during execution

## Validation

Run governance bootstrap and validation:

```bash
pnpm cortex:governance-bootstrap
pnpm readiness:check
```
