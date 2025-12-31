---
summary: "Security standards and CI gate requirements."
read_when: "Security tooling or compliance alignment"
---

# Security

The governance framework aligns with current security standards and requires specific tooling in CI/CD pipelines.

## Standards & References (December 2025)

Pinned versions live in `brainwav/governance/90-infra/standards.versions.json` and are treated as the source of truth for this table. Update the registry first, then run `pnpm governance:sync-hashes`.

| Standard | Version | Purpose |
|----------|---------|---------|
| OWASP Top 10 | 2025 | Web application security risks |
| OWASP ASVS | 5.0.0 | Application security verification |
| OWASP LLM Top 10 | 2025 (v1.1) | Large Language Model security risks |
| NIST SSDF | 1.1 | Secure software development framework |
| NIST AI RMF | 1.0 + GenAI Profile | AI risk management |
| WCAG | 2.2 (ISO/IEC 40500:2025) | Accessibility standard |
| SLSA | Provenance v1.2 | Supply-chain provenance |
| CycloneDX | 1.7 | SBOM format |
| SPDX | 3.0.1 | SBOM standard |
| MITRE ATLAS | Current | AI/ML adversarial threat taxonomy |

## Required Security Tools

| Tool | Purpose | CI Gate |
|------|---------|---------|
| Semgrep | SAST scanning | BLOCKER on policy rules |
| Gitleaks | Secrets detection | BLOCKER on any finding |
| OSV/pnpm audit | Dependency vulnerabilities | BLOCKER on high/critical |
| Trivy | Container/IaC/license scanning | WARNING |
| CycloneDX 1.7 | SBOM generation | Required for releases |
| SPDX 3.0.1 | SBOM interchange | Required for releases |
| Sigstore Cosign | Attestation signing | Required for releases |
| OpenSSF Scorecard | Supply-chain posture | Required on release branches |

## Security Requirements

- **Secrets:** Fetch on-demand via 1Password CLI `op`; no hard-coded secrets.
- **Containers:** Minimal base, pinned digests, non-root, read-only FS, drop caps.
- **Identity:** CI/services authenticate via OIDC/WIF (no static cloud keys).
- **SBOM:** CycloneDX 1.7 or SPDX 3.0.1 with SLSA provenance and Sigstore signing.

See [SECURITY.md](../../../SECURITY.md) for the full security policy.
