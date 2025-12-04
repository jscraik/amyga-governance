+# Cortex Aegis MCP Server (Neutral Governance)

> Project-neutral oversight and assurance MCP server for all agentic governance workflows.

---

## Overview

Cortex Aegis is an MCP (Model Context Protocol) server that enforces the **Vibe Check Oversight Gate**. It provides mandatory human-in-the-loop verification before any agent or human operator performs side-effecting actions (file writes, network calls, or long-running jobs). The service is governance-neutral: organizations can embed it into any project that follows the ArcTDD / Phase Machine methodology or analogous governance flows.

## Purpose & Scope

- **Scope:** All planning → action executions (humans + AI agents).
- **Inheritance:** Governance Pack documents (`AGENTS.md`, `brainwav/governance/10-flow/agentic-coding-workflow.md`, `CODESTYLE.md`).
- **Goal:** Ensure every task captures a successful oversight exchange after planning and **before** acting. Missing or stale evidence blocks review and CI.

## When to Run the Vibe Check

- Trigger immediately after the implementation plan (`plan/PLAN.md` or `implementation-plan.md`) is drafted.
- Run **before** touching the working tree, calling external services, or launching long jobs.
- **Academic research + license validation** **must** be completed prior to calling `vibe_check`.
- Re-run if:
  - The plan changes materially (new steps, different risk owners).
  - A new session/resume occurs (e.g., after `pnpm session:reset`).
  - More than one build/reset cadence passes (> ~50 minutes) without execution.
- Tier escalation guidance:
  - **Tier 2 (feature)**: new vibe check per arc (≤7 steps per arc).
  - **Tier 1 / Tier 3**: may reuse the most recent response if within session window and plan unchanged.

All submitted plans MUST contain ≤ 7 discrete steps. Split larger efforts into multiple arcs and re-run oversight per arc.

## Academic Research Integration (Mandatory)

Before calling `vibe_check`, enhance the plan with academic/industry research and validate content licenses.

### Available Academic MCP/HTTP Providers

| Provider | Port / Channel | Purpose |
|----------|----------------|---------|
| **Wikidata MCP** | 3029 | Vector/entity search via `mcp_wikidata_*` tools |
| **arXiv MCP** | 3041 | Semantic paper search via `mcp_arxiv_*` tools |
| **Semantic Scholar API** | HTTPS | Identify proven solutions and citation graphs |
| **OpenAlex API** | HTTPS | Surface collaboration patterns / metadata |
| **Context7 MCP** | platform | Library/documentation retrieval via `mcp_context7_*` tools |

### Research Workflow

```ts
await mcpClient.callTool('mcp_wikidata_vector_search', { query: '<concept>' });
await mcpClient.callTool('mcp_arxiv_search', { query: '<topic>' });
await mcpClient.callTool('mcp_context7_get-library-docs', { context7CompatibleLibraryID: '<lib>' });
```

- Store findings in `tasks/<slug>/logs/academic-research/findings.json`.
- Record connector health in `tasks/<slug>/research/connectors-health.log`.

### License Validation Requirements

- Classify each source as SAFE / REVIEW / RESTRICTED / PROHIBITED.
- Only SAFE + REVIEW content may influence the plan.
- Document attribution requirements and store `license-validation.json` alongside findings.
- Filter PROHIBITED/RESTRICTED content before generating plan steps.

Plan steps should explicitly cite the research backing and note alternate approaches discovered through the literature review.

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

## Oversight Invocation

### CLI Wrapper (Recommended)

The governance framework exposes a convenience CLI:

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

- `goal`: concise objective (≤140 chars).
- `plan`: ordered steps (≤7) referencing control IDs when relevant (`brainwav/governance/00-core/llm-threat-controls.md`).
- `session`: stable identifier (`<task-slug>-<timestamp>` recommended).

### MCP Tool Invocation (Direct)

```ts
const response = await mcpClient.callTool('vibe_check', {
  goal: '<task summary>',
  plan: '1. Step one... 2. Step two... (≤7 steps)',
  session: '<task-slug>-<timestamp>'
});
fs.writeFileSync('tasks/<slug>/logs/vibe-check/initial.json', JSON.stringify(response, null, 2));
```

### JSON-RPC / HTTP Fallback

```json
{
  "jsonrpc": "2.0",
  "id": "<uuid>",
  "method": "tools/call",
  "params": {
    "name": "vibe_check",
    "arguments": {
      "goal": "<task summary>",
      "plan": "1. Step one. 2. Step two.",
      "session": "<session-id>"
    }
  }
}
```

POST to `${VIBE_CHECK_HTTP_URL:-http://127.0.0.1:2091}/mcp` with standard JSON headers when MCP transport is unavailable.

### Connector Outage Protocol

- Check `/health` endpoints for each academic MCP (Wikidata 3029, arXiv 3041, etc.).
- If unavailable, document a waiver in `tasks/<slug>/logs/academic-research/<timestamp>-waiver.json` with `[brAInwav]` branding and link in `run-manifest.json`.
- Re-run research + oversight within 72 hours or once services recover.

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

## Evidence & Observability

### Evidence Package Checklist

1. Commit/store JSON response `tasks/<slug>/logs/vibe-check/<initial|final>.json`.
2. Record the invocation command + timestamp in `work/implementation-log.md` or task notes.
3. Reference evidence in PR description and reviewer notes; include link in `run-manifest.json.evidence`.
4. Map each mitigation/finding to OWASP LLM Top 10 controls (see `brainwav/governance/00-core/llm-threat-controls.md`).
5. Capture the proposed edit envelope (directories, file globs, max LOC) next to the JSON response so CI can validate patch budgets.

### Observability Signals

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
