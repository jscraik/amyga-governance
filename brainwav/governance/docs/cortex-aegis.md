# Cortex Aegis MCP Server

> Oversight and assurance MCP server for agentic governance workflows.

---

## Overview

Cortex Aegis is an MCP (Model Context Protocol) server that provides oversight gates, plan validation, and assurance checks for AI agent workflows. It acts as a pre-flight checkpoint that agents must call before executing file writes, network calls, or long-running operations.

## Installation

```bash
npm i -g @brainwav/cortex-aegis-mcp@latest
```

## Configuration

### Default Port

Cortex Aegis runs on **port 2091** by default.

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop, VS Code):

```json
{
  "mcpServers": {
    "cortex-aegis": {
      "command": "cortex-aegis-mcp",
      "args": ["--port", "2091"]
    }
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CORTEX_AEGIS_PORT` | `2091` | Server port |
| `CORTEX_AEGIS_LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `CORTEX_AEGIS_TRACE_ID` | - | Optional trace ID for request correlation |

---

## MCP Tools

### `vibe_check`

Primary oversight gate that validates agent plans before execution.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `goal` | string | ✅ | The task or goal being validated |
| `plan` | string | ✅ | Execution plan (≤7 steps recommended) |
| `session` | string | ✅ | Session identifier for tracking |
| `with_academic_research` | boolean | ❌ | Enable academic research enhancement |
| `validate_licenses` | boolean | ❌ | Validate license compliance |

**Response Schema:**

```json
{
  "verdict": "pass | warn | block",
  "confidence": 0.0-1.0,
  "reasons": ["string"],
  "suggestions": ["string"],
  "trace_id": "string",
  "brand": "brAInwav"
}
```

**Verdicts:**

| Verdict | Action Required |
|---------|-----------------|
| `pass` | Proceed with execution |
| `warn` | Proceed with caution; log disposition in `evidence/review-notes.md` |
| `block` | Halt execution; address issues before retrying |

### `connector_health`

Probe health status of research MCP connectors.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectors` | string[] | ❌ | Specific connectors to check (default: all) |

**Supported Connectors:**

| Connector | Port | Purpose |
|-----------|------|---------|
| Wikidata MCP | 3029 | Entity/knowledge graph queries |
| arXiv MCP | 3041 | Academic paper search |
| Semantic Scholar | - | Citation and paper metadata |
| OpenAlex | - | Open academic graph |
| Context7 | - | Documentation retrieval |

### `license_validate`

Validate license compliance for dependencies and content.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | object[] | ✅ | Items to validate |
| `policy` | string | ❌ | License policy (default: "permissive") |

**Response:**

```json
{
  "results": [
    {
      "item": "string",
      "license": "MIT | Apache-2.0 | GPL-3.0 | ...",
      "status": "SAFE | REVIEW | BLOCKED",
      "reason": "string"
    }
  ]
}
```

### `time_freshness`

Validate time-sensitive data and anchor timestamps.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reference_date` | string | ✅ | ISO-8601 date to validate against |
| `max_age_days` | number | ❌ | Maximum acceptable age (default: 30) |

---

## CLI Wrapper

The governance framework provides a CLI wrapper for convenience:

```bash
pnpm oversight:vibe-check \
  --goal "<task>" \
  --plan "<≤7 steps>" \
  --session "<id>" \
  --save "tasks/<slug>/logs/vibe-check/initial.json" \
  --with-academic-research \
  --validate-licenses \
  --license-validation "tasks/<slug>/logs/academic-research/license-validation.json"
```

---

## Integration with ArcTDD Gates

Cortex Aegis integrates with the ArcTDD workflow at specific gates:

| Gate | When to Call | Purpose |
|------|--------------|---------|
| G0 – Initialize | After task folder creation | Anchor time freshness |
| G2 – Plan/Design | After plan creation | Validate plan (≤7 steps), check risks |
| G5 – Verify | After implementation | Final verification, evidence collection |

### Required Inputs

When calling Aegis at G2/G5:

- [ ] `plan/PLAN.md` (≤7 steps) summarized in `steps` field
- [ ] `context/research.md` citations and connector health references
- [ ] Risk tags and tier from `meta/task.json`
- [ ] Time freshness anchor (ISO-8601 date)

### Required Outputs

Store Aegis responses in the task folder:

```
tasks/<slug>/
├── evidence/
│   └── aegis-report.json      # Raw Aegis response
├── logs/
│   ├── vibe-check/
│   │   ├── initial.json       # G2 vibe check
│   │   └── final.json         # G5 vibe check
│   └── academic-research/
│       ├── findings.json
│       └── license-validation.json
```

---

## When Aegis MUST Run

Per governance policy, Cortex Aegis **MUST** be invoked for:

1. **Feature flows** at G2 (plan) and G5 (verification) when:
   - Risk tag ≥ `medium`
   - Touching user-facing or contract surfaces

2. **Fix flows** impacting:
   - Security, privacy, or data protection
   - Critical infrastructure

3. **Refactor flows** when changing:
   - Contracts, storage schemas, or security boundaries

4. **Any task introducing**:
   - New MCP tool or connector
   - ML model integration

---

## Response Handling

### Pass Verdict

```json
{
  "verdict": "pass",
  "confidence": 0.95,
  "reasons": ["Plan follows governance guidelines", "No license violations"],
  "trace_id": "aegis-2025-12-04-abc123"
}
```

→ Proceed to next gate.

### Warn Verdict

```json
{
  "verdict": "warn",
  "confidence": 0.72,
  "reasons": ["Potential performance impact on hot path"],
  "suggestions": ["Add cancellation support", "Consider caching strategy"]
}
```

→ Log disposition in `evidence/review-notes.md`, proceed with documented justification.

### Block Verdict

```json
{
  "verdict": "block",
  "confidence": 0.89,
  "reasons": ["GPL-3.0 dependency incompatible with Apache-2.0 license"],
  "suggestions": ["Replace with MIT-licensed alternative"]
}
```

→ Halt execution. Address issues and retry vibe check.

---

## Observability

All Aegis responses include:

- `brand: "brAInwav"` – Brand identifier
- `trace_id` – Correlation ID for distributed tracing
- `[brAInwav]` – Log prefix for filtering

Integrate with OpenTelemetry by propagating `traceparent` headers.

---

## Related Documentation

- [AGENTS.md §11 – Oversight Gate](../../../AGENTS.md#11-oversight-gate-cortex-aegis-check--academic-licensing)
- [Checklists §7 – Cortex-Aegis Checklists](../20-checklists/checklists.md#7-cortex-aegis-checklists)
- [Agentic Coding Workflow](../10-flow/agentic-coding-workflow.md)
- [Assurance System](../10-flow/assurance-system.md)

---

## Changelog

- `2025-12-04` – Initial documentation created
