# Assurance System for Agentic Workflows

> The autonomous quality and governance assurance system for AI-native software development.

---

## 1. What is the Assurance System?

**The Assurance System** is the automated validation system that validates agentic development workflows against governance, security, and quality requirements. It serves as the "guardrail" for AI agents and humans, ensuring that plans, implementations, and changes align with governance principles and compliance requirements.

**Key Capabilities**:

- Plan validation against governance frameworks
- Risk assessment and mitigation recommendations  
- Evidence verification and audit trail generation
- Time-freshness validation for research and external sources
- Compliance checking for security, privacy, and accessibility standards

---

## 2. Time Freshness Policy

### 2.1 Context Anchoring

The user's timezone is {{USER_TIMEZONE}}. Today's date is {{TODAY}}.

Treat dates before this as past and after this as future. When asked for "latest", "most recent", "today's", etc., do not assume knowledge is current; verify freshness or ask the user.

### 2.2 Secret Handling

Retrieve all API keys, SSH credentials, and tokens at runtime via the 1Password CLI (`op`) and never cache them in files or long-lived environment variables.

### 2.3 Freshness Validation

The Assurance System MUST validate time-freshness for:

- External research sources and citations
- API documentation references
- Security vulnerability databases
- Dependency version checks
- Compliance standard updates

---

## 3. When to Call the Assurance System

### 2.1 Mandatory Invocation

- **Feature Implementation (G2 + G5)**: All feature flows must call the Assurance System at plan validation (G2) and verification (G5) stages
- **High-Risk Changes**: Any modification with risk tags ≥ `medium` or touching security/privacy boundaries
- **Contract Changes**: API modifications, schema updates, or interface changes
- **Research Validation**: Academic source verification and time-freshness checks
- **Compliance Requirements**: When WCAG, security, or regulatory compliance is involved

### 2.2 Optional but Recommended

- Fix flows for non-trivial bugs or system-level issues
- Refactoring that affects multiple packages or core abstractions
- New tool/connector integrations in the MCP ecosystem
- Experimental or prototype implementations

---

## 3. Academic Research Integration (Mandatory)

### 3.1 Available Academic MCP Providers

Before running Cortex-Aegis validation, all implementation plans MUST be enhanced with academic research using the built-in MCP providers:

- **Wikidata MCP** (Port 3029): Vector search for entities, properties, and relationships via `mcp_wikidata_*` tools
- **arXiv MCP** (Port 3041): Semantic search for recent papers and technical approaches via `mcp_arxiv_*` tools
- **Semantic Scholar API**: Identify proven solutions and highly-cited approaches
- **OpenAlex API**: Discover broad research patterns and collaborations
- **Context7 MCP**: Access domain-specific knowledge and best practices via `mcp_context7_*` tools

### 3.2 Research Workflow

```typescript
// Example: Query academic sources via MCP
await mcpClient.callTool('mcp_wikidata_vector_search', { query: '<concept>' });
await mcpClient.callTool('mcp_arxiv_search', { query: '<research topic>' });
await mcpClient.callTool('mcp_context7_get-library-docs', { context7CompatibleLibraryID: '<lib>' });

// Store findings for Aegis consumption
fs.writeFileSync(
  'tasks/<slug>/logs/academic-research/findings.json',
  JSON.stringify(researchResults, null, 2)
);
```

### 3.3 License Validation Requirements

- **License Risk Assessment**: Classify all academic sources by risk level (SAFE/REVIEW/RESTRICTED/PROHIBITED)
- **Content Filtering**: Only include SAFE and REVIEW content in implementation plans
- **Attribution Compliance**: Ensure proper citation and attribution for all used content
- **Documentation**: Store license validation results alongside research findings

---

## 4. Implementation Guidelines

### 4.1 MCP Tool Invocation

```typescript
// Call cortex-aegis MCP tool (replaces legacy vibe_check)
const response = await mcpClient.callTool('cortex_aegis_validate', {
  goal: '<task summary>',
  plan: '1. Step one. 2. Step two. ... (max 7 steps)',
  sessionId: '<task-slug>-<timestamp>',
  gate: 'G2|G5|other',
  riskTags: ['security', 'privacy', 'compliance']
});

// Save response to evidence
fs.writeFileSync(
  'tasks/<slug>/evidence/aegis-report.json',
  JSON.stringify(response, null, 2)
);
```

