---
summary: "Environment, MCP, config and overlay setup."
read_when: "Configuring governance for a repo"
applies_to: "core"
owner: "Governance Team"
---

# Configuration

The governance framework uses environment variables and configuration files for customization.

## Governance Config (Profiles + Overlays)

Use `.agentic-governance/config.json` to select local profiles, set identity hints, and declare policy overlays. This file is validated by `scripts/validate-governance.mjs` and MUST NOT weaken base governance.

```json
{
  "$schema": "brainwav/governance/90-infra/agentic-config.schema.json",
  "version": "1.0",
  "profile": "release",
  "identity": {
    "serviceName": "example-service",
    "brand": "ExampleOrg"
  },
  "overlays": [
    {
      "name": "org-tightening",
      "description": "Org-specific tightenings (no weakening)",
      "paths": [
        "AGENTS.local.md",
        ".agentic-governance/overlays/security-additions.md"
      ]
    }
  ]
}
```

**Overlay rules:**
- Overlays may only **tighten** or clarify policy; weakening is forbidden.
- Overlay files must be `*.local.md` or live under `.agentic-governance/overlays/`.
- Base governance files under `brainwav/governance/**` are immutable; changes there require governance index hash updates.

**Verify:**
- `pnpm governance:validate` should report `validate-governance OK`.

**Common mistakes:**
- Overlay path points into `brainwav/governance/**` (blocked).
- Overlay file is not `*.local.md` and not under `.agentic-governance/overlays/`.

## MCP Client Configuration

Add MCP servers to your client configuration:

```json
{
  "mcpServers": {
    "cortex-aegis": {
      "command": "npx",
      "args": ["@brainwav/cortex-aegis-mcp@latest", "--port", "2091"]
    },
    "local-memory": {
      "command": "local-memory-mcp",
      "args": ["--port", "3002"]
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GOV_HOME` | `~/.agentic-governance` | Base directory for governance artefacts and task folders |
| `TASK_SLUG` | — | Current task identifier for commands |
| `LOCAL_MEMORY_BASE_URL` | `http://localhost:3002/api/v1` | Local Memory API endpoint |
| `CORTEX_AEGIS_PORT` | `2091` | Cortex Aegis MCP port |

## Pointer Mode Configuration

Pointer mode is enabled by `.agentic-governance/pointer.json`. It redirects governance validation and hashing to the pinned package under `node_modules/@brainwav/brainwav-agentic-governance` and keeps local overrides small.

Key fields:
- `package`: npm package name (default `@brainwav/brainwav-agentic-governance`)
- `packageRoot`: `node_modules/...` path
- `governanceRoot`: canonical governance docs path
- `governanceIndexPath`: canonical hash index path
- `agentsPath`: canonical AGENTS.md path

## Governance Index

The governance index at `brainwav/governance/90-infra/governance-index.json` pins SHA-256 hashes for all binding documents. Update hashes when governance documents change:

```bash
# Recompute governance index hashes
sha256sum brainwav/governance/00-core/*.md
```

## Task Folder Configuration

Task folders follow the structure defined in `brainwav/governance/10-flow/agentic-coding-workflow.md` §3. Customize the base path via `GOV_HOME` (defaults to `~/.agentic-governance`).
**Profiles:**
- `creative` – local-only defaults for exploration (no CI weakening).
- `delivery` – full gates for daily work.
- `release` – **gold standard**: delivery + supply-chain/release evidence (CI default).
- Legacy synonyms accepted: `core` → `delivery`, `full` → `release`.
