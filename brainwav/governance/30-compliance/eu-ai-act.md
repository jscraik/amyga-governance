# EU AI Act Compliance Framework

**Version**: 1.0.0  
**Status**: Authoritative  
**Last Updated**: 2025-12-04  
**Regulation Reference**: EU AI Act (Regulation 2024/1689)

---

## Purpose

This document provides a compliance framework for AI systems developed under this governance framework, aligned with the European Union Artificial Intelligence Act. It defines risk classification, transparency requirements, and documentation obligations.

---

## 1. EU AI Act Overview

### 1.1 Key Dates

| Date | Milestone |
|------|-----------|
| Aug 1, 2024 | Regulation entered into force |
| Feb 2, 2025 | Prohibited AI systems ban effective |
| Aug 2, 2025 | GPAI model rules apply |
| Aug 2, 2026 | Full application (including high-risk) |
| Aug 2, 2027 | Annex I systems (safety components) |

### 1.2 Scope

This framework applies to:

- AI systems deployed in EU member states
- AI systems whose output is used in the EU
- AI development by EU-based teams

---

## 2. Risk Classification

### 2.1 Risk Categories

| Category | Description | Requirements | Examples |
|----------|-------------|--------------|----------|
| **Unacceptable** | Banned uses | Prohibited | Social scoring, subliminal manipulation |
| **High-Risk** | Significant impact | Full compliance | Employment, credit, critical infrastructure |
| **Limited Risk** | Transparency needed | Disclosure required | Chatbots, deepfakes |
| **Minimal Risk** | Low impact | Voluntary codes | Spam filters, games |

### 2.2 Risk Classification Checklist

Before deploying any AI system, classify using this checklist:

```markdown
## Risk Assessment: [System Name]

**Date**: [YYYY-MM-DD]
**Assessor**: [Name/Agent ID]

### Prohibited Use Check
- [ ] Does NOT use subliminal manipulation
- [ ] Does NOT exploit vulnerabilities of specific groups
- [ ] Does NOT perform social scoring
- [ ] Does NOT use real-time biometric identification (without exemption)
- [ ] Does NOT infer emotions in workplace/education (without exemption)

### High-Risk Indicators
- [ ] Biometric identification or categorization?
- [ ] Critical infrastructure management?
- [ ] Education/vocational training access decisions?
- [ ] Employment/worker management decisions?
- [ ] Essential services access (credit, insurance)?
- [ ] Law enforcement assistance?
- [ ] Migration/asylum/border control?
- [ ] Justice/democratic process involvement?
- [ ] Safety component in regulated product?

### Classification Result
**Risk Level**: [ ] Minimal | [ ] Limited | [ ] High-Risk | [ ] Prohibited
**Justification**: [Explain classification]
**Review Date**: [When to reassess]
```

---

## 3. High-Risk AI Requirements

For systems classified as High-Risk:

### 3.1 Risk Management System (Article 9)

```yaml
risk_management:
  establishment:
    - Identify and analyze known/foreseeable risks
    - Estimate and evaluate residual risks
    - Adopt risk mitigation measures
    
  continuous_monitoring:
    - Systematic quality management
    - Post-market monitoring plan
    - Incident reporting procedures
    
  documentation:
    path: "compliance/risk-assessment/<system-name>.md"
    review_frequency: "quarterly"
```

### 3.2 Data Governance (Article 10)

```yaml
data_governance:
  training_data:
    - Document data sources
    - Assess data quality
    - Address biases
    - Ensure representativeness
    
  validation_data:
    - Separate from training data
    - Representative of deployment context
    - Documented selection criteria
    
  records:
    path: "compliance/data-governance/<system-name>.md"
    retention: "10 years from market withdrawal"
```

### 3.3 Technical Documentation (Article 11)

Required before deployment:

| Document | Content | Template |
|----------|---------|----------|
| System Description | Purpose, intended use, limitations | `templates/system-description.md` |
| Data Sheet | Training data characteristics | `templates/data-sheet.md` |
| Model Card | Model capabilities, biases, risks | `templates/model-card-template.md` |
| Testing Report | Validation results, metrics | `templates/testing-report.md` |
| Instructions for Use | Deployment guidance, monitoring | `templates/instructions-for-use.md` |

### 3.4 Record Keeping (Article 12)

Automatic logging requirements:

```json
{
  "log_requirements": {
    "operation_period": "recorded",
    "input_data": "hashed_reference",
    "output_data": "hashed_reference",
    "performance_metrics": "continuous",
    "incidents": "immediate",
    "modifications": "timestamped"
  },
  "retention": "minimum 10 years",
  "accessibility": "available to authorities on request"
}
```

### 3.5 Human Oversight (Article 14)

Design for human oversight:

| Requirement | Implementation |
|-------------|----------------|
| Understand capabilities/limitations | Documentation + training |
| Monitor operation | Dashboard + alerts |
| Interpret outputs | Explainability features |
| Override/stop system | Kill switch (emergency-stop-protocol.md) |
| Intervene in operation | Manual control interfaces |

