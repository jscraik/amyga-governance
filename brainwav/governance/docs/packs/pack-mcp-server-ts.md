---
summary: "MCP server conventions: schemas, auth, audit logs, and egress allowlists."
read_when: "Building or modifying MCP servers/tools in TypeScript."
applies_to: ["pack-mcp-server-ts"]
owner: "Governance Team"
---

# Pack: MCP Server (TypeScript)

## Standards

- **Tool schemas** required for every tool; validate inputs on receipt.
- **AuthN/AuthZ** enforced for `/mcp`, `/sse`, `/health`, `/metrics`.
- **Audit logging** for every tool invocation with `trace_id` and `service`.
- **Egress** default-deny; explicit allowlists per tool.

## Evidence

- Tool list + schema snapshot stored in `verification/mcp-contract-snapshot.json`.
- Egress allowlist stored in `verification/mcp-egress-allowlist.json`.
