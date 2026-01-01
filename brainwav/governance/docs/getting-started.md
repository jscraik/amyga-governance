---
summary: "Bootstrap steps for adopting the framework."
read_when: "First-time setup"
applies_to: "core"
owner: "Governance Team"
---

# Getting Started

## Table of Contents

- [Prerequisites](#prerequisites)
- [Adoption paths (Jan 2026 best practice)](#adoption-paths-jan-2026-best-practice)
- [Adopting the Framework](#adopting-the-framework)

## Prerequisites

- Git for version control
- Node.js 24.11.x + pnpm 10.26.x (aligned with CI defaults)
- MCP-compatible client (VS Code, Claude Desktop, RepoPrompt)
- Optional: Security tools (Semgrep, Gitleaks, Trivy)

## Adoption paths (Jan 2026 best practice)

1) **Fast path (no Docker):** minimal local checks, full CI gates.  
2) **Containerized tooling:** single tools image for scanners/SBOM/provenance.  
3) **Full local install:** all scanners + governance tools locally.

## Adopting the Framework

### Quick start (pointer mode, release profile)

1. Install governance into your repo:

```bash
brainwav-governance install --root /path/to/your-project --mode pointer --profile release
```

2. In the consumer repo, verify:

```bash
pnpm governance:validate
pnpm governance:sync-hashes:check
```

3. Commit the added files and ensure CI uses Node 24.11.x + pnpm 10.26.x.

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

### 2b. Pointer-mode install (recommended for low-drift)

```bash
brainwav-governance install --root /path/to/your-project --mode pointer --profile release
```

- Adds `.agentic-governance/pointer.json` and pointer stubs for AGENTS/CODESTYLE/SECURITY.  
- Requires `@brainwav/brainwav-agentic-governance` as a dev dependency, pinned in the lockfile (run scripts from `node_modules/@brainwav/brainwav-agentic-governance/scripts` or via `pnpm dlx`).
- Sets `.agentic-governance/config.json` with the selected profile (creative/delivery/release). CI enforces **release** gates by default. `core/full` are accepted as legacy synonyms.

### Verify (expected outputs)

- `pnpm governance:validate` → `validate-governance OK`
- `pnpm governance:sync-hashes:check` → `sync-governance-hashes --check passed`

### Troubleshooting (common issues)

1. **Hash drift reported**: run `pnpm governance:sync-hashes:check` in the consumer repo after ensuring the governance files match the source pack.
2. **Missing tooling**: run `pnpm ensure:tools` to confirm required CLIs on the machine/CI runner.
3. **Profile or overlay errors**: open `.agentic-governance/config.json` and confirm `profile` is one of `creative|delivery|release` (legacy: `core|full`) and overlay paths point to `*.local.md` or `.agentic-governance/overlays/*`.

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