### 4.2 Response Handling

- **BLOCK verdicts** halt workflow progression until resolved
- **WARN verdicts** require human review and disposition in `evidence/review-notes.md`
- **PASS verdicts** enable automatic gate progression

### 4.3 Output Schema

**Primary Response** (`evidence/aegis-report.json`):

```json
{
  "verdict": "PASS|WARN|BLOCK",
  "timestamp": "ISO-8601-timestamp",
  "version": "aegis-framework-version",
  "validations": [...],
  "recommendations": [...],
  "requiredActions": [...],
  "auditTrail": {...}
}
```

**Audit Logs** (`logs/vibe-check/*.json`):

- Detailed validation traces for compliance auditing
- Evidence collection and verification logs  
- Time-stamped decision rationale

---

## 5. Configuration & Integration

### 5.1 Server Configuration

**Default Endpoint**: `${CORTEX_AEGIS_HTTP_URL:-http://127.0.0.1:2001}`

**Required Environment Variables**:

- `CORTEX_AEGIS_HTTP_URL`: Aegis service endpoint
- `ACADEMIC_RESEARCH_ENABLED`: Enable/disable research integration
- `AEGIS_COMPLIANCE_FRAMEWORKS`: Active compliance frameworks

### 5.2 Task Integration Points

**Required Files**:

- `evidence/aegis-report.json`: Primary validation results
- `logs/vibe-check/*.json`: Audit trail (legacy naming for compatibility)
- `run-manifest.json.evidence.aegisReport`: Relative path reference

**Gate Dependencies**:

- G2 (Plan): Mandatory for feature flows, recommended for others
- G5 (Verify): Mandatory for feature flows and high-risk changes
- Ad-hoc: Available for any validation requirements

---

## 6. Legacy Compatibility

### 6.1 Vibe Check Migration

**Transition Period**: 2025-11-22 through 2025-12-31

- Legacy `vibe_check` tool calls redirect to `cortex_aegis_validate`
- Existing log paths (`logs/vibe-check/`) maintained for compatibility
- Gradual migration of references from "vibe check" to "Cortex-Aegis"

**Breaking Changes After 2025-12-31**:

- `vibe_check` tool will be deprecated
- New log structure under `logs/aegis/`
- Updated tool names and parameters

### 6.2 Connector Outage Protocol

**Fallback Behavior**:

- Academic research requirements become optional during connector outages
- Validation proceeds with available data and explicit uncertainty markers
- Manual review requirements increase for plans developed during outages

---

## 7. Related Documentation

**Core Governance**:

