# EU AI Act Compliance Baseline

## Scope
This document outlines baseline expectations for EU AI Act-related governance artifacts.

**As-of:** 2026-01-31  
**Note:** This is a baseline mapping aid. Projects must consult legal/compliance for definitive interpretation.

## Risk classification
All systems must be assigned a risk classification (e.g., minimal, limited, high, unacceptable) and documented in the task evidence package.

**Required field (run-manifest):** `compliance.eu_ai_act.risk_class`

## Compliance expectations
- Maintain evidence of applicable obligations for the assigned risk class.
- Record intended safeguards, testing scope, and monitoring approach.
- Store regulatory references and review dates in the task summary.

**Controls mapping:** obligations SHOULD map to control IDs in `90-infra/control-registry.core.yaml` (or a compliance overlay registry) to keep evidence machine-checkable.

## Evidence requirements
- Risk classification recorded in the run manifest.
- Applicable compliance obligations mapped to controls.
- Reviewer sign-off for release profile changes.

**Profile enforcement:**
- creative: WARN when change class indicates regulated AI usage and EU AI Act fields are missing
- delivery: WARN/FAIL depending on risk class and change class
- release: FAIL when required EU AI Act fields and mapped controls are missing
