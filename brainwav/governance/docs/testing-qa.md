---
summary: "Test requirements and coverage/mutation gates."
read_when: "Testing strategy or gate failures"
applies_to: "core"
owner: "Governance Team"
---

# Testing & QA

The governance framework mandates test-driven development (TDD) with profile- and change-class-driven quality gates.

## TDD Requirements

- **Red-Green-Refactor** – Write failing test first, implement, then refactor.
- **Evidence Triplet** – Milestone test red→green proof is mandatory.
- **Test-first commits** – recommended metric (advisory unless required by change class/profile).

## Quality Gates (Profile + Change Class)

- creative: warn-only for coverage/mutation unless change class requires strictness
- delivery: enforce change-class minimums; warn on aspirational targets
- release: strict enforcement of configured thresholds and required evidence

## Evidence Requirements

Each task must include:

- `tasks/<slug>/logs/tests/milestone.log` – Test execution proof
- `tasks/<slug>/json/contracts-snapshot.json` – API/schema snapshot
- `tasks/<slug>/evidence/tests.md` – Test coverage summary

See `../20-checklists/checklists.md` for gate-specific requirements and `../90-infra/change-classes.json` for class-driven evidence/threshold enforcement.
