# Policy Configuration

The governance framework enforces policies through document-based rules and optional MCP tooling.

## Policy Hierarchy

1. **Constitution** (`00-core/constitution.md`) – Highest authority
2. **AGENTS.md** – Operational rules for agents and humans
3. **CODESTYLE.md** – Code and architecture standards
4. **Package AGENTS.md** – May tighten, never weaken root

## Governance Index

The canonical index at `brainwav/governance/90-infra/governance-index.json` pins SHA-256 hashes for all binding documents. CI verifies digests; agents refuse to act if hashes don't match.

## MCP Policy Enforcement

When using Cortex Aegis MCP:

- **Vibe Check** – Validates plan against governance rules before action
- **License Validation** – Checks academic/library license compliance
- **Connector Health** – Verifies MCP server availability

## Waiver Procedures

Temporary exceptions require:

1. Waiver document at `.cortex/waivers/<waiver_id>.md`
2. Maintainer approval via Apply Waiver workflow
3. Expiry date (max 90 days)
4. Link to workflow run showing approval

See [AGENTS.md §27](../../../AGENTS.md) for waiver details.

## CI Enforcement

| Rule ID | Description | Enforcement |
|---------|-------------|-------------|
| AGENTS-CHK-001 | Checklist token present | BLOCKER |
| AGENTS-PRV-002 | Oversight logs attached | BLOCKER |
| AGENTS-HMS-003 | Live model evidence present | BLOCKER |
| AGENTS-DOC-005 | Docs validation (no ERROR) | BLOCKER |

See [AGENTS-GOVERNANCE.md](../../../AGENTS-GOVERNANCE.md) for the full enforcement matrix.
