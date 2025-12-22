# Model Card Template

**Version**: 1.0.0  
**Standard**: Aligned with Hugging Face Model Card, Google Model Card Toolkit  
**Last Updated**: 2025-12-04

---

# Model Card: [Model Name]

## Model Details

### Basic Information

| Field | Value |
|-------|-------|
| **Model Name** | [Name] |
| **Model Version** | [Semantic version] |
| **Model Type** | [e.g., LLM, Embedding, Classifier] |
| **Provider** | [e.g., OpenAI, Anthropic, Ollama, Local] |
| **Model ID** | [Provider's model identifier] |
| **Date Added** | [YYYY-MM-DD] |
| **Last Evaluated** | [YYYY-MM-DD] |

### Model Description

[2-3 paragraphs describing the model, its capabilities, and architecture overview]

### AgentFacts & Verification

| Field | Value |
|-------|-------|
| **Agent ID** | `[UUID from agent-verification-policy.md]` |
| **Capabilities Signed By** | `[security authority id]` |
| **Governance Signature** | `[root signature fingerprint]` |
| **Trust Score (current)** | `[0-100]` |
| **Trust History URL** | `[logs/runtime-governance/trust-ledger.ndjson]` |
| **Autonomy Gamma Score** | `[AURA value]` |
| **Sentinel Coverage** | `[Yes/No + coordinator id]` |
| **MCP Access Scope** | `[namespaces/tools allowed]` |

### Training Information

| Aspect | Details |
|--------|---------|
| **Training Data Cutoff** | [Date or "Unknown"] |
| **Training Data Sources** | [Known sources or "Not disclosed"] |
| **Training Compute** | [FLOPs if known, or "Not disclosed"] |
| **Fine-tuning Applied** | [Yes/No, and description if yes] |

---

## Intended Use

### Primary Use Cases

- [Use case 1]
- [Use case 2]
- [Use case 3]

### Users

- **Primary Users**: [e.g., Developers, Agents, End users]
- **Downstream Users**: [Who uses the outputs]

### Out-of-Scope Uses

❌ This model should NOT be used for:
- [Prohibited use 1]
- [Prohibited use 2]
- [Prohibited use 3]

---

## Factors & Limitations

### Known Limitations

| Limitation | Description | Mitigation |
|------------|-------------|------------|
| [Limitation 1] | [Description] | [How we handle it] |
| [Limitation 2] | [Description] | [How we handle it] |

### Failure Modes

| Failure Type | Conditions | Impact | Detection |
|--------------|------------|--------|-----------|
| Hallucination | [When it occurs] | [Impact level] | [How detected] |
| Refusal | [When it occurs] | [Impact level] | [How detected] |
| Inconsistency | [When it occurs] | [Impact level] | [How detected] |

### Language Support

| Language | Quality Level | Tested |
|----------|---------------|--------|
| English | High | ✅ |
| [Other] | [Level] | [Status] |

---

## Evaluation Results

### Benchmark Performance

| Benchmark | Score | Date Tested |
|-----------|-------|-------------|
| [Benchmark 1] | [Score] | [Date] |
| [Benchmark 2] | [Score] | [Date] |

### Internal Evaluation

| Metric | Value | Target |
|--------|-------|--------|
| Task Completion Rate | [%] | [Target %] |
| Instruction Following | [%] | [Target %] |
| Safety Score | [%] | [Target %] |
| Latency (p50) | [ms] | [Target ms] |
| Latency (p99) | [ms] | [Target ms] |

### Adversarial Testing

| Test Type | Result | Notes |
|-----------|--------|-------|
| Prompt Injection | [Pass/Fail] | [Details] |
| Jailbreak Attempts | [Pass/Fail] | [Details] |
| Data Exfiltration | [Pass/Fail] | [Details] |

---

## Ethical Considerations

### Bias Assessment

| Dimension | Assessment | Evidence |
|-----------|------------|----------|
| Gender | [Assessment] | [How evaluated] |
| Race/Ethnicity | [Assessment] | [How evaluated] |
| Age | [Assessment] | [How evaluated] |
| Socioeconomic | [Assessment] | [How evaluated] |

### Safety Measures

- [Safety measure 1]
- [Safety measure 2]
- [Guardrails applied]

### Privacy Considerations

- **PII Handling**: [How model handles PII]
- **Data Retention**: [Model's data retention behavior]
- **Memorization Risk**: [Assessment of training data memorization]

---

## Environmental Impact

### Training Impact

| Metric | Value | Notes |
|--------|-------|-------|
| Training Energy | [kWh] | [If known] |
| Carbon Emissions | [kg CO2e] | [If known] |
| Hardware Used | [Type] | [If known] |

### Inference Impact

| Metric | Value | Notes |
|--------|-------|-------|
| Energy per Request | [Wh] | [Estimated] |
| Recommended Batch Size | [N] | [For efficiency] |

---

## Technical Specifications

### Input/Output

| Aspect | Specification |
|--------|---------------|
| Max Context Length | [Tokens] |
| Max Output Length | [Tokens] |
| Input Modalities | [Text, Images, etc.] |
| Output Format | [Text, JSON, etc.] |
| Structured Output | [Supported/Not supported] |

### API Details

```yaml
api:
  endpoint: "[API endpoint]"
  authentication: "[Method]"
  rate_limits:
    requests_per_minute: [N]
    tokens_per_minute: [N]
  pricing:
    input: "$[X] per 1M tokens"
    output: "$[X] per 1M tokens"
```

### Integration Configuration

```json
{
  "model_id": "[model-identifier]",
  "provider": "[provider]",
  "temperature": 0.7,
  "max_tokens": 4096,
  "top_p": 1.0,
  "structured_outputs": true
}
```

---

## Governance Integration

### Compliance Status

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Live Model Policy | [✅/❌] | [Link to evidence] |
| Brand Logging | [✅/❌] | [Log format verified] |
| Structured Outputs | [✅/❌] | [Schema validation] |
| Trace Context | [✅/❌] | [traceparent propagation] |
| AgentFacts Metadata | [✅/❌] | [`registry/agents/<agent_id>.json`] |
| Runtime Trust Evidence | [✅/❌] | [`logs/runtime-governance/trust-ledger.ndjson`] |

### Approval Chain

| Role | Approver | Date |
|------|----------|------|
| Security Review | [Name] | [Date] |
| Privacy Review | [Name] | [Date] |
| Governance Approval | [Name] | [Date] |
| Runtime Governance Owner | [Name] | [Date] |

### Version Pinning

```yaml
version_policy:
  pinned_version: "[exact version]"
  auto_update: false
  review_required_for_update: true
  rollback_version: "[previous stable]"
```

### Runtime Governance Hooks

- **Sentinel Monitors**: `[list sentinel agent IDs watching this model]`
- **Coordinator Escalation Path**: `[Incident channel / runbook link]`
- **Policy Bundle Hash**: `[hash from runtime-governance policy manifest]`
- **AURA Threshold**: `[gamma threshold requiring HITL]`
- **Sandbox Fallback Command**: `[command to shift to sandbox harness]`

---

## Maintenance

### Update History

| Version | Date | Changes |
|---------|------|---------|
| [Version] | [Date] | [Summary of changes] |

### Deprecation Plan

| Milestone | Date | Action Required |
|-----------|------|-----------------|
| End of Life Announced | [Date] | Begin migration planning |
| New Version Available | [Date] | Test and validate |
| Support Ends | [Date] | Must be migrated |

### Contact

- **Model Owner**: [Team/Person]
- **Support Channel**: [Link/Email]
- **Issue Tracker**: [Link]

---

## References

- [Link to provider documentation]
- [Link to paper/technical report]
- [Link to related model cards]

---

*Last reviewed: [Date] by [Reviewer]*
