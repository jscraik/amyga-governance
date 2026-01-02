# Governance Pack Layering

This pack supports a **core + packs + adapters** model so it can be reused across orgs and projects without forcing every repo to install every tool.

## Layout

- `core/` — org-neutral templates with `${var}` placeholders.
- `packs/` — capability packs (security-appsec, supply-chain, a11y, ai-risk, compliance-overlays, ts-base, react-vite, react-next, tailwind, storybook, cloudflare-workers, mcp-server-ts, swift-appkit, openai-apps-sdk-ui, python-uv, rust-cli, nx).
- `overlays/<org>/` — organization defaults (Cortex provided).
- `overlays/<project>/` — optional tighter project layer.
- `core/docs.index.yaml` — ordered doc pointers (path/sha/url, optional `full_text` placeholder).
- `overlays/<org>/docs.index.yaml` — can add concrete paths/SHAs and (optionally) inline `full_text` (see `overlays/cortex/docs.full.yaml` for a full-doc example).
- Top-level `*.yaml` remain the **Cortex default merged output** until merge tooling is added.
- Future: `dist/` will hold rendered files produced by a merge script (not generated yet). A future "full-doc" pack may inline docs for offline enforcement; overlays decide whether to populate `full_text`.

## Merge Order

1. `core/*`
2. `packs/<pack>/*` (opt-in, versioned)
3. `overlays/<org>/*`
4. `overlays/<project>/*` (optional)

Overlay values **win** on conflicts. Deep-merge semantics are expected (overlay replaces scalar/lists, merges objects). Docs index follows the same order; full-text entries, if present, should come from the highest-priority overlay.

## Layering contract
- Core (`core/*`): project-neutral templates; never edited by packs or overlays.
- Packs (`packs/*`): opt-in control bundles that add or tighten gates without editing core.
- Org overlays (`overlays/<org>/*`): org defaults that may override/extend core + packs.
- Project overlays (`overlays/<org>/<project>/*`, optional): tighten for a project without mutating org/core/packs.
- Merge precedence: core → packs → org overlay → project overlay; later layers override keys but must not edit files in `core/`.

## Adoption profiles (project-neutral)

Pick a profile and merge/override if needed:

- **Greenfield** — Full gate set, WCAG 2.2 AA, OWASP ASVS/LLM Top 10, NIST SSDF v1.1, ISO/IEC 42001 alignment. Ships SBOM (CycloneDX) + provenance (SLSA ≥1.1) with signed artifacts.
- **Brownfield** — For existing/legacy code. Enforces changed-code rigor (coverage on touched lines, mutation, structure checks) while allowing staged uplift for untouched areas. Requires risk-register entries, compensating controls (feature flags, shadow traffic), and dated uplift plans.
- **Regulated/Safety-Critical** — Adds privacy + safety evidence (DPIA where applicable), signed SBOM/provenance per release, model health/bias evaluations, and mandatory human sign-off for rollout/rollback.

Profiles live in `core/governance.core.yaml` (templates), `governance.yaml` (defaults), and `dist/governance.yaml` (rendered) so downstream projects can consume them without Cortex-specific assumptions.

## Pointer mode distribution

For low-drift adoption, repos can use pointer mode (`brainwav-governance install --root . --mode pointer`) and pin `@brainwav/brainwav-agentic-governance` via their lockfile. Pointer mode keeps local files minimal while validation resolves canonical docs from `node_modules/@brainwav/brainwav-agentic-governance`.

## Operational action sets (Q1–Q5)

- **Rollout (Q1)** — Map teams/services to a profile with a DRI; publish a one-page brief linking to this README; pilot one greenfield and one brownfield service; tag profile choice in PR/task templates; run a retro after two sprints.
- **Metrics (Q2)** — Slice CI outcomes by profile; track coverage/mutation on changed lines, Evidence Triplet completeness, waiver volume/reasons, lead time, and post-merge defects. For brownfield, report uplift deltas on touched code weekly.
- **Mixed surfaces (Q3)** — Default to the strictest profile when regulated/data-sensitive code is touched; require profile + data-class tags in PRs; document compensating controls and expiry in the risk register; ensure cross-surface regression tests and observability cover regulated vs. consumer paths.
- **Standards maintenance (Q4)** — Run a quarterly standards review (SLSA, CycloneDX, WCAG, NIST/ISO/OWASP); maintain a watchlist with DRIs; version the profiles with change logs and effective dates; add/keep a CI or template check to flag drift between templates and `dist/`.
- **Training (Q5)** — Provide a 10-minute onboarding guide and crib sheet in PR/task templates; record a short demo; include a “profile rehearsal” exercise for new joiners; collect feedback after two weeks and iterate.

## Variables

Templates use `${var}` placeholders. See `config.example.yaml` for the canonical variable list. Expected injections include precedence docs, hash index path, hash enforcement toggle, coverage/mutation/a11y thresholds, step budgets, Aegis gates/endpoints/verdicts, structure snapshot file, common commands, log/manifests paths, and doc URLs/base.

## Enforcement Wiring (future)

Core + overlay sources are merged into `governance-pack/dist/` for CI and AGENTS consumption. CI and agents should read the `governance-pack/dist/*.yaml` files as the authoritative pack. A heavier variant can include `dist/docs.index.yaml` enriched with `full_text` for offline use.

## Output targets
- Top-level `governance-pack/*.yaml` are the current Cortex defaults.
- The committed `dist/` files are the authoritative pack for CI/agents.
- `dist/docs.index.yaml` can optionally inline `full_text` for offline/air-gapped review; leave empty to keep downloads light.

## Render to dist

- When pack sources change, regenerate and commit `governance-pack/dist/` using the same merge logic used by CI.
- Flags: `--overlay <org>` (default `cortex`), `--project <name>` (optional), `--config <path>` (default `config.example.yaml`), `--full-doc` to force inlining doc `full_text`.
- Behavior: deep-merge core → overlay → project; arrays are replaced by later layers; unknown placeholders are left as-is.
- Outputs: `governance.yaml`, `checklists.yaml`, `assurance.yaml`, `structure.yaml`, `dist/docs.index.yaml`, `agents-header.md` under `governance-pack/dist/`.
- Top-level `governance-pack/*.yaml` stay as the Cortex defaults; switch CI/agents to `dist/` when ready.
- Full-doc mode: honors `includeFullText` in config or `--full-doc`; inline targets must use `{{INLINE:<path>}}` and resolve repo-relative.
