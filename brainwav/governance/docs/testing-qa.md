# Testing & QA

The governance framework mandates test-driven development (TDD) with specific coverage requirements.

## TDD Requirements

- **Red-Green-Refactor** – Write failing test first, implement, then refactor.
- **Evidence Triplet** – Milestone test red→green proof is mandatory.
- **Test-first commits** – ≥90% TDD compliance ratio.

## Coverage Gates

| Metric | Threshold | Enforcement |
|--------|-----------|-------------|
| Global coverage | ≥90% | CI blocker |
| Changed lines | ≥95% | CI blocker |
| Mutation score | ≥90% | CI blocker (where enabled) |

## Quality Checks

Before submitting work:

1. Run unit tests with coverage
2. Run linting and type checking
3. Run security scans (Semgrep, Gitleaks)
4. Generate SBOM if dependencies changed
5. Complete code review checklist

## Evidence Requirements

Each task must include:

- `tasks/<slug>/logs/tests/milestone.log` – Test execution proof
- `tasks/<slug>/json/contracts-snapshot.json` – API/schema snapshot
- `tasks/<slug>/evidence/tests.md` – Test coverage summary

See [Checklists](../20-checklists/checklists.md) for gate-specific requirements.
