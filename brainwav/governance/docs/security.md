# Security

The governance framework aligns with current security standards and requires specific tooling in CI/CD pipelines.

## Standards & References (December 2025)

| Standard | Version | Purpose |
|----------|---------|---------|
| OWASP Top 10 | 2025 RC1 | Web application security risks |
| OWASP ASVS | 5.0.0 (May 2025) | Application security verification |
| OWASP LLM Top 10 | 2025 | Large Language Model security risks |
| MITRE ATLAS | Current | AI/ML adversarial threat taxonomy |

## Required Security Tools

| Tool | Purpose | CI Gate |
|------|---------|---------|
| Semgrep | SAST scanning | BLOCKER on policy rules |
| Gitleaks | Secrets detection | BLOCKER on any finding |
| OSV/pnpm audit | Dependency vulnerabilities | BLOCKER on high/critical |
| Trivy | Container/IaC/license scanning | WARNING |
| CycloneDX | SBOM generation | Required for releases |
| Sigstore Cosign | Attestation signing | Required for releases |

## Security Requirements

- **Secrets:** Fetch on-demand via 1Password CLI `op`; no hard-coded secrets.
- **Containers:** Minimal base, pinned digests, non-root, read-only FS, drop caps.
- **Identity:** CI/services authenticate via OIDC/WIF (no static cloud keys).
- **SBOM:** CycloneDX 1.6+ with in-toto/SLSA provenance, Sigstore signed.

See [SECURITY.md](../../../SECURITY.md) for the full security policy.
