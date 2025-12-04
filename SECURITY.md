# Security Policy

brAInwav Agentic Governance is a framework for governing AI agents, MCP integrations, and LLM-assisted development workflows. While primarily documentation and tooling, it defines patterns that influence security-critical systems. This document describes our security practices and how to report vulnerabilities.

For operational governance rules, see [AGENTS.md](AGENTS.md). For LLM-specific threat controls, see [llm-threat-controls.md](brainwav/governance/00-core/llm-threat-controls.md).

---

## Table of Contents

- [Supported Versions](#supported-versions)
- [Threat Model](#threat-model)
- [Authentication & Authorization](#authentication--authorization)
- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [Response Timeline](#response-timeline)
- [Continuous Security](#continuous-security)
- [Scope](#scope)

---

## Supported Versions

Only the latest release on the `main` branch receives security fixes. Governance documentation updates are applied continuously; stay current to benefit from evolving threat mitigations.

| Version | Supported |
|---------|-----------|
| `main` (latest) | ✅ Active |
| Previous releases | ❌ No backports |

---

## Threat Model

brAInwav governance addresses the following threat categories (mapped to [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)):

### LLM & Agent Threats

| Threat | Mitigation | Reference |
|--------|------------|-----------|
| **LLM01 - Prompt Injection** | Structured prompts, schema validation, Cortex Aegis oversight | `llm-threat-controls.md` |
| **LLM02 - Insecure Output Handling** | Output validation, branded logging, trace context | AGENTS.md §12 |
| **LLM05 - Supply Chain** | SBOM (CycloneDX 1.6+), SLSA provenance, Sigstore signing | AGENTS.md §9 |
| **LLM06 - Sensitive Info Disclosure** | 1Password CLI for secrets, no hardcoded credentials | AGENTS.md §9 |
| **LLM07 - Insecure Plugin Design** | MCP connector health checks, tool allowlists | AGENTS.md §13 |
| **LLM08 - Excessive Agency** | Step budgets (≤7), Ask-First limits (≤3), oversight gates | `AGENT_CHARTER.md` |

### Infrastructure Threats

| Threat | Mitigation | Reference |
|--------|------------|-----------|
| **Secrets Exposure** | Ephemeral injection via `op run`, no `.env` in repo | AGENTS.md §9 |
| **Dependency Vulnerabilities** | OSV/Audit, Semgrep, gitleaks in CI | AGENTS.md §9 |
| **Container Escape** | Minimal base, pinned digests, non-root, read-only FS, dropped caps | AGENTS.md §9 |
| **Identity Spoofing** | OIDC/WIF authentication, no static cloud keys | AGENTS.md §9 |
| **Supply Chain Attacks** | SBOM generation, in-toto/SLSA attestations, Cosign v3 signing | checklists.md §5 |

### Governance-Specific Threats

| Threat | Mitigation |
|--------|------------|
| **Agent Charter Bypass** | CI enforcement via `charter-enforce` workflow, SHA-pinned governance index |
| **Unauthorized Governance Changes** | Hash validation in `governance-index.json`, maintainer approval required |
| **Fake Telemetry/Evidence** | Anti-patterns list (AGENTS.md §20), Evidence Triplet requirements |

---

## Authentication & Authorization

### OAuth 2.0 Integration (Runtime Systems)

Systems implementing brAInwav governance should follow these patterns:

- **JWT Validation**: All protected endpoints require valid JWT in `Authorization: Bearer <token>` header
- **JWKS Verification**: Tokens verified against identity provider's published key set
- **Role-Based Access Control**: User roles extracted from JWT claims

### Protected Resources (Reference)

| Resource Type | Protection Level | Required Role |
|---------------|------------------|---------------|
| Public endpoints (`/health`, `/metrics`) | None | - |
| Standard API endpoints | Authentication required | Any authenticated |
| Admin endpoints (`/admin/*`) | Admin role required | `admin` |
| MCP tool execution | Scoped permissions | Per-tool scopes |

### MCP Scopes (per AGENTS.md §13)

```
search.read    - Read access to search tools
docs.write     - Write access to documentation
memory.read    - Read from Local Memory
memory.write   - Write to Local Memory
memory.delete  - Delete from Local Memory
```

---

## Reporting a Vulnerability

### For Critical Vulnerabilities (CVSS 7.0+)

**Do NOT open a public GitHub issue.** Instead:

1. **Use GitHub's Private Security Advisory**
   - Navigate to the Security tab → "Report a vulnerability"
   - This creates a private discussion with maintainers

2. **Email (if GitHub is unavailable)**
   - Contact: security@brainwav.io (or repository owner)
   - Include:
     - Description of the vulnerability
     - Steps to reproduce
     - Potential impact
     - Suggested fix (if any)

### For Lower Severity Issues (CVSS < 7.0)

You may use the public [Security Vulnerability issue template](.github/ISSUE_TEMPLATE/security-vulnerability.yml), but:
- **DO NOT** include working exploits
- **DO NOT** include credentials or secrets
- **DO NOT** include personal/sensitive data

Expect acknowledgement within 48 hours; fixes are prioritized by severity.

---

## Response Timeline

| Severity | Initial Response | Target Resolution |
|----------|------------------|-------------------|
| Critical (CVSS 9.0-10.0) | 24 hours | 7 days |
| High (CVSS 7.0-8.9) | 48 hours | 14 days |
| Medium (CVSS 4.0-6.9) | 5 business days | 30 days |
| Low (CVSS 0.1-3.9) | 10 business days | 90 days |

---

## Continuous Security

### CI Security Gates

| Gate | Tool | Failure Policy |
|------|------|----------------|
| Static Analysis | Semgrep | `ERROR=block` |
| Secret Detection | gitleaks | `ANY=block` |
| Dependency Audit | OSV/pnpm audit | Block on high/critical |
| SBOM Generation | CycloneDX 1.6+ | Required for releases |
| Attestation | Sigstore Cosign v3 | Required for releases |

### Automated Checks

- `pnpm security:scan` - Runs Semgrep + gitleaks + OSV audit
- `pnpm sbom:generate` - Generates CycloneDX SBOM
- `pnpm attest:sign` - Creates SLSA provenance bundle
- CI gates run on every pull request (see `checklists.md` §5)

### Governance Integrity

- `governance-index.json` contains SHA-256 hashes of all governance documents
- `charter-enforce` workflow validates hashes on every PR
- Hash updates require maintainer approval per `governance-hash-update.md`

---

## Scope

### In Scope

- All code in this repository
- Governance documentation
- CI/CD pipeline configurations
- Templates and scaffolding
- Dependencies managed by this repository

### Out of Scope

- Third-party services integrated via MCP (report to respective vendors)
- Vulnerabilities in upstream dependencies (report to respective projects, note here for tracking)
- Runtime systems implementing brAInwav governance (report to those projects)

---

## Recognition

We maintain a list of security researchers who have responsibly disclosed vulnerabilities:

<!-- Add contributors here -->

Thank you for helping keep brAInwav secure!

---

## Related Documentation

- [AGENTS.md](AGENTS.md) - Operational governance rules (§9: Security)
- [llm-threat-controls.md](brainwav/governance/00-core/llm-threat-controls.md) - LLM-specific threat controls
- [AGENT_CHARTER.md](brainwav/governance/00-core/AGENT_CHARTER.md) - Agent behavioral constraints
- [checklists.md](brainwav/governance/20-checklists/checklists.md) - Quality gates including security
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Community standards