- [Constitution](../00-core/constitution.md) - Foundational principles
- [Agent Charter](../00-core/AGENT_CHARTER.md) - Agent behavior requirements
- [Time Freshness Policy](./cortex-aegis.md#time-freshness-policy) - Source validation rules

**Workflow Integration**:

- [Governance Quickstart](../10-flow/governance-quickstart.md) - Overview and flow mapping
- [Agentic Workflow](../10-flow/agentic-coding-workflow.md) - Detailed gate specifications
- [Unified Checklists](../20-checklists/checklistsgovernance-os.md) - Section 7 Aegis requirements

- When any academic MCP connector is unavailable, check connector health via `/health` endpoints:
  - Wikidata MCP: `curl ${WIKIDATA_MCP_URL:-http://127.0.0.1:3029}/health`
  - arXiv MCP: `curl ${ARXIV_MCP_URL:-http://127.0.0.1:3041}/health`
  - Cortex Aegis MCP: `curl ${CORTEX_AEGIS_HTTP_URL:-http://127.0.0.1:2091}/health`
- Document the outage in a waiver JSON at `logs/academic-research/<slug>-<timestamp>-waiver.json` with `[brAInwav]` branding
- Record the waiver pointer in `run-manifest.json` and schedule a follow-up check within 72 hours
- Plans submitted to Oversight must surface outstanding uncertainties (e.g., connector uptime, attestation tooling) so reviewers can challenge mitigations early

**Enhanced Plan Format with Research Integration:**

```
Plan for: "Implement API rate limiting"
1. Research rate limiting patterns and best practices (Research-backed: arXiv:2301.12345, Semantic Scholar citations: 156)
2. Design token bucket algorithm based on academic standards (Research-backed: Context7 patterns)
3. Implement Redis-based rate limiter with wikidata-validated algorithm properties (Research-backed: Wikidata Q1860)
4. Add comprehensive testing based on peer-reviewed validation methods (Research-backed: OpenAlex research patterns)
5. Create monitoring dashboards using academically-proven metrics (Research-backed: Semantic Scholar highly-cited approaches)
6. Document with academic references and proven methodologies
7. Deploy with gradual rollout based on research-backed deployment strategies
```

**Academic Research Enhancement Process:**

1. **Automatic Query Generation**: Extract key concepts from the plan and generate academic search queries
2. **Multi-Source Research**: Execute searches across all academic databases simultaneously
3. **License Validation**: Assess risk levels and filter content by usage rights
4. **Evidence Integration**: Incorporate license-compliant findings into plan steps with proper citations
5. **Validation**: Cross-reference approaches across multiple academic sources
6. **Documentation**: Store research evidence and license validation alongside vibe-check responses

### 3.2 Server Setup

The Vibe Check MCP server is now included in the governance framework monorepo:

```bash
# Local development setup
cd packages/vibe-check-mcp-server
pnpm install
pnpm build

# Start the server
pnpm start --port 2001

# Or use launchd service
launchctl load ~/Library/LaunchAgents/com.brainwavgovernance-vibe.plist
```

**Server Configuration:**

- **Default URL**: `http://127.0.0.1:2001` (configurable via `CORTEX_VIBE_HTTP_URL`)
- **Health Check**: `GET /health`
- **MCP Endpoint**: `POST /mcp` (JSON-RPC 2.0)
- **Tools Available**:
  - `vibe_check` - Oversight with clarifying questions and alignment validation
  - `vibe_learn` - Optional logging of mistakes and successes for review

**Supported LLM Providers**:

- OpenAI (GPT models)
- Anthropic (Claude models)
- Google (Gemini models)
- OpenRouter (various models)

### 3.3 JSON-RPC Fallback

POST to `${CORTEX_VIBE_HTTP_URL:-http://127.0.0.1:2001}/mcp` with:

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
      "sessionId": "<session-id>"
    }
  }
}
```

- Include headers: `Content-Type: application/json` and `Accept: application/json, text/event-stream`.
- Save the raw response to `logs/vibe-check/<slug>.json` (pretty or compact JSON allowed).

---

## 4. Evidence Package (merge gate)

To satisfy CI and review:

1. Commit the JSON response at `logs/vibe-check/<slug>.json` inside the task folder.
2. Record the command (or HTTP POST) with timestamp and session ID in `~/tasks/<slug>/notes.md` or `decisions.md`.
3. Reference the artifact in the PR description and attach the same path in review evidence (Code Review Checklist).
4. Map each finding or mitigation to the applicable OWASP LLM Top 10 control ID(s) listed in `governance/rules/llm-threat-controls.md`; include the mapping in the PR evidence comment.
5. Capture the proposed edit envelope: directories, allowed file globs, max files, and max total LOC. Store alongside the JSON response (e.g., `edit-envelope.json`) so CI can enforce the declared patch budget.
6. Ensure all oversight-related logs contain `[brAInwav]` and `brand:"brAInwav"` for audit search.

Failure to meet any item keeps the PR in a blocked state (`agents-guard` job).

---

## 5. Error Handling and Escalation

- **Server unreachable / health check fails:** stop work, mark the task blocked, and escalate per the Constitution. Do **not** bypass the gate without a formally recorded waiver under `governance/waivers/`.
- **HTTP 406 or schema errors:** verify headers and ensure the plan contains numbered steps ≤ 7. Correct and retry.
- **Timeouts:** retry once after confirming server health; repeated timeouts require escalation.
- **Session resets:** if a `pnpm session:reset` run occurs, perform a new vibe check before resuming implementation.

---

## 6. Related Resources

- Runbook with troubleshooting scripts: `docs/runbooks/vibe-check.md`
- Governance reference: `governance/rules/agentic-coding-workflow.md` §0.1 and §G5
- CLI helper source: `scripts/oversight/vibe-check-call.mjs`
- Oversight evidence index: `governance/audit/`

---
