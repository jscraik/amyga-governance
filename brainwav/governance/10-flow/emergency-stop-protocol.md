# Emergency Stop Protocol

**Version**: 1.0.0  
**Status**: Authoritative  
**Last Updated**: 2025-12-04  
**Priority**: P0 - Critical Safety Control

---

## Purpose

This document defines the emergency termination procedures for AI agents operating under the governance framework. It establishes clear triggers, procedures, and post-incident requirements for immediate agent shutdown.

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

## References

- NIST AI RMF - Govern function (risk management)
- EU AI Act Article 14 - Human oversight requirements
- `00-core/AGENT_CHARTER.md` - Guardrails
- `10-flow/agentic-coding-workflow.md` - Gate definitions
