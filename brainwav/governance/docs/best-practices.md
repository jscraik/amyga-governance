---
summary: "Recommended patterns for adoption and delivery."
read_when: "Designing workflow or rollout"
applies_to: "core"
owner: "Governance Team"
---

# Best Practices

## Governance Workflow

- **Start with G0 (Intake)** – Define scope before planning.
- **Use the Phase Machine** – Follow R→G→F→REVIEW for all changes.
- **Keep arcs small** – ≤7 steps per arc, ≤120 minutes per vertical slice.
- **Run oversight before acting** – Vibe check, academic research, license validation.
- **Use Creative/Delivery/Release modes** – Creative for ideation (no side effects), Delivery for standard work (full gates), Release for supply‑chain and publication hardening.

## Evidence & Documentation

- **Capture the Evidence Triplet** – Milestone test, contract snapshot, reviewer JSON.
- **Use `/memorize`** – Store key decisions in Local Memory.
- **Cite sources** – Reference governance sections in PRs and commits.
- **Complete checklists** – Use the unified checklist from `20-checklists/checklists.md`.

## Security

- **Never commit secrets** – Use 1Password CLI `op` or environment variables.
- **Run security scans** – Semgrep, Gitleaks, OSV/Trivy before merging.
- **Generate SBOMs** – CycloneDX for all releases.
- **Sign attestations** – Sigstore Cosign for provenance.

## Code Quality

- **Test first (TDD)** – Write failing test, implement, refactor.
- **Named exports only** – No default exports.
- **≤40 lines per function** – Split if larger.
- **Use guard clauses** – Avoid nested conditionals.

## MCP Integration

- **Configure all MCP clients** – VS Code, Claude Desktop, RepoPrompt.
- **Log MCP sessions** – Record in run manifest.
- **Verify connector health** – Check before academic research.
