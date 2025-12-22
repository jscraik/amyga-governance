# Agentic AI Governance Research Summary — December 2025

> Curated references for strengthening the project-neutral governance framework. Each paper includes actionable hooks into the repo.

## Top-Line Themes

| Theme | Research Inputs | Recommended Actions |
| --- | --- | --- |
| **System-Level Safety** | arXiv:2512.02682, 2511.21990 | Extend kill switches + continuity protocols to watch interaction graphs, not only single agents. Add ESRH monitoring hooks. |
| **Runtime Governance-as-a-Service** | arXiv:2508.18765, 2510.25863 | Stand up a policy-driven runtime enforcement layer (trust scoring, zero-trust mesh, explainable policy engine) documented in `10-flow/runtime-governance-service.md`. |
| **MCP Security & Memory Provenance** | arXiv:2511.20920, 2506.13794 | Enforce scoped auth, provenance signatures, and AgentFacts metadata in `10-flow/memory-governance.md` + model cards. |
| **Long-Context Safety Drift** | arXiv:2512.02445 | Cap cumulative context, introduce checkpoint-based refusal monitoring in `10-flow/session-continuity.md`. |
| **Sentinel & Coordinator Agents** | arXiv:2509.14956 | Wire sentinel/coordinator pattern into `10-flow/emergency-stop-protocol.md` and runtime governance doc. |
| **Risk Scoring & TRiSM Metrics** | arXiv:2510.15739, 2506.04133 | Adopt gamma-based autonomy risk scores + CSS/TUE telemetry for multi-agent runs. |

## Paper Notes & Hooks

### arXiv:2512.02682 — *Beyond Single-Agent Safety: A Taxonomy of Risks in LLM-to-LLM Interactions*
- Introduces the **Emergent Systemic Risk Horizon (ESRH)** to reason about cascading failures.
- Recommends **InstitutionalAI** oversight layers embedded across agent meshes.
- **Repo hooks**: Add ESRH trigger checks to the emergency stop protocol; require sentinel/coordinator coverage for chains longer than N hops.

### arXiv:2512.02445 — *When Refusals Fail: Unstable Safety Mechanisms in Long-Context LLM Agents*
- Shows refusal rates and task performance drift unpredictably beyond 100K tokens.
- Recommends periodic safety refresh, context chunking, and degrade-to-sandbox policies.
- **Repo hooks**: Add long-context guardrails plus context quotas to `session-continuity.md`; require safety sampling at every checkpoint.

### arXiv:2511.21990 — *A Safety and Security Framework for Real-World Agentic Systems*
- Proposes dynamic **agentic risk taxonomy** spanning safety + security.
- Highlights sandboxed AI-driven red teaming with auxiliary agents.
- **Repo hooks**: Reference this framework inside runtime governance doc and checklists (risk discovery evidence, sandbox red teaming requirement at G5).

### arXiv:2511.20920 — *Securing the Model Context Protocol (MCP): Risks, Controls, and Governance*
- Details adversaries for MCP (content injection, supply chain, over-reaching agents).
- Mitigations: scoped auth, provenance tracking, sandboxing, policy gateways.
- **Repo hooks**: `memory-governance.md` + runtime governance doc must call out provenance signatures and sandboxing; `model-card-template.md` needs MCP control status.

### arXiv:2509.14956 — *Sentinel Agents for Secure and Trustworthy Agentic AI in Multi-Agent Systems*
- Two-layer defense: sentinel monitors + coordinator enforcement.
- Validated across 162 simulated attacks (prompt injection, hallucinations, exfiltration).
- **Repo hooks**: Document sentinel deployment expectations in emergency stop & runtime governance docs.

### arXiv:2510.25863 — *AAGATE: A NIST AI RMF-Aligned Governance Platform for Agentic AI*
- Operationalizes NIST AI RMF with zero-trust mesh, explainable policy engine, decentralized accountability.
- **Repo hooks**: Provide blueprint for Governance-as-a-Service doc + trust factor references in checklists.

### arXiv:2508.18765 — *Governance-as-a-Service: A Multi-Agent Framework for AI System Compliance and Policy Enforcement*
- Defines declarative runtime policy enforcement with trust scores, adaptive interventions, and audit logging.
- **Repo hooks**: runtime governance doc + checklist entries for trust score evidence.

