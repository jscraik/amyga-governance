---
summary: "TypeScript base standards: strictness, ESM, schema validation, and safe async."
read_when: "Using TypeScript in any service, tool, or library."
applies_to: ["pack-ts-base"]
owner: "Governance Team"
---

# Pack: TypeScript Base

Applies to all TypeScript codebases and packages.

## Standards

- **TypeScript ≥ 5.9** with `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`.
- **ESM only** (`\"type\": \"module\"`, `module: NodeNext`).
- **No `any`** in production paths; use `unknown` + narrowing.
- **Schema validation** at boundaries (Zod/Valibot/JSON Schema).
- **Async I/O** supports cancellation via `AbortSignal`.

## Tooling

- **Formatter**: Biome (no Prettier).
- **Policy linting**: ESLint v9 flat config for architecture/security rules.

## Evidence

- Unit tests co-located; mutation and coverage gates per profile.
- Contract snapshots for external interfaces.
