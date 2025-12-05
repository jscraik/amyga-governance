# Memory Governance Policy

**Version**: 1.0.0  
**Status**: Authoritative  
**Last Updated**: 2025-12-04  
**Priority**: P1 - Essential for Stateful Operations

---

## Purpose

This document establishes governance policies for persistent AI memory operations. Based on OpenMemory MCP architecture patterns, it defines access control, audit requirements, retention policies, and multi-agent coordination through shared memory.

---

## Table of Contents

- [Purpose](#purpose)
- [1. Memory Architecture](#1-memory-architecture)
- [2. Access Control](#2-access-control)
- [3. Audit Requirements](#3-audit-requirements)
- [4. Retention Policies](#4-retention-policies)
- [5. Content Policies](#5-content-policies)
- [6. Multi-Agent Coordination](#6-multi-agent-coordination)
- [7. Memory Parity Requirements](#7-memory-parity-requirements)
- [8. Privacy & Compliance](#8-privacy--compliance)
- [9. Monitoring & Alerts](#9-monitoring--alerts)
- [10. MCP Security & AgentFacts Provenance](#10-mcp-security--agentfacts-provenance)
- [11. Project-Specific Memory Configuration](#11-project-specific-memory-configuration)
- [References](#references)

---

## 1. Memory Architecture

### 1.1 Memory Types

| Type | TTL | Purpose | Access |
|------|-----|---------|--------|
| **Short-term** | 24 hours | Current task context | Agent + Task scope |
| **Working** | 7 days | Active project decisions | Project scope |
| **Long-term** | 90 days | Important learnings | Cross-project |
| **Persistent** | Indefinite | Core knowledge, policies | Global read |

### 1.2 Memory Entry Schema

```json
{
  "id": "mem-2025-12-04-abc123",
  "type": "short-term",
  "content": "User prefers TypeScript over JavaScript for new modules",
  "importance": 8,
  "tags": ["preference", "typescript", "coding-style"],
  "domain": "development",
  "created_at": "2025-12-04T10:00:00Z",
  "expires_at": "2025-12-05T10:00:00Z",
  "created_by": {
    "agent_id": "agent-builder-001",
    "session_id": "session-abc123",
    "task_slug": "feat-user-auth"
  },
  "governance": {
    "data_classification": "internal",
    "purpose_of_processing": ["engineering_evidence"],
    "retention_days": 1,
    "erasure_method": "scheduled_delete"
  }
}
```

---

## 2. Access Control

### 2.1 Permission Model

| Operation | Agent | Reviewer | Admin |
|-----------|-------|----------|-------|
| `search_memory` | ✅ | ✅ | ✅ |
| `get_memory_by_id` | ✅ | ✅ | ✅ |
| `store_memory` | ✅ | ✅ | ✅ |
| `update_memory` | Own only | ✅ | ✅ |
| `delete_memory` | ❌ | Own only | ✅ |
| `delete_all` | ❌ | ❌ | ✅ |
| `export_memories` | ❌ | ✅ | ✅ |
| `import_memories` | ❌ | ❌ | ✅ |

### 2.2 Namespace Isolation

Memories are isolated by namespace:

```yaml
namespaces:
  project/<project-name>:
    access: project-members
    retention: 90 days
    
  agent/<agent-id>:
    access: agent-only
    retention: 7 days
    
  global:
    access: all-agents
    retention: indefinite
    write: admin-only
    
  sensitive:
    access: admin-only
    encryption: required
    audit: enhanced
```

### 2.3 Cross-Project Access

Agents may access memories across projects only when:

1. Explicit permission granted in task manifest
2. Memory is tagged with `cross-project: allowed`
3. No PII or sensitive data present
4. Audit log entry created

---

## 3. Audit Requirements

### 3.1 Logged Operations

Every memory operation must log:

```json
{
  "timestamp": "2025-12-04T10:30:00Z",
  "operation": "store_memory",
  "memory_id": "mem-abc123",
  "agent_id": "agent-builder-001",
  "session_id": "session-xyz789",
  "namespace": "project/user-auth",
  "content_hash": "sha256:abc123...",
  "result": "success",
  "trace_id": "trace-12345"
}
```

### 3.2 Audit Retention

| Log Type | Retention |
|----------|-----------|
| Memory operations | 1 year |
| Access denials | 2 years |
| Admin operations | 5 years |
| Deletion logs | Permanent |

### 3.3 Audit Search

```bash
# Search audit logs
pnpm memory:audit --agent <agent-id> --from <date> --to <date>

# Export for compliance
pnpm memory:audit-export --format json --output audit-report.json
```

---

## 4. Retention Policies

### 4.1 Default Retention

| Memory Type | Default TTL | Max Extension |
|-------------|-------------|---------------|
| Short-term | 24 hours | 72 hours |
| Working | 7 days | 30 days |
| Long-term | 90 days | 1 year |
| Persistent | Indefinite | N/A |

### 4.2 Automatic Cleanup

Expired memories are:

1. Marked for deletion at expiry time
2. Held for 24-hour grace period
3. Permanently deleted after grace period
4. Deletion logged in audit trail

### 4.3 Manual Retention Override

```bash
# Extend retention
pnpm memory:extend --id <memory-id> --days 30

# Mark as persistent (admin only)
pnpm memory:persist --id <memory-id> --reason "Core project knowledge"
```

---

## 5. Content Policies

### 5.1 Prohibited Content

Memory storage is blocked for:

- PII without explicit consent
- Credentials, API keys, secrets
- Personal health information
- Financial account numbers
- Content marked as ephemeral by user

### 5.2 Content Scanning

Pre-store validation:

```yaml
content_scan:
  pii_detection:
    enabled: true
    action: block
    notify: security-team
    
  secret_detection:
    enabled: true
    action: block
    patterns:
      - api_key
      - password
      - token
      - private_key
      
  sentiment_analysis:
    enabled: true
    action: flag_for_review
    threshold: negative_0.8
```

### 5.3 Content Classification

All memories must be classified:

| Classification | Description | Handling |
|----------------|-------------|----------|
| **Public** | Safe to share | Default access |
| **Internal** | Project-only | Namespace restricted |
| **Confidential** | Sensitive decisions | Encrypted at rest |
| **PII** | Personal data | Consent required |
| **Special Category** | Health, biometric, etc. | Enhanced protections |

---

## 6. Multi-Agent Coordination

### 6.1 Blackboard Pattern

Memory serves as indirect communication channel:

```
Agent A writes:                     Agent B reads:
┌─────────────────────────┐        ┌─────────────────────────┐
│ "Decided to use JWT     │        │ Searches: "auth decision"│
│  for auth tokens"       │───────▶│ Finds JWT decision       │
│  tags: [decision, auth] │        │ Aligns implementation    │
└─────────────────────────┘        └─────────────────────────┘
```

### 6.2 Coordination Conventions

| Entry Type | Tag Pattern | Purpose |
|------------|-------------|---------|
| Decision | `decision:<topic>` | Record architectural choices |
| Blocker | `blocker:<task>` | Signal impediments |
| Discovery | `discovery:<topic>` | Share learnings |
| Request | `request:<capability>` | Ask for help |
| Status | `status:<task>` | Progress updates |

### 6.3 Semantic Search for Coordination

Agents use semantic search to find relevant context:

```typescript
// Agent searching for related decisions
const results = await memory.search({
  query: "authentication token approach",
  limit: 5,
  threshold: 0.7,
  semantic: true,
  tags: ["decision"]
});
```

---

## 7. Memory Parity Requirements

### 7.1 Dual-Write Rule

All significant memories must be written to:

1. **Local Memory MCP** - Primary storage with semantic search
2. **Repository mirror** - `.github/instructions/memories.instructions.md`

### 7.2 Sync Verification

```bash
# Verify parity between MCP and repo
pnpm memory:verify-parity

# Force sync (admin only)
pnpm memory:sync --direction mcp-to-repo
```

### 7.3 Parity Evidence

Task manifests must include:

```json
{
  "memory_ids": ["mem-abc123", "mem-def456"],
  "parity_verified": true,
  "parity_timestamp": "2025-12-04T10:30:00Z"
}
```

---

## 8. Privacy & Compliance

### 8.1 Data Subject Rights

Support for:

- **Right to Access**: Export all memories for a user/project
- **Right to Erasure**: Delete all associated memories
- **Right to Rectification**: Update incorrect memories
- **Right to Portability**: Export in standard format

### 8.2 GDPR Alignment

| Requirement | Implementation |
|-------------|----------------|
| Lawful basis | Recorded in governance field |
| Purpose limitation | Enforced by content scanner |
| Data minimization | TTL policies |
| Accuracy | Update/rectification API |
| Storage limitation | Automatic expiry |
| Security | Encryption at rest |

### 8.3 Consent Tracking

When consent is the lawful basis:

```json
{
  "governance": {
    "lawful_basis": "consent",
    "consent_reference": "consent-2025-12-04-user123",
    "consent_scope": ["project-memory", "cross-project-learning"],
    "consent_obtained_at": "2025-12-04T09:00:00Z"
  }
}
```

---

## 9. Monitoring & Alerts

### 9.1 Memory Metrics

| Metric | Threshold | Alert |
|--------|-----------|-------|
| `memory.storage.total` | >80% capacity | Warning |
| `memory.operations.failures` | >5/min | Warning |
| `memory.parity.drift` | Any | Error |
| `memory.content.blocked` | Any | Info |
| `memory.access.denied` | >10/hour | Warning |

### 9.2 Health Checks

```bash
# Memory system health
pnpm memory:health

# Output
{
  "status": "healthy",
  "storage": { "used": "2.1GB", "available": "7.9GB" },
  "operations": { "last_hour": 1234, "failures": 0 },
  "parity": { "synced": true, "last_check": "2025-12-04T10:00:00Z" }
}
```

---

## 10. MCP Security & AgentFacts Provenance

Research on MCP threats (arXiv:2511.20920) and AgentFacts (arXiv:2506.13794) requires additional controls:

1. **Scoped Authentication**
  - Every memory operation carries a scoped token referencing `agentfacts.capabilities[*].scope`.
  - Tokens expire in ≤15 minutes and are bound to `agent_id`, `session_id`, and namespace.

2. **Signed Provenance Tuples**
  - Extend the schema with `"provenance": {"agentfacts_signature": "...", "content_hash": "sha256:..."}`.
  - Reject writes lacking a valid signature issued by the AgentFacts registry.

3. **Gateway Policy Checks**
  - All MCP routes pass through the runtime governance service which enforces DLP, anomaly detection, and ESRH hooks before touching storage.
  - Blocklist compromised servers using a signed registry refreshed hourly.

4. **Audit Expansion**
  - Log `supply_chain_source` and `tool_server_id` for every operation to trace supply-chain attacks.
  - Attach sentinel alert IDs when memory writes are part of coordinated incidents.

5. **Model Card Linkage**
  - Model cards must state whether memory access is enabled and cite the MCP controls in effect.

<!-- PROJECT-SPECIFIC: START -->
## 11. Project-Specific Memory Configuration

> **Instructions:** Edit this section to define project-specific memory policies. This section is NOT overwritten when upgrading the governance pack.

### Custom Retention Policies

| Memory Type | Project TTL | Reason |
|-------------|-------------|--------|
| _Task context_ | _7 days_ | _Sprint-based cleanup_ |
| _User preferences_ | _90 days_ | _UX consistency_ |

### Project Data Classifications

| Classification | Memory Storage | Encryption | Retention |
|---------------|----------------|------------|----------|
| _Standard_ | _Default_ | _At-rest_ | _Per policy_ |
| _Sensitive_ | _Isolated namespace_ | _Field-level_ | _30 days max_ |

### Project Memory Namespaces

```yaml
# Add project-specific namespaces
namespaces:
  - name: "project-context"
    access: project-team
    retention: 30d
```

### Compliance Overrides

<!-- Add any project-specific compliance requirements -->
- [ ] GDPR Article 17 (Right to Erasure) process documented
- [ ] Data subject access request workflow defined

<!-- PROJECT-SPECIFIC: END -->

---

## References

- OpenMemory MCP Architecture (2025)
- arXiv:2511.20920 — *Securing the Model Context Protocol (MCP): Risks, Controls, and Governance*
- arXiv:2506.13794 — *AgentFacts: Universal KYA Standard for Verified AI Agent Metadata & Deployment*
- GDPR Articles 13-22 (Data Subject Rights)
- `00-core/constitution.md` - §II.3 Memory Core
- `00-core/agent-verification-policy.md` - AgentFacts adoption
- `commands/memorize.md` - Memory command reference
- `commands/recall.md` - Recall command reference
