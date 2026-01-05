# react-vite pack

This pack applies to repos/packages using React with Vite.

## 1) React component standards (Required)

### Composition and boundaries
- Components MUST be small and compositional; extract subcomponents when `render` logic becomes hard to scan.
- Public components MUST have:
  - typed props (no implicit `any`)
  - documented behavior (doc comment or docs entry)
  - accessibility contract (keyboard + SR expectations)

### Hooks and side effects
- Hooks MUST follow Rules of Hooks.
- Side effects MUST be in `useEffect`/`useLayoutEffect`.
- Effects MUST be cancellation-aware for I/O:
  - use `AbortController` and cancel on cleanup.
- No data-fetching in render path.

### State discipline
- Prefer local state; lift state up only when necessary.
- Avoid global mutable state. If using a state library, define a single policy in the repo and document it.
- State stores MUST be testable and deterministic (inject clocks/IDs as needed).

### Exports
- Named exports only.
- “Barrel” indexes MUST NOT create circular deps; CI SHOULD include a cycle check if available.

## 2) Vite runtime and env discipline (Required)

### Environment variables
- Only explicitly intended client variables may be exposed to the browser.
- Secrets MUST NOT be available in the client bundle.
- `import.meta.env` use MUST be typed:
  - define env schema and validate at boot where applicable.

### Build determinism
- Builds MUST be reproducible from lockfile.
- Mode-dependent behavior that changes semantics MUST be tested per mode.

### Asset and chunk discipline
- Large assets MUST be tracked (budgets).
- Lazy loading MUST be used for large routes/features where applicable.

## 3) Accessibility defaults (Required)
- Baseline: WCAG 2.2 AA (repo-level).
- Keyboard operation MUST work without mouse.
- Focus states MUST be visible; no color-only signaling.
- Prefer semantic HTML first; ARIA only when required.

## 4) Testing (Required)
- Prefer user-visible behavior tests (roles, names, labels).
- DOM snapshots are discouraged; only allow for intentionally stable serialized outputs.
- Network calls MUST be mocked/deterministic in unit tests.

## 5) Suggested Nx targets (Repo may rename)
- `web:lint` → biome + eslint policy
- `web:typecheck` → `tsc -p ...` or equivalent
- `web:test` → vitest
- `web:build` → `vite build`
- `web:bundle:budget` → repo-defined bundle size/time checks

## 6) Waivers (Uniform model)
Any suppression/exception MUST include:
- reason
- ticket
- expiry (date) OR ADR reference

Example:
- ESLint disable: `eslint-disable -- reason: ...; ticket: ...; expires: YYYY-MM-DD`
- `@ts-expect-error -- reason + ticket`
