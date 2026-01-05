# storybook pack

This pack applies to repos using Storybook.

## 1) Deterministic stories (Required)
- Stories MUST be deterministic:
  - no live network calls
  - no time/random without injected seed/clock
- Use fixtures and mocks; keep fixtures versioned.

## 2) Accessibility (Required)
- A11y checks SHOULD run in CI for Storybook surfaces where feasible.
- Stories MUST include:
  - accessible names for controls
  - correct roles for interactive elements
  - keyboard navigation validation for key components

## 3) Interaction testing (Required where supported)
- Use interaction tests (`play`) for critical components:
  - keyboard paths
  - focus management
  - form validation behavior
- Avoid snapshotting entire DOM trees; assert user-visible behavior.

## 4) Review discipline (Required)
- Public UI primitives MUST have stories.
- Breaking visual changes MUST be reviewed with visual baselines (repo-selected solution).

## 5) Suggested Nx targets (Repo may rename)
- `storybook:build` → build static storybook
- `storybook:test` → run interaction tests
- `storybook:a11y` → run storybook a11y checks (if enabled)

## 6) Waivers (Uniform model)
Any suppression/exception MUST include reason + ticket + expiry/ADR reference.
