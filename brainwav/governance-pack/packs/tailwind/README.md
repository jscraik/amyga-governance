# tailwind pack

This pack applies to repos using Tailwind.

## 1) Class discipline (Required)
- Avoid “magic numbers” when design tokens exist.
- Prefer semantic composition:
  - utilities for layout/spacing/typography
  - variants for state (hover/focus/disabled)
- Conditional classes MUST be readable.
  - If the repo adopts a class combiner, it MUST be used consistently.

## 2) A11y constraints (Required)
- Focus indicators MUST be visible.
- Color-only signaling is forbidden; pair color with text/icon/shape where relevant.
- Interactive elements MUST meet target size and spacing requirements per WCAG 2.2 AA.

## 3) Ordering / formatting policy (Required)
One of the following MUST be chosen repo-wide:
- a class-order linter rule, OR
- a deterministic formatter step, OR
- a dedicated class-sorting command in CI

The repo MUST:
- document which mechanism is authoritative
- run a CI check that fails on ordering drift

## 4) Styling architecture (Required)
- Shared UI primitives MUST centralize repeated patterns (buttons, inputs, dialogs).
- Avoid duplicating long class strings across the repo; extract into primitives or utilities.

## 5) Suggested Nx targets (Repo may rename)
- `tailwind:lint` → lint classes + forbidden patterns (repo-selected)
- `tailwind:format:check` → class-order drift check (repo-selected)

## 6) Waivers (Uniform model)
Any suppression/exception MUST include reason + ticket + expiry/ADR reference.
