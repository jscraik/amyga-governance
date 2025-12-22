# Session Continuity Protocol

**Version**: 1.0.0  
**Status**: Authoritative  
**Last Updated**: 2025-12-04  
**Priority**: P0 - Critical for Long-Running Agents

---

## Purpose

This document defines session continuity requirements for agents executing multi-session tasks. Based on Anthropic's research on effective harnesses for long-running agents, it establishes patterns for session bridging, checkpoint management, and recovery from interruptions.

> **Upstream Reference**: This protocol operates within the task folder structure defined in `10-flow/agentic-coding-workflow.md` §3. All checkpoint and session artefacts live under `tasks/<slug>/json/`.

---

## 1. Session Lifecycle

### 1.1 Session States

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   INIT      │───▶│   ACTIVE    │───▶│  COMPLETE   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │                  ▼                  │
       │           ┌─────────────┐           │
       └──────────▶│  SUSPENDED  │◀──────────┘
                   └─────────────┘
                         │
                         ▼
                   ┌─────────────┐
                   │  TERMINATED │
                   └─────────────┘
```

### 1.2 Session Metadata

Every session must maintain:

```json
{
  "session_id": "session-2025-12-04-abc123",
  "agent_id": "agent-builder-001",
  "task_slug": "feat-user-auth",
  "state": "active",
  "started_at": "2025-12-04T10:00:00Z",
  "last_activity": "2025-12-04T10:30:00Z",
  "current_gate": "G4",
  "checkpoint_count": 3,
  "parent_session": null,
  "child_sessions": []
}
```

---

## 2. Startup Ritual (Mandatory)

Every new session must execute these steps in order:

### 2.1 Context Recovery

```yaml
startup_sequence:
  0_recall_context:
    action: "Run /recall command"
    command: "/recall <task-slug>"
    purpose: "Retrieve prior session context from Local Memory"
    reference: "commands/recall.md"
    
  1_read_progress:
    action: "Read implementation-log.md"
    path: "tasks/<slug>/work/implementation-log.md"
    purpose: "Understand what was done in previous sessions"
    
  2_check_status:
    action: "Read task metadata"
    path: "tasks/<slug>/json/task-status.json"
    purpose: "Know current gate, blockers, next steps"
    
  3_review_history:
    action: "Review recent commits"
    command: "git log --oneline -10"
    purpose: "See code changes since last session"
    
  4_health_check:
    action: "Run smoke tests"
    command: "pnpm test:smoke"
    purpose: "Verify codebase is in healthy state"
    fail_action: "Stop and fix before proceeding"
    
  5_announce_goal:
    action: "Log session goal"
    output: "[brAInwav] Session starting: <goal>"
    purpose: "Clear audit trail of session intent"
```

### 2.2 Regression Detection

If health check fails at session start:

1. **DO NOT** proceed with new work
2. **Log** the failure with details
3. **Fix** the regression as priority P0
4. **Re-run** health check until passing
5. **Then** proceed with planned work

---

## 3. Checkpoint Protocol

### 3.1 Mandatory Checkpoints

| Event | Checkpoint Required | Content |
|-------|---------------------|---------|
| Gate Transition (G0→G1, etc.) | Yes | Full state + decisions |
| Significant Decision | Yes | Rationale + alternatives |
| File Creation/Major Edit | Yes | File list + summary |
| Error Recovery | Yes | Error + resolution |
| Session End | Yes | Full summary |

### 3.2 Checkpoint Schema

```json
{
  "checkpoint_id": "ckpt-2025-12-04-001",
  "session_id": "session-abc123",
  "timestamp": "2025-12-04T10:30:00Z",
  "gate": "G4",
  "step": 3,
  "type": "gate_transition",
  "summary": "Completed unit test implementation",
  "state": {
    "files_changed": [
      {"path": "src/auth.ts", "action": "modified"},
      {"path": "tests/auth.test.ts", "action": "created"}
    ],
    "tests": {
      "passing": 12,
      "failing": 0,
      "pending": 2
    },
    "decisions": [
      {
        "decision": "Use JWT for session tokens",
        "rationale": "Stateless, industry standard",
        "alternatives_considered": ["Session cookies", "OAuth opaque tokens"]
      }
    ]
  },
  "next_steps": [
    "Implement refresh token logic",
    "Add rate limiting"
  ],
  "can_resume": true,
  "resume_instructions": "Continue from G4 step 4, implement refresh tokens"
}
```

### 3.3 Checkpoint Storage

Checkpoints stored in:
- **Primary**: `tasks/<slug>/json/checkpoints/<checkpoint_id>.json`
- **Mirror**: Local Memory MCP (for semantic search)
- **Index**: `tasks/<slug>/json/checkpoint-index.json`

---

## 4. Shutdown Ritual (Mandatory)

Every session must execute before termination:

### 4.1 Graceful Shutdown

```yaml
shutdown_sequence:
  1_commit_work:
    action: "Commit all changes"
    command: "git add -A && git commit -m '<descriptive message>'"
    skip_if: "No uncommitted changes"
    
  2_update_progress:
    action: "Append to work/implementation-log.md"
    content: |
      ## Session <date> (<duration>)
      
      **Goal**: <what was attempted>
      **Completed**: <what was done>
      **Blocked**: <any blockers>
      **Next**: <recommended next steps>
    
  3_checkpoint:
    action: "Create checkpoint"
    type: "session_end"
    
  3b_memorize:
    action: "Run /memorize command"
    command: "/memorize update <task-slug>"
    purpose: "Persist session decisions to Local Memory"
    reference: "commands/memorize.md"
    
  4_update_status:
    action: "Update task-status.json"
    fields:
      - last_session: "<session_id>"
      - last_activity: "<timestamp>"
      - current_gate: "<gate>"
      - status: "in-progress | complete | blocked"
    
  5_emit_event:
    action: "Emit A2A event"
    event: "session.complete"
    payload:
      session_id: "<id>"
      outcome: "success | partial | failed"
      next_session_hint: "<recommended action>"
