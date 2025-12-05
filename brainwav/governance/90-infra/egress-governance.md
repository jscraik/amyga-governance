# Egress Governance Policy

**Version**: 1.0.0  
**Status**: Authoritative  
**Last Updated**: 2025-12-04  
**Priority**: P2 - Security & Compliance

---

## Purpose

This document defines egress control policies for agent network access. Based on Cloudflare Workers edge execution patterns, it establishes allowlists, rate limiting, logging requirements, and isolation policies for outbound network requests.

---

## Table of Contents

- [Purpose](#purpose)
- [1. Default Policy](#1-default-policy)
- [2. Allowlist Configuration](#2-allowlist-configuration)
- [3. Rate Limiting](#3-rate-limiting)
- [4. Logging Requirements](#4-logging-requirements)
- [5. Isolation & Containment](#5-isolation--containment)
- [6. DNS Control](#6-dns-control)
- [7. TLS/SSL Requirements](#7-tlsssl-requirements)
- [8. Monitoring & Alerts](#8-monitoring--alerts)
- [9. Compliance Integration](#9-compliance-integration)
- [10. Configuration Management](#10-configuration-management)
- [11. Project-Specific Egress Configuration](#11-project-specific-egress-configuration)
- [References](#references)

---

## 1. Default Policy

```yaml
egress:
  default_action: deny
  logging: all_requests
  monitoring: enabled
```

**All outbound network requests are DENIED unless explicitly allowed.**

---

## 2. Allowlist Configuration

### 2.1 Core Service Allowlist

```yaml
allowlist:
  # AI Model Providers
  ai_providers:
    - domain: "api.openai.com"
      ports: [443]
      protocols: [https]
      rate_limit: 100/min
      
    - domain: "api.anthropic.com"
      ports: [443]
      protocols: [https]
      rate_limit: 100/min
      
    - domain: "generativelanguage.googleapis.com"
      ports: [443]
      protocols: [https]
      rate_limit: 100/min
      
  # Development Services
  dev_services:
    - domain: "api.github.com"
      ports: [443]
      protocols: [https]
      rate_limit: 500/min
      
    - domain: "registry.npmjs.org"
      ports: [443]
      protocols: [https]
      rate_limit: 200/min
      
  # Memory & Storage
  storage:
    - domain: "localhost"
      ports: [3002, 6333]
      protocols: [http]
      note: "Local Memory MCP and Qdrant"
```

### 2.2 Project-Specific Allowlist

Projects may extend the allowlist in their configuration:

```yaml
# tasks/<slug>/config/egress-allowlist.yaml
project_allowlist:
  - domain: "api.custom-service.com"
    ports: [443]
    protocols: [https]
    rate_limit: 50/min
    justification: "Integration with custom backend"
    approved_by: "maintainer-id"
    expires: "2025-03-01"
```

### 2.3 Temporary Allowlist

For time-limited access during development:

```bash
# Request temporary access (expires in 24 hours)
pnpm egress:allow-temp \
  --domain "api.new-service.com" \
  --duration 24h \
  --reason "Testing integration" \
  --task "feat-new-integration"
```

---

## 3. Rate Limiting

### 3.1 Default Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Per Agent | 100 requests | 1 minute |
| Per Project | 1,000 requests | 1 minute |
| Per Domain | 200 requests | 1 minute |
| Global | 10,000 requests | 1 minute |

### 3.2 Rate Limit Configuration

```yaml
rate_limits:
  per_agent:
    default: 100/min
    burst: 20
    
  per_project:
    default: 1000/min
    burst: 100
    
  per_domain:
    customizable: true
    max: 500/min
    
  throttle_action: delay  # delay | reject | queue
  throttle_delay_ms: 100
```

### 3.3 Rate Limit Exceeded Response

```json
{
  "error": "rate_limit_exceeded",
  "limit": 100,
  "window": "1m",
  "retry_after": 30,
  "agent_id": "agent-builder-001",
  "domain": "api.openai.com"
}
```

---

## 4. Logging Requirements

### 4.1 Request Log Format

Every outbound request must log:

```json
{
  "timestamp": "2025-12-04T10:30:00.123Z",
  "type": "egress_request",
  "agent_id": "agent-builder-001",
  "session_id": "session-abc123",
  "task_slug": "feat-user-auth",
  "request": {
    "method": "POST",
    "domain": "api.openai.com",
    "path": "/v1/chat/completions",
    "size_bytes": 1234
  },
  "response": {
    "status": 200,
    "latency_ms": 1523,
    "size_bytes": 5678
  },
  "trace_id": "trace-12345",
  "allowed_by": "core_allowlist"
}
```

### 4.2 Denied Request Log

```json
{
  "timestamp": "2025-12-04T10:30:00.123Z",
  "type": "egress_denied",
  "agent_id": "agent-builder-001",
  "request": {
    "method": "GET",
    "domain": "malicious-site.com",
    "path": "/data"
  },
  "reason": "domain_not_in_allowlist",
  "action": "blocked",
  "alert": true
}
```

### 4.3 Log Retention

| Log Type | Retention |
|----------|-----------|
| Allowed requests | 30 days |
| Denied requests | 1 year |
| Rate limit events | 90 days |
| Security alerts | 2 years |

---

## 5. Isolation & Containment

### 5.1 Execution Sandbox

Agent network operations run in isolated contexts:

```yaml
sandbox:
  cpu_limit: "100m"  # 100 millicores
  memory_limit: "256Mi"
  timeout: 30s
  network:
    egress_only: true  # No inbound connections
    dns_resolver: "internal"  # Controlled DNS
```

### 5.2 Failure Isolation

```yaml
fault_containment:
  # Single agent failure doesn't affect others
  agent_isolation: true
  
  # Automatic termination on resource exhaustion
  auto_terminate:
    on_timeout: true
    on_memory_exceeded: true
    on_cpu_exceeded: true
    
  # Fresh context for retries
  retry_isolation: true
  
  # Blast radius limits
  max_concurrent_requests: 10
  max_pending_bytes: 10MB
```

### 5.3 Circuit Breaker

```yaml
circuit_breaker:
  per_domain: true
  
  thresholds:
    failure_rate: 50%  # % of failed requests
    window: 60s
    min_requests: 10
    
  states:
    closed: "normal operation"
    open: "all requests fail fast"
    half_open: "probe with limited requests"
    
  recovery:
    wait_time: 30s
    probe_count: 3
    success_threshold: 2
```

---

## 6. DNS Control

### 6.1 DNS Resolution

```yaml
dns:
  resolver: "internal"  # Use controlled resolver
  
  # Prevent DNS exfiltration
  query_logging: true
  response_validation: true
  
  # Block suspicious patterns
  block_patterns:
    - "*.onion"
    - "*.i2p"
    - "*.bit"
    
  # Cache control
  cache_ttl: 300s
  negative_cache_ttl: 60s
```

### 6.2 DNS Allowlist Integration

DNS resolution only succeeds for allowlisted domains:

```bash
# Attempt to resolve non-allowlisted domain
$ dig malicious-site.com
# Result: NXDOMAIN (blocked at DNS level)
```

---

## 7. TLS/SSL Requirements

### 7.1 Minimum Standards

```yaml
tls:
  min_version: "TLS1.2"
  preferred_version: "TLS1.3"
  
  # Certificate validation
  verify_certificates: true
  allow_self_signed: false
  
  # Certificate pinning for critical services
  pins:
    - domain: "api.openai.com"
      pins: ["sha256/..."]
    - domain: "api.anthropic.com"
      pins: ["sha256/..."]
```

### 7.2 Certificate Errors

Certificate failures are:
1. Logged with full details
2. Request blocked
3. Alert raised if pinned domain

---

## 8. Monitoring & Alerts

### 8.1 Egress Metrics

| Metric | Description |
|--------|-------------|
| `egress.requests.total` | Total outbound requests |
| `egress.requests.blocked` | Blocked by policy |
| `egress.requests.rate_limited` | Throttled requests |
| `egress.latency.p99` | 99th percentile latency |
| `egress.bytes.total` | Total bytes transferred |

### 8.2 Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Request to blocked domain | Warning | Log + notify |
| Repeated blocked requests (>10/min) | High | Log + alert + investigate |
| Certificate error | High | Block + alert |
| Rate limit exceeded | Info | Log |
| Unusual traffic pattern | Medium | Log + notify |
| Data exfiltration attempt | Critical | Block + terminate + alert |

### 8.3 Real-Time Dashboard

```bash
# View egress metrics
pnpm egress:dashboard

# Export for analysis
pnpm egress:export --format json --from "1 hour ago"
```

---

## 9. Compliance Integration

### 9.1 Audit Trail

Egress logs support compliance requirements:

- **SOC 2**: Network activity monitoring
- **GDPR**: Data transfer logging
- **EU AI Act**: AI system behavior recording

### 9.2 Evidence Collection

For regulated environments:

```yaml
compliance_logging:
  enabled: true
  include_headers: false  # Exclude sensitive headers
  include_body: false     # Exclude request/response bodies
  hash_sensitive: true    # SHA256 hash of bodies for verification
  tamper_evident: true    # Append-only log with checksums
```

---

## 10. Configuration Management

### 10.1 Allowlist Updates

```bash
# Add domain to allowlist (requires approval)
pnpm egress:request \
  --domain "api.new-service.com" \
  --reason "New integration requirement" \
  --project "feat-integration"

# Approve request (maintainer)
pnpm egress:approve --request-id "req-123"

# List current allowlist
pnpm egress:list
```

### 10.2 Emergency Override

For critical situations (maintainer only):

```bash
# Temporarily block all egress
pnpm egress:emergency-block --reason "Security incident"

# Restore normal operation
pnpm egress:restore --incident-id "inc-123"
```

---

<!-- PROJECT-SPECIFIC: START -->
## 11. Project-Specific Egress Configuration

> **Instructions:** Edit this section to define project-specific network policies. This section is NOT overwritten when upgrading the governance pack.

### Project Allowlist Additions

```yaml
project_allowlist:
  # Add project-specific domains
  - domain: "api.your-service.com"
    ports: [443]
    protocols: [https]
    rate_limit: 100/min
    reason: "Internal API"
    approved_by: "@your-handle"
    expires: "2025-06-01"  # Review date
```

### Project Rate Limits

| Domain | Default Limit | Project Override | Reason |
|--------|--------------|------------------|--------|
| _api.github.com_ | _500/min_ | _1000/min_ | _High PR volume_ |

### Project Blocklist

```yaml
project_blocklist:
  # Block specific domains for this project
  - domain: "*.competitor.com"
    reason: "Legal restriction"
```

### Monitoring Overrides

- **Alert threshold**: _Override default if needed_
- **Log retention**: _Override default if compliance requires_
- **PII scrubbing**: _Additional fields to scrub_

<!-- PROJECT-SPECIFIC: END -->

---

## References

- Cloudflare Workers Security Model
- OWASP ASVS - Network Security Controls
- `00-core/llm-threat-controls.md` - LLM02 (Data Leakage)
- `10-flow/emergency-stop-protocol.md` - Termination procedures
- `30-compliance/eu-ai-act.md` - Regulatory requirements
