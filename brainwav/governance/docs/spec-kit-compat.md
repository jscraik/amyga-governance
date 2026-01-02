# Spec-Kit Compatibility Contract

This document defines what “Spec-Kit compatible” means in Brainwav governance.
It is enforced by `brainwav-governance spec validate` and the `sdd` pack checks.

## Layouts (supported)

Exactly one of the following layouts must be used:

1) **Root layout**

```
specs/
  <slug>/
    spec.md
    plan.md
    tasks.md
```

2) **.specify layout**

```
.specify/
  memory/constitution.md
  templates/
    spec-template.md
    plan-template.md
    tasks-template.md
  scripts/        (optional)
  specs/
    <slug>/
      spec.md
      plan.md
      tasks.md
```

If both layouts exist, validation warns and you must choose one.

## Required files

Per spec directory (`specs/<slug>/` or `.specify/specs/<slug>/`):

- `spec.md`
- `plan.md`
- `tasks.md`

For `.specify` layout only:

- `.specify/memory/constitution.md`
- `.specify/templates/spec-template.md`
- `.specify/templates/plan-template.md`
- `.specify/templates/tasks-template.md`

Optional:

- `.specify/templates/claude-template.md`
- `.specify/scripts/`
- `CLAUDE.md` at repo root

## Required sections in spec.md

The following section headers must appear verbatim in each `spec.md`:

- `Current state`
- `Desired state`
- `Success criteria`
- `How we will verify`

## Required cross-links

Each artifact must link to its siblings using absolute repo-relative paths:

- `spec.md` links to `specs/<slug>/plan.md` and `specs/<slug>/tasks.md`
- `plan.md` links to `specs/<slug>/spec.md` and `specs/<slug>/tasks.md`
- `tasks.md` links to `specs/<slug>/spec.md` and `specs/<slug>/plan.md`
- `tasks.md` includes at least one `tasks/` evidence reference

## Lifecycle rules

- `tasks.md` must not exist without `plan.md`
- If `plan.md` exists, `tasks.md` is expected (warn if missing)

If `plan.md` exists, the following artifacts are expected (warn if missing):

- `contracts/`
- `data-model.md`
- `research.md`
- `quickstart.md`

## Check ID mapping

These checks are emitted by `brainwav-governance spec validate`:

- `spec.layout` — layout detected and singular
- `spec.memory.constitution` — constitution present for `.specify`
- `spec.templates.present` — required templates present for `.specify`
- `spec.templates.claude` — optional Claude template present
- `spec.scripts.present` — optional `.specify/scripts` present
- `spec.claude.present` — optional `CLAUDE.md` present
- `spec.specs.present` — at least one spec directory with `spec.md`
- `spec.specs.naming` — slug naming (`^\d{3}-`)
- `spec.lifecycle` — plan/tasks ordering is valid
- `spec.plan.artifacts` — plan artifact set is present (warn)
- `spec-chain.present` — spec/plan/tasks chain exists
- `spec-chain.consistency` — links and required sections are consistent
- `spec.clarify.missing` — clarify gaps detected
- `spec.analyze.consistency` — analyze drift detected
- `spec.checklist.missing` — checklist gaps detected

## CLI usage

```bash
pnpm exec brainwav-governance spec validate --spec-root specs
pnpm exec brainwav-governance spec validate --spec-root .specify/specs --compat speckit
```
