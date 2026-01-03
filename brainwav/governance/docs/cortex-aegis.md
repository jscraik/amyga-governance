---
summary: "Oversight gate installation and usage."
read_when: "Before or during oversight runs"
applies_to: "core"
owner: "Governance Team"
---

# Cortex Aegis (Oversight Gate, Neutral Governance)

> Project-neutral oversight and assurance MCP server for all agentic governance workflows.

---

## Overview

Cortex Aegis is an MCP (Model Context Protocol) server that enforces the **Oversight Gate**. It provides mandatory human-in-the-loop verification before any agent or human operator performs side-effecting actions (file writes, network calls, or long-running jobs). The service is governance-neutral: organizations can embed it into any project that follows the ArcTDD / Phase Machine methodology or analogous governance flows.

## Purpose & Scope

- **Scope:** All planning → action executions (humans + AI agents).
- **Inheritance:** Governance Pack documents (`AGENTS.md`, `brainwav/governance/10-flow/agentic-coding-workflow.md`, `CODESTYLE.md`).
- **Goal:** Ensure every task captures a successful oversight exchange after planning and **before** acting. Missing or stale evidence blocks review and CI.

## When to Run Oversight (Aegis)

- Trigger immediately after the implementation plan (`tasks/<slug>/plan/PLAN.md` or `tasks/<slug>/implementation-plan.md`) is drafted.
- Run **before** touching the working tree, calling external services, or launching long jobs.
- Research + license validation are profile-driven:
  - release: required for medium+ risk / external-call / model / data-boundary change classes
  - delivery: recommended for medium+ risk
  - creative: optional (record uncertainties instead)
- Re-run if:
  - The plan changes materially (new steps, different risk owners).
  - A new session/resume occurs (session continuity event recorded).
  - More than one build/reset cadence passes (> ~50 minutes) without execution.
- Tier escalation guidance:
  - **Tier 2 (feature)**: new oversight per arc (<=7 steps per arc).
  - **Tier 1 / Tier 3**: may reuse the most recent response if within session window and plan unchanged.

All submitted plans MUST contain ≤ 7 discrete steps. Split larger efforts into multiple arcs and re-run oversight per arc.

## Academic Research Integration (Pack-scoped)

Research providers and connector configuration are adapter/pack scoped. Core governance requires the evidence artifacts (citations + license notes) when the active profile/change class requires it.

- Store findings in `tasks/<slug>/logs/academic-research/findings.json`.
- Record connector health in `tasks/<slug>/research/connectors-health.log` if enabled.

### License Validation Requirements

- Classify each source as SAFE / REVIEW / RESTRICTED / PROHIBITED.
- Only SAFE + REVIEW content may influence the plan.
- Document attribution requirements and store `license-validation.json` alongside findings.
- Filter PROHIBITED/RESTRICTED content before generating plan steps.

Plan steps should explicitly cite the research backing and note alternate approaches discovered through the literature review.

## Installation

Installation is adapter/pack-scoped. Prefer dependency-pinned installation via workspace tooling and CI templates. Do not require global installs in core governance.

## Configuration

### Endpoint / Transport

Endpoint configuration is adapter-specific. Do not hardcode ports in core governance docs.

### MCP Client Configuration

MCP client configuration is adapter-specific. Core governance only requires that the Aegis endpoint is registered and reachable via the active adapter.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CORTEX_AEGIS_PORT` | adapter-defined | Server port |
| `CORTEX_AEGIS_LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `CORTEX_AEGIS_TRACE_ID` | - | Optional trace ID for request correlation |

---

## MCP Tools

### `cortex_aegis_validate`

Primary oversight gate that validates agent plans before execution. Legacy callers may map `vibe_check` to this tool via adapters.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `goal` | string | ✅ | The task or goal being validated |
| `plan` | string | ✅ | Execution plan (<=7 steps recommended) |
| `session` | string | ✅ | Session identifier for tracking |

**Response Schema:**

```json
{
  "verdict": "pass | warn | block",
  "confidence": 0.0-1.0,
  "reasons": ["string"],
  "suggestions": ["string"],
  "trace_id": "string",
  "service": "<service_name>",
  "brand": "<org>"
}
```

**Verdicts:**

| Verdict | Action Required |
|---------|-----------------|
| `pass` | Proceed with execution |
| `warn` | Proceed with caution; log disposition in `evidence/review-notes.md` |
| `block` | Halt execution; address issues before retrying |

Adapter-provided tools MAY include connector health checks, license validation, or time-freshness checks. These capabilities are pack-scoped and must not be required by core governance.

---

## Oversight Invocation

Use adapter-provided CLI tooling or MCP clients to invoke Aegis. Store responses under `tasks/<slug>/logs/aegis/` and link them in the task evidence bundle.
- `session`: stable identifier (`<task-slug>-<timestamp>` recommended).

### MCP Tool Invocation (Direct)

```ts
const response = await mcpClient.callTool('cortex_aegis_validate', {
  goal: '<task summary>',
  plan: '1. Step one... 2. Step two... (≤7 steps)',
  session: '<task-slug>-<timestamp>'
});
fs.writeFileSync('tasks/<slug>/logs/aegis/initial.json', JSON.stringify(response, null, 2));
```

### JSON-RPC / HTTP Fallback

```json
{
  "jsonrpc": "2.0",
  "id": "<uuid>",
  "method": "tools/call",
  "params": {
    "name": "cortex_aegis_validate",
    "arguments": {
      "goal": "<task summary>",
      "plan": "1. Step one. 2. Step two.",
      "session": "<session-id>"
    }
  }
}
```

POST to `${CORTEX_AEGIS_HTTP_URL:-<adapter-configured>}/mcp` with standard JSON headers when MCP transport is unavailable.

### Connector Outage Protocol

- Check `/health` endpoints for academic MCPs as configured by adapters.
- If unavailable, document a waiver in `tasks/<slug>/logs/academic-research/<timestamp>-waiver.json` with service identity (`[<service>]`) and link in `run-manifest.json`.
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

- [ ] `tasks/<slug>/plan/PLAN.md` (≤7 steps) summarized in `steps` field
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
│   ├── aegis/
│   │   ├── initial.json       # G2 oversight
│   │   └── final.json         # G5 oversight
│   └── academic-research/
│       ├── findings.json
│       └── license-validation.json
```

---

## When Aegis MUST Run (Profile + Change Class)

In release profile, Aegis MUST run for:
- external-call changes
- model usage changes
- data-boundary changes
- security-sensitive and release change classes

Delivery profile SHOULD run Aegis for medium+ risk changes.

Legacy compatibility: where older systems refer to `vibe_check`, map to the canonical tool name `cortex_aegis_validate` via adapters.

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

→ Halt execution. Address issues and retry oversight.

---

## Evidence & Observability

### Evidence Package Checklist

1. Commit/store JSON response `tasks/<slug>/logs/aegis/<initial|final>.json` (legacy `logs/vibe-check` allowed via adapters).
2. Record the invocation command + timestamp in `work/implementation-log.md` or task notes.
3. Reference evidence in PR description and reviewer notes; include link in `run-manifest.json.evidence`.
4. Map each mitigation/finding to OWASP LLM Top 10 controls (see `brainwav/governance/00-core/llm-threat-controls.md`).
5. Capture the proposed edit envelope (directories, file globs, max LOC) next to the JSON response so CI can validate patch budgets.

### Observability Signals

All Aegis responses include:

- `service: "<service_name>"` – Service identifier
- optional `brand: "<org>"` – Brand identifier
- `trace_id` – Correlation ID for distributed tracing
- `[<service>]` – Log prefix for filtering

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
