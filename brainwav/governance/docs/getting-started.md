# Getting Started

## Prerequisites

- Git for version control
- Node.js 20+ (for governance commands)
- MCP-compatible client (VS Code, Claude Desktop, RepoPrompt)
- Optional: Security tools (Semgrep, Gitleaks, Trivy)

## Adopting the Framework

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

Add Cortex Aegis to your MCP configuration:

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

### 4. Start a governed task

Create a task folder and begin with G0 (Intake):

```bash
mkdir -p tasks/my-feature/{context,plan,work,evidence,logs,json}
```

See [Task Management Guide](./task-management-guide.md) for the full workflow.
