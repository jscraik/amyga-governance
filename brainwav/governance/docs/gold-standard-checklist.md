# Gold Standard Checklist (CI Contract)

This page defines what is **enforced in CI**, what is **advisory**, and what is **local-only** for the gold standard baseline.

**Baseline as-of:** 2026-01-31

## Rule: No claims without automated proof

Any item listed as “Enforced in CI (hard fail)” MUST map to:

1) a CI job step (command), and
2) a stable `checks[].id` emitted by `brainwav-governance validate --json`, when applicable,
3) an evidence artifact or CI log reference.

## Enforced in CI (hard fail)

| Requirement | CI command | Stable check IDs | Evidence |
|---|---|---|---|
| Governance validation | `pnpm exec brainwav-governance validate --strict --json --report .agentic-governance/reports/validate.json` | `policy.required_tokens`, `hash.drift`, `file.agents`, `file.index`, `file.charter`, `file.workflow`, `file.checklists`, `spec.*`, `core.precedence.no_pack_files`, `pointer.no_canonical_trees`, `pack.install.only_when_selected`, `structure_guard.schema_core_only` | `.agentic-governance/reports/validate.json` |
| Hash drift | included in `validate` OR `pnpm exec brainwav-governance sync-hashes --check` | `hash.drift` | `.agentic-governance/reports/validate.json` |
| AGENTS integrity | `pnpm exec brainwav-governance validate --strict --json --report .agentic-governance/reports/validate.json` | `file.agents` | `.agentic-governance/reports/validate.json` |
| Docs validation (pack-scoped) | `pnpm exec brainwav-governance validate --strict --json --report .agentic-governance/reports/validate.json` | `pack:docs:docs-validate` | `.agentic-governance/reports/validate.json` |
| Security scans (pack-scoped) | pack CI command | `pack:<id>:<check>` (pack-defined) | `evidence/<security>/` |
| SBOM + provenance (pack-scoped) | pack CI command | `pack:<id>:<check>` (pack-defined) | `sbom/<artifact>.cdx.json`, `attestations/<artifact>.json`, `dist/` |

## Advisory (warnings)

- Coverage thresholds beyond required baseline
- Mutation score targets
- Non-blocking policy warnings in docs or governance checks

**Note:** coverage/mutation strictness is driven by profile + change class (see `../90-infra/change-classes.json`).

## Local-only (doctor output)

- Toolchain readiness checks for the active profile (release is strictest)
- Local environment readiness gaps

## Related docs

- `brainwav/governance/90-infra/compat.json`
- `brainwav/governance/docs/testing-qa.md`
- `AGENTS.md`

## Appendix: Verify

- Run `pnpm governance:validate --strict` and confirm the summary reports `0 failed, 0 warnings`.
- Run `pnpm docs:validate` and confirm it reports `docs validation passed`.

## Appendix: Troubleshooting

- `hash.drift` failures: run `pnpm governance:sync-hashes` in a writable repo and re-run validation.
- Missing pack checks: confirm pack IDs in `.agentic-governance/config.json` match installed packs.