### arXiv:2510.15739 — *AURA: An Agent Autonomy Risk Assessment Framework*
- Gamma-based risk scoring, HITL-friendly, MCP/A2A interoperability.
- **Repo hooks**: Introduce autonomy risk scoring requirement in runtime governance doc and checklists.

### arXiv:2506.13794 — *AgentFacts: Universal KYA Standard for Verified AI Agent Metadata & Deployment*
- Cryptographically signed capability declarations + multi-authority validation.
- **Repo hooks**: New `agent-verification-policy.md` + additional model card fields + checklist items.

### arXiv:2506.04133 — *TRiSM for Agentic AI*
- Extends TRiSM pillars to agentic multi-agent systems; introduces CSS (Component Synergy Score) + TUE (Tool Utilization Efficacy).
- **Repo hooks**: Encourage telemetry capture inside runtime governance doc and observational guidance for sentinel layer.

## Repository Mapping Table

| Paper | Repository Target | Change Summary |
| --- | --- | --- |
| 2512.02682 | `10-flow/emergency-stop-protocol.md`, `10-flow/runtime-governance-service.md` | Add ESRH monitoring + systemic risk escalation path. |
| 2512.02445 | `10-flow/session-continuity.md` | Long-context safeguards, refusal drift sampling, degrade-to-sandbox. |
| 2511.21990 | `10-flow/runtime-governance-service.md`, `20-checklists/checklists.md` | Risk taxonomy adoption, sandboxed red teaming evidence. |
| 2511.20920 | `10-flow/memory-governance.md`, `templates/model-card-template.md` | Provenance signatures, scoped auth, MCP control attestations. |
| 2509.14956 | `10-flow/emergency-stop-protocol.md`, runtime doc | Sentinel + Coordinator enforcement expectations. |
| 2510.25863 | `10-flow/runtime-governance-service.md` | NIST AI RMF alignment, zero-trust mesh, explainable policy engine. |
| 2508.18765 | `10-flow/runtime-governance-service.md`, `20-checklists/checklists.md` | Trust Factor ledger + runtime policy enforcement evidence. |
| 2510.15739 | Runtime doc, checklists | Autonomy risk scoring and HITL checkpoints. |
| 2506.13794 | `00-core/agent-verification-policy.md`, `templates/model-card-template.md`, checklists | AgentFacts metadata & verification gate. |
| 2506.04133 | Runtime doc | CSS/TUE telemetry requirements. |

## Next Review Cadence

- Re-run arXiv scan quarterly (next due **2026-03-01**).
- Update this summary when:
  - New MCP guidance or sentinel studies surface.
  - EU AI Act delegated acts or ISO/IEC 42001 updates require doc changes.

## Citation Log

1. Beyond Single-Agent Safety: A Taxonomy of Risks in LLM-to-LLM Interactions. arXiv:2512.02682 (Dec 2025).
2. When Refusals Fail: Unstable Safety Mechanisms in Long-Context LLM Agents. arXiv:2512.02445 (Dec 2025).
3. A Safety and Security Framework for Real-World Agentic Systems. arXiv:2511.21990 (Nov 2025).
4. Securing the Model Context Protocol (MCP): Risks, Controls, and Governance. arXiv:2511.20920 (Nov 2025).
5. Sentinel Agents for Secure and Trustworthy Agentic AI in Multi-Agent Systems. arXiv:2509.14956 (Sep 2025).
6. AAGATE: A NIST AI RMF-Aligned Governance Platform for Agentic AI. arXiv:2510.25863 (Oct 2025).
7. Governance-as-a-Service: A Multi-Agent Framework for AI System Compliance and Policy Enforcement. arXiv:2508.18765 (Aug 2025).
8. AURA: An Agent Autonomy Risk Assessment Framework. arXiv:2510.15739 (Oct 2025).
9. AgentFacts: Universal KYA Standard for Verified AI Agent Metadata & Deployment. arXiv:2506.13794 (Jun 2025).
10. TRiSM for Agentic AI: Trust, Risk, and Security Management. arXiv:2506.04133 (Sep 2025).
