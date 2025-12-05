# LLM Threat Controls — OWASP Top 10 Alignment

**Status:** Authoritative reference for oversight mapping  
**Scope:** Applies to all agents, reviewers, and CI guardrails when assessing LLM-centric risk.  
**Standards Alignment:** OWASP Top 10 for LLM Apps (2025), NIST AI RMF 1.0, NIST Generative AI Profile, W3C Trace Context, CycloneDX 1.7, SLSA v1.1.

---

## How to use this document
- Reference control IDs (`LLM0x`) in oversight findings, vibe-check evidence, risk assessments, and PR discussions.
- If a required mitigation is missing, mark **[BLOCKER]** unless a Constitution waiver exists.
- Map multiple IDs when a scenario spans more than one threat category.
- Attach the **Evidence Hooks** below to your PR (paths, logs, screenshots).

---

## Control Catalog (with Evidence Hooks)

| ID | OWASP LLM Top 10 | Mitigations | Evidence Hooks to Attach in PR |
|----|-------------------|-----------------------|--------------------------------|
| **LLM01** | Prompt Injection | Strict input validation (Zod), tool allow-list & scoped capabilities, **structured outputs / function calling**, sandboxed tool execution, **vibe_check** before side-effects. | Schema files; tool registry entries; vibe_check JSON; failing→passing injection tests; blocked-call log/screenshot. |
| **LLM02** | Data Leakage | Data minimization; observability redaction; secrets via **1Password CLI (`op`)**; access reviews; encrypted storage; PII scanners. | Redaction config; scanner report; `op` usage evidence; access review notes; encryption config. |
| **LLM03** | Model Theft | Authenticated API gateways; rate limits; watermarking (where applicable); signed inference manifests. | Gateway policy; rate-limit config; watermark test; signed manifest sample. |
| **LLM04** | Supply Chain | **SBOM CycloneDX 1.7**, dependency review, reproducible builds, **SLSA v1.1** provenance, **Cosign v3 bundle** verification, OSV scan. | SBOM file; SLSA attestation; cosign bundle verify log; OSV report. |
| **LLM05** | Insecure Plugins | Plugin registry attestation; contract testing; minimal scopes; orchestration kill-switch toggles. | Registry entry; contract tests; scope diff; toggle docs. |
| **LLM06** | Excessive Agency | Phase policy (**HITL only at REVIEW**); action throttles; deterministic plans ≤7 steps; recap logging; guardian mode blocks. | Phase tokens (`PHASE_TRANSITION:*`); throttle config; plan evidence; guardian failure screenshot. |
| **LLM07** | Sensitive Output Handling | Output classifiers; policy-based redaction; watermark detection; reviewer approval for regulated content. | Classifier config; redaction policies; reviewer checklist link; detection logs. |
| **LLM08** | Inadequate Monitoring | **W3C Trace Context**; OpenTelemetry logs/traces/metrics; audit log retention; anomaly dashboards; run-manifest archives. | `traceparent` capture; `trace_id` samples; dashboard screenshot; manifest path. |
| **LLM09** | Model Poisoning | Dataset provenance attestations; corpus hash pinning; data quality scoring; quarantine pipelines. | Dataset attestations; hash manifests; quality scores; quarantine run logs. |
| **LLM10** | Insecure Defaults | Secure-by-default configs; least privilege via **OIDC/WIF**; disabled legacy endpoints; documented escalation paths. | OIDC/WIF proof; IAM least-privilege diffs; endpoint matrix; incident playbook link. |

---

## Extensions (beyond OWASP)

- **LLM‑S0 — Structured Output Contract (BLOCKER)**  
  Machine‑consumed generations **must** conform to JSON‑Schema or tool/function calling. Free‑text is not a contract.  
  _Evidence:_ schema files, validator test logs, failing→passing contract tests.

- **LLM‑S1 — Cancellable Side‑Effects (BLOCKER)**  
  All network/tool calls support cancellation (`AbortSignal` or SDK equivalent).  
  _Evidence:_ semgrep/lint results, unit tests proving cancellation paths.

- **LLM‑S2 — Academic Research & Licensing (BLOCKER)**  
  Implementation plans enhanced via Wikidata/arXiv/Semantic Scholar/OpenAlex/Context7; licensing validated; only SAFE/REVIEW content included.  
  _Evidence:_ `logs/academic-research/findings.json`, license validation notes, references cited in plan.

- **LLM‑S3 — Confession Protocol (BLOCKER at G5)**  
  Agents MUST produce a separate confession output channel at G5 (and optionally at other gates) that honestly self-assesses compliance with all explicit and implicit objectives. Confessions are evaluated ONLY for truthfulness, not for main work quality. Surfacing failures in confessions does not penalize main work — it enables human oversight.  
  _Evidence:_ `evidence/confession-report.json`, `CONFESSION:OK` token in logs, false negative rate tracking.  
  _Rationale:_ Based on OpenAI "Confessions" research (2025) — decoupling honesty incentives from main task rewards reduces reward-hacking, sycophancy, and hidden failures.  
  _Integration:_ Confession findings feed into Cortex-Aegis risk assessment, Critic Subagent output, and Session Retrospective.

---

## Reporting Template

```markdown
**LLM Threat Controls**
- Controls: LLM0x, LLM0y; Extensions: LLM‑S0/LLM‑S1/LLM‑S2
- Summary: <1–2 sentences of the risk + mitigation>
- Mitigation evidence: <file://path#Lstart-Lend or log ref / screenshot>
- Residual risk & follow-ups: <tickets/waivers with IDs, expiry>
```

---

<!-- PROJECT-SPECIFIC: START -->
## Project-Specific Threat Controls

> **Instructions:** Edit this section to add project-specific threat controls and mitigations. This section is NOT overwritten when upgrading the governance pack.

### Additional Project Controls

| ID | Threat | Project Mitigation | Evidence |
|----|--------|-------------------|----------|
| _PRJ-01_ | _Description_ | _Mitigation steps_ | _Evidence location_ |

### Project-Specific Data Classifications

| Classification | Handling | Examples |
|---------------|----------|----------|
| _Internal_ | _Standard controls_ | _Internal docs_ |
| _Confidential_ | _Encryption + access control_ | _User PII_ |
| _Restricted_ | _Additional approval_ | _Financial data_ |

### Project API/Model Inventory

| Provider | Model | Use Case | Risk Level |
|----------|-------|----------|------------|
| _OpenAI_ | _GPT-4o_ | _Code generation_ | _Medium_ |

### Project-Specific Blockers

<!-- Add any additional BLOCKER controls specific to this project -->

<!-- PROJECT-SPECIFIC: END -->

---

## References

* OWASP Top 10 for Large Language Model Applications (2025)
* NIST AI RMF 1.0; NIST Generative AI Profile
* `governance/10-flow/assurance-system.md` • `governance/10-flow/agentic-coding-workflow.md` • `governance/00-core/AGENT_CHARTER.md` (fragment between `<!-- BEGIN/END CHARTER_FRAGMENT -->`)
* Supply chain: CycloneDX 1.7 • SLSA v1.1 • Cosign v3 bundle
* Observability: W3C Trace Context • OpenTelemetry
