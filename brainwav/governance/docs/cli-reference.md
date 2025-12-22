# CLI Reference

The governance framework provides executable commands under `brainwav/governance/commands/`.

## Governance Commands

Run these with Node.js:

```bash
# Recall context from Local Memory MCP
TASK_SLUG=my-task node brainwav/governance/commands/recall.mjs "query" --limit=5

# Store task context to memory
TASK_SLUG=my-task node brainwav/governance/commands/memorize.mjs

# Generate daily standup summary
TASK_SLUG=my-task node brainwav/governance/commands/daily-summary.mjs

# Prepare incident post-mortem
INCIDENT_ID=INC-742 node brainwav/governance/commands/incident-review.mjs
```

## Command Reference

| Command | Script | Purpose |
|---------|--------|---------|
| `/memorize` | `memorize.mjs` | Store governance context to Local Memory |
| `/recall` | `recall.mjs` | Retrieve context via semantic search |
| `/daily-summary` | `daily-summary.mjs` | Generate standup summary with git status |
| `/incident-review` | `incident-review.mjs` | Prepare structured post-incident review |
| `/gather` | `gather.md` | LLM prompt for context collection |
| `/reframe` | `reframe.md` | LLM prompt for plan validation |
| `/truth` | `truth.md` | LLM prompt for factual audits |
| `/sprint-goals` | `sprint-goals.md` | LLM prompt for sprint planning |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TASK_SLUG` | — | Current task identifier |
| `LOCAL_MEMORY_BASE_URL` | `http://localhost:3002/api/v1` | Local Memory API endpoint |
| `LOCAL_MEMORY_API_KEY` | — | Optional API key for Local Memory |

## MCP Client Usage

Commands can also be invoked via MCP clients with appropriate tool bindings.

See [Cortex Aegis MCP](./cortex-aegis.md) for oversight tool usage.
