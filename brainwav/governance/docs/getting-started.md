# Getting Started

## Prerequisites

- Git for version control
- Node.js 20+ (for governance commands)
- MCP-compatible client (VS Code, Claude Desktop, RepoPrompt)
- Optional: Security tools (Semgrep, Gitleaks, Trivy)

## Adopting the Framework

### Lightweight mode (low-risk work)

For docs/typo-only or clearly low-risk changes (no runtime, no models, no prod data):
- Tag the task as `type:lightweight` in `tasks/<slug>/json/run-manifest.json`.
- Keep a minimal plan note in `plan/PLAN.md` (1–2 steps) and record the run-manifest.
- Evidence Triplet still applies; for docs-only, note "tests not applicable" and link to the diff as evidence.
- Oversight/Cortex-Aegis is optional when no code or model paths change; include a short rationale in `plan/PLAN.md`.
- Memory parity: still add a brief memory entry (summary + link) to Local Memory and `.github/instructions/memories.instructions.md`.

### 1. Clone the governance repository

```bash
git clone https://github.com/jscraik/brainwav-agentic-governance.git
```

### 2. Copy governance artefacts into your project

```bash
cp brainwav-agentic-governance/AGENTS.md /path/to/your-project/
cp brainwav-agentic-governance/CODESTYLE.md /path/to/your-project/
cp brainwav-agentic-governance/SECURITY.md /path/to/your-project/
cp -R brainwav-agentic-governance/brainwav /path/to/your-project/
```

### 3. Configure MCP clients

Add core MCP servers (Context7 is built-in to supported clients):

**RepoPrompt MCP**
- Install RepoPrompt (macOS/Windows) from https://repoprompt.com/download and enable MCP in its settings.
- Use the RepoPrompt app as the MCP host (no extra server process needed).

**Cortex Aegis MCP (Oversight)**

```json
{
  "mcpServers": {
    "cortex-aegis": {
      "command": "npx",
      "args": ["@brainwav/cortex-aegis-mcp@latest", "--port", "2091"]
    }
  }
}
```

**Local Memory MCP**
- Point clients at your Local Memory endpoint (default `http://127.0.0.1:3002/api/v1`, MCP port 3026 if enabled).
- If you run the MCP transport, expose it as `local-memory` in your client config and supply any API key if required.

**Context7 MCP**
- Built into supported clients; no install needed. Enable the provider and ensure outbound HTTPS is allowed.

### 4. Start a governed task

Create a task folder and begin with G0 (Intake):

```bash
mkdir -p tasks/my-feature/{context,plan,work,evidence,logs,json}
```

See [Task Management Guide](./task-management-guide.md) for the full workflow.