### 3.6 Accuracy, Robustness, Cybersecurity (Article 15)

```yaml
technical_requirements:
  accuracy:
    - Metrics defined and measured
    - Benchmarks documented
    - Degradation monitored
    
  robustness:
    - Error handling tested
    - Graceful degradation
    - Adversarial testing completed
    
  cybersecurity:
    - Attack surface analyzed
    - Vulnerabilities addressed
    - Security updates process
```

---

## 4. Limited Risk Transparency

For systems classified as Limited Risk:

### 4.1 Disclosure Requirements

| Interaction Type | Disclosure Required |
|------------------|---------------------|
| Chatbot/conversational | "You are interacting with an AI system" |
| Generated content | "This content was AI-generated" |
| Emotion recognition | "This system analyzes emotions" |
| Biometric categorization | "This system categorizes based on biometric data" |

### 4.2 Transparency Implementation

```typescript
// Example disclosure for chatbot
const systemPrompt = `
[DISCLOSURE: You are interacting with an AI assistant. 
This AI system is developed by [Organization] and operates 
under the brAInwav Agentic Governance Framework.]
`;
```

---

## 5. GPAI Model Requirements

For General Purpose AI models:

### 5.1 Documentation Requirements

| Requirement | Content |
|-------------|---------|
| Technical documentation | Training, testing, evaluation |
| Training content summary | Sufficient detail for copyright compliance |
| EU AI Office notification | Before market placement |
| Copyright compliance | Demonstrate opt-out respect |

### 5.2 Systemic Risk Assessment

For GPAI with systemic risk (>10^25 FLOPs):

```yaml
systemic_risk_obligations:
  - Model evaluation (standardized protocols)
  - Risk assessment and mitigation
  - Incident tracking and reporting
  - Adequate cybersecurity protection
```

---

## 6. Conformity Assessment

### 6.1 Self-Assessment (Most High-Risk)

```markdown
## Conformity Self-Assessment

**System**: [Name]
**Date**: [YYYY-MM-DD]
**Assessor**: [Name/Role]

### Checklist
- [ ] Risk management system established
- [ ] Data governance documented
- [ ] Technical documentation complete
- [ ] Record-keeping implemented
- [ ] Human oversight mechanisms in place
- [ ] Accuracy/robustness/security verified
- [ ] Transparency requirements met
- [ ] Instructions for use provided

### Declaration
I confirm that [System Name] conforms to the requirements of 
Regulation (EU) 2024/1689 based on this self-assessment.

Signed: _________________ Date: _____________
```

### 6.2 Third-Party Assessment

Required for:
- Biometric systems
- Critical infrastructure AI
- Products covered by sectoral legislation (Annex I)

---

## 7. Market Surveillance Integration

### 7.1 Incident Reporting

Report to national authority within 15 days:

- Serious incidents
- Malfunctioning causing harm
- Breaches of fundamental rights

### 7.2 Post-Market Monitoring

```yaml
post_market_monitoring:
  data_collection:
    - User feedback
    - Performance metrics
    - Incident reports
    
  analysis:
    - Trend detection
    - Risk reassessment
    - Compliance verification
    
  actions:
    - Corrective measures
    - Updates/patches
    - Withdrawal if necessary
    
  reporting:
    frequency: "annual"
    template: "compliance/annual-report.md"
```

---

## 8. Governance Framework Alignment

### 8.1 Mapping to Existing Artifacts

| EU AI Act Requirement | Governance Artifact |
|-----------------------|---------------------|
| Risk Management | `docs/gap-analysis-dec-2025.md` |
| Technical Documentation | `templates/model-card-template.md` |
| Record Keeping | Task folders + audit logs |
| Human Oversight | `10-flow/emergency-stop-protocol.md` |
| Transparency | Brand logging requirements |
| Accuracy/Robustness | TDD requirements, quality gates |
| Cybersecurity | `00-core/llm-threat-controls.md` |

### 8.2 Evidence Integration

EU AI Act evidence stored in task folders:

```
tasks/<slug>/
├── compliance/
│   ├── risk-classification.md
│   ├── conformity-assessment.md
│   └── market-surveillance-log.md
```

---

## 9. Penalties & Enforcement

### 9.1 Fine Structure

| Violation | Maximum Fine |
|-----------|--------------|
| Prohibited AI systems | €35M or 7% worldwide turnover |
| High-risk non-compliance | €15M or 3% worldwide turnover |
| Incorrect information | €7.5M or 1% worldwide turnover |

### 9.2 Compliance Verification

Regular audits recommended:

- Quarterly internal reviews
- Annual external assessment (for high-risk)
- Immediate review after significant changes

---

## References

- EU AI Act (Regulation 2024/1689)
- European Commission AI Act guidance documents
- NIST AI RMF (complementary framework)
- ISO/IEC 42001:2023 (AI Management System)
- `00-core/constitution.md` - Framework principles
- `00-core/llm-threat-controls.md` - Security controls
