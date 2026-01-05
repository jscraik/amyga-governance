# config-formats pack (YAML / TOML / JSON)

This pack applies to repositories with YAML/TOML/JSON config as source-of-truth inputs.

## 1) JSON (Required)
- JSON MUST be valid UTF-8.
- Prefer machine-generated JSON for large files.
- Transformations MUST use `jq` (not regex).
- At runtime boundaries (TS/JS), JSON inputs MUST be schema-validated.

## 2) YAML (Required)
- YAML MUST be linted and validated in CI.
- Indentation MUST be 2 spaces; tabs forbidden.
- Avoid ambiguous YAML scalars; prefer explicit `true`/`false`.
- GitHub Actions YAML:
  - keep inline scripts minimal
  - prefer repo scripts for non-trivial logic
- Schema validation:
  - Where schemas exist, CI MUST validate YAML against schema (repo-selected mechanism).

## 3) TOML (Required)
- TOML MUST be syntactically valid.
- Tool pinning TOML (e.g., `.mise.toml`) is authoritative and MUST be reviewed like code.
- CI MUST validate TOML via the consuming tool(s).

## 4) Waivers / suppressions (Required)
If a linter/validator supports inline disables, they MUST include:
- reason
- ticket
- expiry (date) OR ADR reference

If inline disables are not supported, use a waiver file under the repo’s waiver directory.

## 5) Suggested Nx targets (Repo may rename)
- `config:lint` → lint YAML/TOML/JSON formatting/syntax
- `config:schema:check` → schema validation (OpenAPI/JSON Schema/etc.) where applicable
