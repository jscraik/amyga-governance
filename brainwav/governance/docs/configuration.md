# Configuration

The governance framework uses environment variables and configuration files for customization.

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

## Governance Index

The governance index at `brainwav/governance/90-infra/governance-index.json` pins SHA-256 hashes for all binding documents. Update hashes when governance documents change:

```bash
# Recompute governance index hashes
sha256sum brainwav/governance/00-core/*.md
```

## Task Folder Configuration

Task folders follow the structure defined in `brainwav/governance/10-flow/agentic-coding-workflow.md` §3. Customize the base path via `GOV_HOME` (defaults to `~/.agentic-governance`).
