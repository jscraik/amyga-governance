# Governance Pack Layering

This pack now supports a **core + overlay** model so it can be reused across orgs and projects.

## Layout

- `core/` — org-neutral templates with `${var}` placeholders.
- `overlays/<org>/` — organization defaults (Cortex provided).
- `overlays/<project>/` — optional tighter project layer.
- `core/docs.index.yaml` — ordered doc pointers (path/sha/url, optional `full_text` placeholder).
- `overlays/<org>/docs.index.yaml` — can add concrete paths/SHAs and (optionally) inline `full_text` (see `overlays/cortex/docs.full.yaml` for a full-doc example).
- Top-level `*.yaml` remain the **Cortex default merged output** until merge tooling is added.
- Future: `dist/` will hold rendered files produced by a merge script (not generated yet). A future "full-doc" pack may inline docs for offline enforcement; overlays decide whether to populate `full_text`.

## Merge Order

1. `core/*`
2. `overlays/<org>/*`
3. `overlays/<project>/*` (optional)

Overlay values **win** on conflicts. Deep-merge semantics are expected (overlay replaces scalar/lists, merges objects). Docs index follows the same order; full-text entries, if present, should come from the highest-priority overlay.

## Layering contract
- Core (`core/*`): project-neutral templates; never edited by overlays.
- Org overlays (`overlays/<org>/*`): org defaults that may override/extend core values.
- Project overlays (`overlays/<org>/<project>/*`, optional): tighten for a project without mutating org/core; use when a project needs stricter gates/links than the org baseline.
- Merge precedence: core → org overlay → project overlay; later layers override keys but must not edit files in `core/`.

## Variables

Templates use `${var}` placeholders. See `config.example.yaml` for the canonical variable list. Expected injections include precedence docs, hash index path, hash enforcement toggle, coverage/mutation/a11y thresholds, step budgets, Aegis gates/endpoints/verdicts, structure snapshot file, common commands, log/manifests paths, and doc URLs/base.

## Enforcement Wiring (future)

A helper script (e.g., `scripts/apply-governance-pack.sh`) will merge core + overlay into `governance-pack/dist/` for CI and AGENTS consumption. Until then, CI and agents should continue to read the top-level `governance-pack/*.yaml` (Cortex defaults). The same tooling can emit a heavier variant with `docs.index.yaml` enriched by `full_text` for offline use.

## Output targets
- Top-level `governance-pack/*.yaml` are the current Cortex defaults.
- When you run `scripts/governance/render-pack.mjs` (or `pnpm governance:render-pack`), the emitted `dist/` files become the authoritative pack for CI/agents.
- `docs.index.yaml` can optionally inline `full_text` for offline/air-gapped review; leave empty to keep downloads light.

## Render to dist

- Run: `pnpm governance:render-pack` (or `node scripts/governance/render-pack.mjs`) to merge core + overlay into `governance-pack/dist/`.
- Flags: `--overlay <org>` (default `cortex`), `--project <name>` (optional), `--config <path>` (default `governance-pack/config.example.yaml`), `--full-doc` to force inlining doc `full_text`.
- Behavior: deep-merge core → overlay → project; arrays are replaced by later layers; unknown placeholders are left as-is.
- Outputs: `governance.yaml`, `checklists.yaml`, `assurance.yaml`, `structure.yaml`, `docs.index.yaml`, `agents-header.md` under `governance-pack/dist/`.
- Top-level `governance-pack/*.yaml` stay as the Cortex defaults; switch CI/agents to `dist/` when ready.
- Full-doc mode: honors `includeFullText` in config or `--full-doc`; inline targets must use `{{INLINE:<path>}}` and resolve repo-relative.