# Gold Standard Checklist (CI Contract)

This page defines what is **enforced in CI**, what is **advisory**, and what is **local-only** for the gold standard baseline (**as-of 2026-01-31**).

## Enforced in CI (hard fail)

- Governance validation (`pnpm exec brainwav-governance validate --strict`)
- Hash drift check (either included in validate or run `pnpm exec brainwav-governance sync-hashes --check`)
- Docs validation (repo command; may be pack-scoped)
- AGENTS integrity (`pnpm exec brainwav-governance validate-agents --strict` if enabled)
- Security scans (pack-scoped enforcement; release profile must pass required scanners)
- SBOM generation (CycloneDX) when required by change class / release profile

## CI Mapping (commands, check IDs, packs)

| Requirement | Command (example) | Check IDs (emitted) | Profiles | Packs |
|---|---|---|---|---|
| Governance validation | `pnpm exec brainwav-governance validate --strict` | `policy.required_tokens`, `policy.step_budget`, `policy.config`, `governance.json.pretty`, `hash.drift`, `standards.freshness`, `file.agents`, `file.index`, `file.charter`, `file.workflow`, `file.checklists`, `evidence.task`, `portfolio.drift`, `pack.missing`, `pack.present`, `spec.*`, `core.precedence.no_pack_files`, `pointer.no_canonical_trees`, `pack.install.only_when_selected`, `structure_guard.schema_core_only` | delivery, release | core + enabled packs |
| Hash drift | `pnpm exec brainwav-governance sync-hashes --check` | `hash.drift` | delivery, release | core |
| AGENTS integrity | `pnpm exec brainwav-governance validate-agents --strict` | `file.agents` | release (delivery if enabled) | core |
| Docs validation | `pnpm docs:validate` | No check IDs (standalone script) | delivery, release | docs pack (if present) |
| Security scans | pack CI | `pack:<id>:<check>` (pack-defined) | release (delivery if enabled) | security pack |
| SBOM generation | pack CI | `pack:<id>:<check>` (pack-defined) | release (or change class requires) | sbom pack |

## Advisory (warnings)

- Coverage thresholds beyond required baseline
- Mutation score targets
- Non-blocking policy warnings in docs or governance checks

## Local-only (doctor output)

- Toolchain readiness checks for the active profile (release is strictest)
- Local environment readiness gaps

## Related docs

- `brainwav/governance/90-infra/compat.json`
- `brainwav/governance/docs/testing-qa.md`
- `AGENTS.md`
