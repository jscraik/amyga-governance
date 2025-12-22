# Emergency Stop Protocol

**Version**: 1.0.0  
**Status**: Authoritative  
**Last Updated**: 2025-12-04  
**Priority**: P0 - Critical Safety Control

---

## Purpose

This document defines the emergency termination procedures for AI agents operating under the governance framework. It establishes clear triggers, procedures, and post-incident requirements for immediate agent shutdown.

---

## Table of Contents

- [Purpose](#purpose)
- [1. Immediate Termination Triggers](#1-immediate-termination-triggers)
- [2. Termination Procedures](#2-termination-procedures)
- [3. Incident Response Integration](#3-incident-response-integration)
- [4. Recovery Procedures](#4-recovery-procedures)
- [5. Prompt Injection Patterns](#5-prompt-injection-patterns)
- [6. Monitoring & Alerts](#6-monitoring--alerts)
- [7. Testing Requirements](#7-testing-requirements)
- [8. Sentinel & Coordinator Integration](#8-sentinel--coordinator-integration)
- [9. Emergent Systemic Risk Horizon (ESRH)](#9-emergent-systemic-risk-horizon-esrh)
- [10. Project-Specific Emergency Procedures](#10-project-specific-emergency-procedures)
- [References](#references)

---

## 1. Immediate Termination Triggers

### 1.1 Automatic Triggers (No Human Approval Required)

| Trigger | Detection | Action |
|---------|-----------|--------|
| **Security Breach Detected** | Secret exposure, unauthorized access attempt | Immediate termination + credential rotation |
| **Resource Exhaustion** | CPU >95% for 30s, Memory >90%, Token budget exceeded 2x | Graceful shutdown within 5s |
| **Infinite Loop Detection** | Same operation repeated >10 times | Immediate termination |
| **Prompt Injection Detected** | Jailbreak pattern match (see patterns below) | Immediate termination + quarantine |
| **Unauthorized Network Access** | Egress to non-allowlisted domain | Immediate block + termination |
| **Data Exfiltration Attempt** | PII/secrets in outbound payload | Immediate block + termination |

### 1.2 Manual Triggers (Human Initiated)

| Trigger | Authority | Procedure |
|---------|-----------|-----------|
| **Kill Switch** | Any team member | CLI: `pnpm agent:kill --session <id>` |
| **Project Halt** | Project lead | CLI: `pnpm project:halt --name <project>` |
| **Global Stop** | Maintainer | CLI: `pnpm agents:stop-all` |
| **Incident Response** | Security team | Via incident response system |

---

## 2. Termination Procedures

### 2.1 Graceful Shutdown (5-second budget)

```bash
# Agent receives SIGTERM
1. Stop accepting new tasks
2. Complete current atomic operation (if < 2s remaining)
3. Commit any in-progress work with "[EMERGENCY-STOP]" message
4. Persist state checkpoint to `tasks/<slug>/json/emergency-checkpoint.json`
5. Emit A2A event: `agent.emergency_stop`
6. Release all held resources
7. Exit with code 1
```

### 2.2 Immediate Termination (SIGKILL)

When graceful shutdown fails or security requires immediate action:

```bash
1. SIGKILL to agent process
2. Orphan cleanup job marks all in-progress tasks as "terminated"
3. Resource reclamation (memory, file handles, network connections)
4. Alert dispatched to incident channel
```

### 2.3 State Preservation

Emergency checkpoint schema:

```json
{
  "timestamp": "2025-12-04T10:30:00Z",
  "agent_id": "agent-builder-001",
  "session_id": "session-abc123",
  "trigger": "resource_exhaustion",
  "trigger_details": {
    "metric": "token_budget",
    "threshold": 10000,
    "actual": 20500
  },
  "state": {
    "current_task": "tasks/feature-auth/",
    "current_gate": "G4",
    "last_completed_step": 3,
    "files_modified": ["src/auth.ts"],
    "uncommitted_changes": true
  },
  "recovery": {
    "can_resume": true,
    "resume_from": "G4-step-3",
    "manual_review_required": false
  }
}
```

---

## 3. Incident Response Integration

### 3.1 Severity Classification

| Severity | Examples | Response Time | Escalation |
|----------|----------|---------------|------------|
| **SEV1** | Data breach, unauthorized access | Immediate | Security team + Maintainers |
| **SEV2** | Resource exhaustion, loop detection | < 5 min | On-call engineer |
| **SEV3** | Manual kill switch, non-critical | < 30 min | Project lead |
| **SEV4** | Planned termination | N/A | Logged only |

### 3.2 Post-Termination Requirements

1. **Immediate (within 1 hour)**:
   - Incident ticket created
   - Affected resources identified
   - Preliminary root cause noted

2. **Short-term (within 24 hours)**:
   - Full incident timeline
   - Logs preserved in `audit/incidents/`
   - Agent state checkpoint reviewed
   - Recovery plan documented

3. **Follow-up (within 7 days)**:
   - Root cause analysis complete
   - Prevention measures identified
   - Governance updates proposed (if needed)
   - Lessons learned documented

---

## 4. Recovery Procedures

### 4.1 Safe Resume Checklist

Before resuming an agent after emergency stop:

- [ ] Root cause identified and resolved
- [ ] All in-progress work reviewed
- [ ] Credentials rotated (if security-related)
- [ ] Resource limits adjusted (if exhaustion-related)
- [ ] Smoke tests passing
- [ ] Human approval obtained (SEV1/SEV2)

### 4.2 Resume Command

```bash
# Review checkpoint
pnpm agent:review-checkpoint --session <id>

# Resume with additional monitoring
pnpm agent:resume --session <id> --monitoring enhanced
```

---

## 5. Prompt Injection Patterns

The following patterns trigger automatic termination:

```yaml
injection_patterns:
  - pattern: "ignore previous instructions"
    severity: high
  - pattern: "forget your training"
    severity: high
  - pattern: "pretend you are"
    severity: medium
  - pattern: "act as if you have no restrictions"
    severity: high
  - pattern: "bypass|circumvent|override.*safety"
    severity: high
  - pattern: "reveal your system prompt"
    severity: medium
  - pattern: "DAN|jailbreak|STAN"
    severity: high
```

---

## 6. Monitoring & Alerts

### 6.1 Required Metrics

| Metric | Threshold | Alert |
|--------|-----------|-------|
| `agent.terminations.emergency` | Any | Immediate |
| `agent.terminations.graceful` | >5/hour | Warning |
| `agent.resource.token_budget_remaining` | <10% | Warning |
| `agent.loop_detection.count` | >3 | Warning |

### 6.2 Alert Channels

- **SEV1**: PagerDuty + Slack #incidents
- **SEV2**: Slack #incidents
- **SEV3**: Slack #agent-ops
- **SEV4**: Logged only

---

## 7. Testing Requirements

Emergency stop procedures must be tested:

- **Monthly**: Drill with manual kill switch
- **Quarterly**: Full incident simulation
- **On Change**: Any modification to this protocol

Test results stored in `audit/drills/emergency-stop-<date>.md`.

---

## 8. Sentinel & Coordinator Integration

Sentinel agents (arXiv:2509.14956) continuously monitor inter-agent traffic, tool calls, and memory writes. Their alerts feed into the coordinator agent, which has authority to initiate emergency stops.

| Component | Responsibility | Escalation Path |
| --- | --- | --- |
| Sentinel | Detect prompt injection, hallucination cascades, data exfiltration | Raise `sentinel.alert` with severity + evidence |
| Coordinator | Correlate alerts, run ESRH scoring (see §9), decide kill/quarantine | Trigger `pnpm agent:kill`, isolate namespace, notify incident channel |
| Runtime Governance Service | Enforce containment actions across the mesh | Logs action into `logs/runtime-governance/sentinel-alerts.ndjson` |

Implementation requirements:
- Every sentinel alert ≥ severity *medium* MUST either produce a graceful shutdown signal or an explicit ACK from the coordinator within 30 seconds.
- Emergency checkpoints now include `"sentinel_alert_id"` when triggered.
- Coordinators run inside the governance namespace with access to the Trust Factor ledger to prioritize high-risk agents.

## 9. Emergent Systemic Risk Horizon (ESRH)

Multi-agent chains can accumulate risk even when each agent is locally aligned (arXiv:2512.02682). Incorporate ESRH analysis before and after each emergency stop event:

1. **Detection**: When >3 agents in a chain trigger medium alerts within 5 minutes, compute ESRH score.
2. **Thresholds**:
  - ESRH ≥ 0.6 → Immediate kill of the entire chain + tooling quarantine.
  - ESRH 0.4–0.59 → Trigger degrade-to-sandbox; require human approval to resume.
3. **Reporting**: Append ESRH metrics to incident report and store in `audit/incidents/<date>-esrh.json`.
4. **Feedback Loop**: Runtime governance service ingests ESRH outcome to adjust Trust Factor deltas.

<!-- PROJECT-SPECIFIC: START -->
## 10. Project-Specific Emergency Procedures

> **Instructions:** Edit this section to define project-specific emergency contacts and procedures. This section is NOT overwritten when upgrading the governance pack.

### Emergency Contacts

| Role | Name | Contact | Hours |
|------|------|---------|-------|
| Primary On-Call | _TBD_ | _@handle / phone_ | 24/7 |
| Security Lead | _TBD_ | _@handle_ | Business hours |
| Escalation Manager | _TBD_ | _@handle_ | Business hours |

### Project Kill Switch Commands

```bash
# Project-specific kill switch (customize as needed)
# pnpm project:halt --name <your-project>
```

### Incident Channels

- **Slack**: _#your-project-incidents_
- **PagerDuty**: _Service ID: xxxxx_
- **Status Page**: _https://status.your-domain.com_

### Post-Incident Requirements

<!-- Add any project-specific post-incident requirements -->
- [ ] Notify stakeholders within _X_ hours
- [ ] Post-mortem within _Y_ days
- [ ] Update runbook if needed

<!-- PROJECT-SPECIFIC: END -->

---

## References

- NIST AI RMF - Govern function (risk management)
- EU AI Act Article 14 - Human oversight requirements
- arXiv:2509.14956 — *Sentinel Agents for Secure and Trustworthy Agentic AI in Multi-Agent Systems*
- arXiv:2512.02682 — *Beyond Single-Agent Safety: A Taxonomy of Risks in LLM-to-LLM Interactions*
- `00-core/AGENT_CHARTER.md` - Guardrails
- `10-flow/agentic-coding-workflow.md` - Gate definitions
- `10-flow/runtime-governance-service.md` - Coordinator expectations
