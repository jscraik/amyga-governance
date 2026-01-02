# Security Policy

brAInwav Agentic Governance is a framework for governing AI agents, MCP integrations, and LLM-assisted development workflows. While primarily documentation and tooling, it defines patterns that influence security-critical systems. This document describes our security practices and how to report vulnerabilities.

For operational governance rules, see [AGENTS.md](AGENTS.md). For LLM-specific threat controls, see [llm-threat-controls.md](brainwav/governance/00-core/llm-threat-controls.md).

---

## Table of Contents

- [Supported Versions](#supported-versions)
- [Standards & References (Jan 2026)](#standards--references-jan-2026)
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

## Standards & References (Jan 2026)

Pinned versions live in `brainwav/governance/90-infra/standards.versions.json` and are treated as the source of truth for this section.

If you update standards versions, update the registry first, then run `pnpm governance:sync-hashes` to refresh the governance index.

We align governance controls and verification with the following public standards/frameworks:

### OWASP Top 10 (Web/AppSec)
- Primary reference: **OWASP Top 10:2025** (final).
- We use it as a *risk taxonomy* and to drive secure coding training and scanning coverage.

References:
- https://owasp.org/Top10/
- https://owasp.org/Top10/2025/0x00_2025-Introduction/

### OWASP ASVS (Verification Standard)
- Primary verification catalog: **OWASP ASVS 5.0.0**.
- Applies to runtime systems *and* developer tooling that processes untrusted inputs or touches production credentials.

References:
- https://owasp.org/www-project-application-security-verification-standard/
- https://github.com/OWASP/ASVS

**ASVS targeting rule**
- “Internet-facing, multi-tenant, or handles authN/authZ”: meet **ASVS L2** minimum.
- “Handles PII/financial data/secrets, or executes tools/actions”: meet **ASVS L2** + LLM controls below.
- “Critical systems (payments, privileged infra, agent orchestration with broad access)”: meet **ASVS L3** where applicable.

### OWASP Top 10 for LLMs / GenAI Apps (Agentic/LLM Security)
- Primary reference: **OWASP Top 10 for LLMs 2025 (v1.1)** (LLM01–LLM10).

Reference: https://genai.owasp.org/llm-top-10/

### NIST SSDF (Secure Software Development Framework)
- Primary reference: **NIST SP 800-218 (SSDF) v1.1**.

References:
- https://doi.org/10.6028/NIST.SP.800-218
- https://csrc.nist.gov/pubs/sp/800/218/final

### NIST AI RMF + GenAI Profile
- Primary reference: **NIST AI RMF 1.0** and the **Generative AI Profile**.

References:
- https://www.nist.gov/itl/ai-risk-management-framework
- https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence

### Accessibility + AI Governance
- **WCAG 2.2 / ISO/IEC 40500:2025** for accessibility conformance.
- **ISO/IEC 42001:2023** for AI management system alignment where applicable.

References:
- https://www.w3.org/TR/WCAG22/
- https://www.iso.org/standard/42001.html

### Supply Chain Standards
- **SLSA Provenance v1.2**
- **CycloneDX 1.7**
- **SPDX 3.0.1**
- **OpenSSF Scorecard Action v2.2.0**
- **Sigstore Cosign**

References:
- https://slsa.dev/spec/v1.2/provenance
- https://cyclonedx.org/news/cyclonedx-v1-7-released
- https://spdx.github.io/spdx-spec/v3.0.1/
- https://github.com/ossf/scorecard-action
- https://docs.sigstore.dev/cosign/signing/overview/

### MITRE ATLAS (AI Adversary TTPs)
- Used for AI threat modeling and red-teaming scenarios.
- Findings and mitigations SHOULD be tagged with relevant ATLAS tactics/techniques.

Reference: https://atlas.mitre.org/

---

## Threat Model

brAInwav governance addresses threats across:
1. agent/LLM application behavior,
2. traditional web/app risks,
3. infrastructure and supply chain,
4. governance integrity.

### LLM & Agent Threats (OWASP LLM Top 10 2025)

| Threat | Minimum Mitigation | Reference |
|--------|---------------------|-----------|
| **LLM01:2025 Prompt Injection** | Strict tool schemas + allowlists; input/output validation; “no implicit tool execution”; audit trails | `llm-threat-controls.md` |
| **LLM02:2025 Sensitive Information Disclosure** | Secret redaction; least-priv data access; prevent prompt/log leakage; no secrets in context by default | AGENTS.md (§Security + logging) |
| **LLM03:2025 Supply Chain** | SBOMs; signed artifacts; pinned deps; scanner gates; model/dataset provenance | AGENTS.md §9 |
| **LLM04:2025 Data and Model Poisoning** | Dataset lineage; checksums; training/eval provenance; retrieval corpus integrity checks | `llm-threat-controls.md` + ML docs |
| **LLM05:2025 Improper Output Handling** | Treat outputs as untrusted; sanitize before rendering/executing; strict parsers; no eval | `llm-threat-controls.md` |
| **LLM06:2025 Excessive Agency** | Capability budgets; step limits; human-in-the-loop for risky tools; scoped tokens | `AGENT_CHARTER.md` |
| **LLM07:2025 System Prompt Leakage** | Prompt minimization; split secrets from prompts; prevent tool output echo; redaction | `llm-threat-controls.md` |
| **LLM08:2025 Vector and Embedding Weaknesses** | Tenant isolation; ACLs on retrieval; poisoning detection; safe chunking; query filtering | `llm-threat-controls.md` |
| **LLM09:2025 Misinformation** | Grounding policies; citations/evidence requirements; eval harness regressions block merges | Eval reports |
| **LLM10:2025 Unbounded Consumption** | Quotas, budgets, rate limits; timeouts; bounded tool loops; cost guards | `AGENT_CHARTER.md` |

### Web/Application Risks (OWASP Top 10:2025)

We use the OWASP Top 10:2025 list as a baseline taxonomy for all runtime systems:

- **A01:2025 Broken Access Control**
- **A02:2025 Security Misconfiguration**
- **A03:2025 Software Supply Chain Failures**
- **A04:2025 Cryptographic Failures**
- **A05:2025 Injection**
- **A06:2025 Insecure Design**
- **A07:2025 Authentication Failures**
- **A08:2025 Software or Data Integrity Failures**
- **A09:2025 Logging & Alerting Failures**
- **A10:2025 Mishandling of Exceptional Conditions**

### Infrastructure & Supply Chain Threats

| Threat | Minimum Mitigation | Reference |
|--------|---------------------|-----------|
| **Secrets Exposure** | Ephemeral injection (`op run` or approved secret manager); pre-commit + CI scanning | AGENTS.md §9 |
| **Dependency Vulnerabilities** | OSV + ecosystem audits; SBOM generation and scanning; patch SLAs | AGENTS.md §9 |
| **Container & IaC Misconfig** | Scan images/IaC; pinned digests; non-root; read-only FS; drop caps | AGENTS.md §9 |
| **Identity Spoofing** | OIDC/WIF; no long-lived cloud keys; scoped workload identity | AGENTS.md §9 |
| **Supply Chain Attacks** | SLSA provenance; signed releases; artifact attestations; CI hardening | checklists.md §5 |

### AI-Specific Adversary TTPs (MITRE ATLAS)

- Threat modeling and red-team work SHOULD use MITRE ATLAS as the “AI ATT&CK-style” catalog.
- Security issues and mitigations SHOULD include ATLAS technique tags when applicable (e.g., model theft, data poisoning, evasion, prompt injection).

### Governance-Specific Threats

| Threat | Mitigation |
|--------|------------|
| **Agent Charter Bypass** | CI enforcement via `charter-enforce` workflow, SHA-pinned governance index |
| **Unauthorized Governance Changes** | Hash validation in `governance-index.json`, maintainer approval required |
| **Fake Telemetry/Evidence** | Anti-patterns list (AGENTS.md), Evidence Triplet requirements |
| **Disable-the-guardrail attacks** | Any security gate disable requires maintainer waiver + time-boxed expiry |

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

After triage, maintainers may request a standard issue for tracking. Do **not** include exploits, credentials, or sensitive data. Expect acknowledgement within 48 hours; fixes are prioritized by severity.

---

<!-- PROJECT-SPECIFIC: START -->
## Project Security Contacts

> **Instructions:** Add project-specific security contacts and procedures here. This section is NOT overwritten when upgrading the governance pack.

### Security Team

- Primary contact: `security@your-project.example`
- Backup: `@your-security-lead`

### Project-Specific Security Requirements

<!-- Add any additional security requirements beyond the base governance pack -->

| Requirement | Implementation | Notes |
|-------------|----------------|-------|
| _none_ | — | — |

### Sensitive Data Handling

<!-- Document project-specific PII, credentials, or sensitive data flows -->

<!-- PROJECT-SPECIFIC: END -->

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

### CI Security Gates (Required)

| Gate | Tool | Minimum Policy |
|------|------|----------------|
| SAST / Semgrep | Semgrep | Block on policy rules; block on High+ where configured |
| Secret Detection | Gitleaks | `ANY=block` on PRs; allowlist only for rotated/inactive/false-positive secrets |
| Dependency Audit | OSV + ecosystem audits | Block on High/Critical for runtime deps |
| Container & IaC Scan | Trivy | Block on Critical/High vulns; block on High misconfig; block on detected secrets |
| SBOM Generation | CycloneDX | Required for releases |
| Attestation & Signing | Sigstore Cosign | Required for releases; verify before publish |

### Tooling Notes & Expectations

#### Semgrep
- Semgrep rules MUST be run in CI.
- Any “waiver” must be time-boxed and recorded (see waiver process).
- Where Semgrep policies are used, rules can be set to “Block” for PR/MR gating.

#### Trivy (containers / repos / IaC)
- Trivy MUST scan:
   - container images for vulns + secrets (+ misconfig where applicable),
   - infrastructure-as-code (Dockerfiles, Kubernetes, Terraform, CloudFormation, Helm),
   - and (where used) SBOMs or installed packages.
- Use scanner selection explicitly when needed (`--scanners vuln,misconfig,secret,license`).

#### Gitleaks
- Run as:
   - pre-commit (developer workstation) AND
   - CI gate (PR and main)
- Maintain a `.gitleaks.toml` allowlist for rotated/inactive/false positives; do not “hide” live secrets.

### Automated Checks

- `pnpm security:scan` - Runs Semgrep + gitleaks + OSV audit
- `pnpm sbom:generate` - Generates CycloneDX SBOM
- `pnpm attest:sign` - Creates SLSA provenance bundle
- CI gates run on every pull request (see `checklists.md` §5)

### Governance Integrity

- `governance-index.json` contains SHA-256 hashes of all governance documents
- `charter-enforce` workflow validates hashes on every PR
- Hash updates require maintainer approval per `governance-maintainers.md`

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

## Related Documentation

- [AGENTS.md](AGENTS.md) - Operational governance rules (§9: Security)
- [llm-threat-controls.md](brainwav/governance/00-core/llm-threat-controls.md) - LLM-specific threat controls
- [AGENT_CHARTER.md](brainwav/governance/00-core/AGENT_CHARTER.md) - Agent behavioral constraints
- [checklists.md](brainwav/governance/20-checklists/checklists.md) - Quality gates including security