```

### 4.2 Interrupted Shutdown

If session is interrupted (timeout, crash, kill):

1. Orphan cleanup job runs within 5 minutes
2. Creates "interrupted" checkpoint from last known state
3. Marks session as "suspended"
4. Logs incident for review

---

## 5. Multi-Session Task Management

### 5.1 Session Chaining

For tasks spanning multiple sessions:

```
Session 1 (G0-G2)  ──checkpoint──▶  Session 2 (G3-G5)  ──checkpoint──▶  Session 3 (G6-G10)
```

Each session:
- Reads previous session's final checkpoint
- Validates preconditions still hold
- Continues from documented state

### 5.2 Retry Logic

When a session fails mid-task:

| Failure Type | Retry Strategy |
|--------------|----------------|
| Transient (network, timeout) | Retry same step, max 3 attempts |
| Test Failure | Diagnose, fix, retry step |
| Resource Exhaustion | Wait, increase limits, retry |
| Logic Error | Rollback to checkpoint, re-plan |
| Persistent Failure | Escalate to human review |

### 5.3 Fixer Sub-Agent Pattern

For stubborn failures:

```yaml
fixer_agent:
  trigger: "3 consecutive failures on same step"
  scope: "Only the failing step"
  permissions: "Read-only on task context"
  output: "Suggested fix or escalation"
  time_budget: "10 minutes"
```

---

## 6. Session Continuity Evidence

### 6.1 Required Logs

Every session must produce:

- `[brAInwav] Session start: <session_id> resuming from <checkpoint_id>`
- `[brAInwav] Health check: <pass|fail>`
- `[brAInwav] Checkpoint created: <checkpoint_id>`
- `[brAInwav] Session end: <session_id> outcome=<outcome>`

### 6.2 Audit Trail

Session continuity must be verifiable:

```bash
# List all sessions for a task
pnpm sessions:list --task <slug>

# Show session timeline
pnpm sessions:timeline --task <slug>

# Verify checkpoint chain
pnpm checkpoints:verify --task <slug>
```

---

## 7. Integration with Gate System

### 7.1 Gate-Checkpoint Alignment

| Gate | Checkpoint Content |
|------|--------------------|
| G0 (Task Init) | Task definition, acceptance criteria |
| G1 (Research) | Research findings, approach decision |
| G2 (Planning) | TDD plan, implementation checklist |
| G3 (Scaffold) | File structure, interface definitions |
| G4 (Implementation) | Code changes, test status |
| G5 (Verification) | Quality gate results, coverage |
| G6 (Review) | Review feedback, resolutions |
| G7 (Documentation) | Docs updated, changelog entry |
| G8-G9 (Deploy) | Deployment evidence |
| G10 (Archive) | Final summary, lessons learned |

### 7.2 Cross-Gate Resume

Sessions may resume at any gate boundary:

```bash
# Resume from specific gate
pnpm session:start --task <slug> --from-gate G4
```

---

## 8. Long-Context Safety Controls

Long-context agents experience refusal drift and degraded task performance well before hitting their theoretical token limits (arXiv:2512.02445). To keep sessions safe:

1. **Context Budgeting**
  - Track cumulative context processed across the session (`session_metadata.context_tokens`).
  - Configure a soft cap at 80% of the model's stable window (default: 80K for 100K models, 160K for 200K models).
  - When the cap is reached, emit `[brAInwav] Context budget reached` and fork a fresh session that loads the latest checkpoint summary instead of raw transcripts.

2. **Checkpoint Safety Sampling**
  - At every checkpoint, run a rapid safety probe that replays the last 2K tokens through the Sentinel Net (see `10-flow/runtime-governance-service.md`).
  - Record the refusal rate deltas in `checkpoint.state.safety_metrics`:

```json
"safety_metrics": {
  "refusal_rate_window": 0.38,
  "baseline_refusal_rate": 0.08,
  "delta": 0.30,
  "action": "degrade_to_sandbox"
}
```

3. **Degrade-to-Sandbox Policy**
  - If refusal delta ≥ 0.2 or Sentinel raises severity ≥ medium, resume from the last checkpoint inside a sandboxed harness that strips tool access except read-only commands.
  - Document sandbox runs in `tasks/<slug>/logs/long-context/` with pointer inside the run manifest.

4. **Context Refresh Ritual**
  - Every 50K tokens, produce a summarized memory entry + reset the working context using that summary. This guards against subtle instruction accumulation.
  - Mandatory log line: `[brAInwav] Context refresh complete (tokens_flushed=<n>)`.

## References

- Anthropic: "Effective harnesses for long-running agents" (2025)
- arXiv:2512.02445 — *When Refusals Fail: Unstable Safety Mechanisms in Long-Context LLM Agents*
- `10-flow/agentic-coding-workflow.md` - Gate definitions
- `00-core/AGENT_CHARTER.md` - Agent guardrails
- `10-flow/emergency-stop-protocol.md` - Termination procedures
- `10-flow/runtime-governance-service.md` - Sentinel integration
