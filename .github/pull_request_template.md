<!--
  brAInwav Pull Request Template
  
  This template aligns with:
  - AGENTS.md §17 (Commits, PRs, Branching)
  - brainwav/governance/20-checklists/checklists.md §3 (PR Author Checklist)
  - brainwav/governance/10-flow/agentic-coding-workflow.md (Phase Machine)
  
  Fill in all required sections. Delete any sections that don't apply.
-->

## 📋 Summary

<!-- Brief description of changes (2-3 sentences) -->

### Task Reference

- **Task Folder**: `tasks/<slug>/` <!-- or N/A for governance-only changes -->
- **Task Type**: <!-- Feature | Fix | Refactor | Research | Review -->
- **Highest Gate Completed**: <!-- G0-G10 per agentic-coding-workflow.md -->
- **Related Issues**: Closes # <!-- issue number(s) -->

---

## 🎯 Motivation & Context

<!-- Why is this change needed? What problem does it solve? Link to specs/requirements -->

---

## 🔄 Changes Made

<!-- List the main changes in this PR -->

- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

### Files Changed

<!-- Key files modified (CI will show full list) -->

| File | Change Type | Description |
|------|-------------|-------------|
| `path/to/file` | Added/Modified/Deleted | Brief description |

---

## ✅ Evidence Triplet

<!-- Required per AGENTS.md §8 and checklists.md §3.2 -->

### Tests

- **Before (failing)**: <!-- Link to test log or describe failing state -->
- **After (passing)**: <!-- Link to test results -->
- **Coverage**: <!-- % global / % changed lines -->

### Plan

- **Plan Link**: [`plan/PLAN.md`](link) <!-- ≤7 steps -->
- **TDD Plan**: [`plan/tdd-plan.md`](link)
- **Deviations from Plan**: <!-- None | Describe -->

### Review

- **AI Review**: `evidence/review.json` <!-- attached/pending -->
- **Human Reviewer**: @<!-- username -->

---

## 📊 Quality Gates

<!-- Check all that apply -->

### Code Quality

- [ ] Lint passes: `pnpm nx affected -t lint`
- [ ] Types pass: `pnpm nx affected -t typecheck`
- [ ] Build succeeds: `pnpm nx affected -t build`
- [ ] No `any` in production code (except justified shims)
- [ ] No TODO/FIXME/HACK in production paths

### Tests

- [ ] Tests pass: `pnpm nx affected -t test`
- [ ] Coverage ≥90% global / 95% changed lines
- [ ] Mutation score ≥90% (where enabled)
- [ ] New/changed code has accompanying tests

### Security

- [ ] No secrets committed
- [ ] Semgrep/gitleaks/OSV scans pass
- [ ] SBOM generated (if dependencies changed)
- [ ] SLSA provenance attached (for releases)

### Accessibility (if UI changed)

- [ ] WCAG 2.2 AA compliant
- [ ] Keyboard navigation works
- [ ] axe/jest-axe reports attached
- [ ] N/A - No UI changes

### Observability

- [ ] Logs include `brand:"brAInwav"`, `trace_id`
- [ ] Metrics/traces instrumented for new paths
- [ ] N/A - No runtime code changes

---

## 🚀 Deployment

### Rollout Plan

- **Feature Flags**: <!-- List flags or "None" -->
- **Rollout Strategy**: <!-- Immediate | Staged | Canary -->
- **Rollback Plan**: <!-- Link to ops/rollback-plan.md or describe -->

### Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes (describe migration path below)

<!-- If breaking changes, describe migration: -->

---

## 📚 Documentation

- [ ] README updated (if applicable)
- [ ] API docs updated (if applicable)
- [ ] Runbooks updated (if applicable)
- [ ] Changelog entry created
- [ ] N/A - No documentation required

---

## 🤖 Agent Metadata (if AI-assisted)

<!-- Per AGENTS.md §12 and AI_CONTRIB_LOG requirements -->

- **AI Contribution**: <!-- Yes | No -->
- **AI Contributor Log**: `.cortex/audit/ai/AI_CONTRIB_LOG.yaml` <!-- updated/N/A -->
- **Model Used**: <!-- Claude 3.5 Sonnet | GPT-4o | etc. -->
- **Session ID**: <!-- If available -->

---

## 📝 Governance References

<!-- Cite specific governance sections this PR touches -->

- **AGENTS.md sections**: §<!-- section numbers -->
- **Workflow phase**: <!-- R→G→F→REVIEW per §4.4 -->
- **Checklists used**: §<!-- section numbers from checklists.md -->

---

## 🔍 Reviewer Notes

<!-- Any specific areas you'd like reviewers to focus on -->

---

## 📎 Attachments

<!-- Link to artifacts -->

- [ ] `run-manifest.json` committed
- [ ] `evidence/aegis-report.json` (if required)
- [ ] `logs/vibe-check/*.json`
- [ ] `evidence/test-results/*`

---

<!-- 
CODE-REVIEW-CHECKLIST: §4
Reviewer: Complete the checklist from checklists.md §4 as a PR comment
-->
