---
summary: "Python (uv) conventions: Ruff, Pyright, packaging, tests."
read_when: "Using Python with uv in this repository."
applies_to: ["pack-python-uv"]
owner: "Governance Team"
---

# Pack: Python (uv)

## Standards

- **Identifiers**: snake_case (funcs/vars), PascalCase (classes).
- **Types**: required on public functions; Pyright strict.
- **Lint/format**: Ruff (`ruff check --fix` + `ruff format`).
- **Packaging**: `pyproject.toml` + `uv.lock`; use `uv` for sync/run.
- **Imports**: absolute imports only.

## Testing

- `pytest` participates in repo quality gates.
