# Runtime Governance-as-a-Service Blueprint

**Version**: 1.0.0  
**Status**: Authoritative  
**Last Updated**: 2025-12-04  
**Sources**: arXiv:2508.18765 (Governance-as-a-Service), arXiv:2510.25863 (AAGATE), arXiv:2511.21990 (Agentic safety framework), arXiv:2509.14956 (Sentinel agents), arXiv:2510.15739 (AURA), arXiv:2506.04133 (TRiSM)

---

## 1. Purpose

Define the runtime enforcement layer that decouples governance from agent implementations. The service intercepts actions in real time, enforces policies, updates trust factors, and orchestrates sentinel/coordinator agents.

---

## 2. Architecture Overview

```
┌───────────┐   actions    ┌───────────────┐   adjudicated   ┌───────────────┐
│  Agents   │ ───────────▶ │  Policy Gate  │ ───────────────▶ │ Tool / Target │
└───────────┘              │  (mesh + wasm)│                  └───────────────┘
       │                   │       │
       │ telemetry         │       │ decisions
       ▼                   ▼       ▼
┌────────────┐       ┌──────────────┐       ┌──────────────┐
│ Trust Core │◀──────│ Sentinel Net │◀──────│ Coordinator  │
└────────────┘       └──────────────┘       └──────────────┘
```

Components:
- **Policy Gate**: WASM-enabled decision point running inside a zero-trust service mesh (per AAGATE). Policies expressed in Rego + JSON Schema for structured outputs.
- **Sentinel Net**: Distributed monitor agents inspecting prompts, tool calls, and telemetry (arXiv:2509.14956).
- **Coordinator**: Applies enforcement (quarantine, rate limit, revocation) and reports to incident response.
- **Trust Core**: Maintains Trust Factor ledger + AURA gamma risk scores; exposes `/trust/<agent_id>` API.

---

## 3. Control Plane Functions (NIST AI RMF Mapping)

| Function | Implementation |
| --- | --- |
| **Map** | Agentic risk taxonomy (arXiv:2511.21990) + MAESTRO threat modeling (AAGATE). |
| **Measure** | Sentinel telemetry feeds TRiSM CSS/TUE metrics; sandbox red-teaming traces attached at G5. |
| **Manage** | Trust Factor modulation, adaptive throttling, automated kill switch triggers. |
| **Govern** | Evidence stored in `logs/runtime-governance/` with signed manifests.

---

## 4. Trust Factor & Risk Scoring

- **Trust Factor (0-100)**: Initialized per `agent-verification-policy.md`, adjusted on every policy decision.
- **AURA Gamma Score**: `gamma = autonomy_degree × impact × exposure`; computed daily.
- **Escalations**:
  - Trust <70: enforce enhanced monitoring.
  - Trust <50 or gamma >0.6: require HITL approval per session.
  - Trust <30: auto-suspend; notify maintainers.

```yaml
trust_update:
  inputs:
    - policy_violation: severity
    - sentinel_alerts: count
    - compliance_log: pass/fail
  outputs:
    trust_delta: [-25, +10]
    actions:
      - sandbox
      - throttle
      - revoke_agentfacts
```

---

## 5. Policy Authoring & Distribution

- Policies stored under `policies/runtime/` (OPA/Rego) with version pinning.
- `pnpm runtime-policy:test` runs unit + scenario tests.
- `pnpm runtime-policy:bundle` outputs signed WASM bundle for mesh sidecars.
- Policy changes require:
  - Updated Evidence Triplet referencing arXiv sources.
  - Regen of `export-freeze.snapshot.json` hashes per `GOVERNANCE_HASH_UPDATE.md`.

---

## 6. Sentinel & Coordinator Pattern

- **Sentinel Agents** (arXiv:2509.14956):
  - Monitor inter-agent communication, tool calls, and memory writes.
  - Run retrieval-augmented verification; flag anomalies with severity + evidence.
- **Coordinator Agent**:
  - Collects sentinel alerts; performs ESRH analysis (arXiv:2512.02682).
  - Applies containment: isolate agent, cut tool access, trigger emergency stop.
- Deployment Targets:
  - Minimum 2 sentinel instances per environment.
  - Coordinator must run within governance namespace with privileged auditing rights.

---

## 7. MCP & Memory Controls

- Enforce scoped auth + bounded namespaces (arXiv:2511.20920).
- All MCP tools behind policy gateway; requests include `traceparent` + AgentFacts signature.
- Memory writes require provenance tuple: `{agent_id, session_id, capability_sig, content_hash}`.
- DLP + anomaly detection inline using governance service plug-ins.

---

## 8. Runtime Evidence Requirements

| Evidence | Location |
| --- | --- |
| Trust Factor ledger | `logs/runtime-governance/trust-ledger.ndjson` |
| Sentinel alerts | `logs/runtime-governance/sentinel-alerts.ndjson` |
| Policy bundle hash | `logs/runtime-governance/policy-manifest.json` |
| Red-teaming traces | `logs/runtime-governance/redteam/<date>.jsonl` |
| AURA gamma snapshot | `logs/runtime-governance/autonomy-risk.json` |

These artefacts are referenced in `run-manifest.json.evidence.runtime` for tasks touching runtime enforcement.

---

## 9. Integration with ArcTDD Gates

| Gate | Requirement |
| --- | --- |
| G2 | New policies reviewed; Aegis run includes runtime governance impact. |
| G4 | Implemented features register sentinel hooks + policy references. |
| G5 | Attach Trust Factor evidence, sentinel alert diff, red-team traces (if risk ≥ medium). |
| G6 | Reviewers confirm governance logs + AgentFacts references. |

---

## 10. Operations

```bash
# Deploy runtime governance service (Nx target)
pnpm nx run runtime-governance:deploy --env staging

# Check trust score for an agent
pnpm runtime-governance:trust --agent-id <uuid>

# Simulate sentinel drill
pnpm runtime-governance:simulate --scenario prompt-injection --agent-id <uuid>
```

- **Health Checks**: `pnpm runtime-governance:health` publishes service stats and last policy bundle hash.
- **Incident Flow**: On SEV1 alerts, runtime service triggers `pnpm agent:kill --session <id>` per emergency protocol.

---

## 11. References

- Governance-as-a-Service — arXiv:2508.18765
- AAGATE / NIST AI RMF alignment — arXiv:2510.25863
- Agentic Safety & Security Framework — arXiv:2511.21990
- Sentinel Agents — arXiv:2509.14956
- AURA — arXiv:2510.15739
- TRiSM for Agentic AI — arXiv:2506.04133
