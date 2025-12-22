# Gap Analysis: GitHub Templates & Code Review Best Practices

**Date**: December 2025  
**Analyst**: AI Assistant (Claude Opus 4.5)  
**Scope**: PR templates, issue forms, code review integration  
**Status**: Completed with remediation

---

## Executive Summary

This analysis identified **critical gaps** in the brAInwav governance framework's GitHub-native integration. While the governance documentation (`AGENTS.md`, `checklists.md`) is comprehensive, the repository lacked the `.github/` structure needed to enforce these practices at the GitHub UI layer.

### Key Findings

| Gap | Severity | Status |
|-----|----------|--------|
| Missing `.github/` directory entirely | **Critical** | ✅ Resolved |
| AGENTS.md references non-existent PR template (line 418) | **Critical** | ✅ Resolved |
| No issue forms (YAML structured input) | High | ✅ Resolved |
| No template chooser configuration | Medium | ✅ Resolved |
| No SECURITY.md | Medium | ✅ Resolved |
| No `.claude/` directory (Anthropic best practice) | Low | Deferred |

---

## Research Sources

### 1. GitHub Documentation

- [About issue and pull request templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates)
- [Syntax for issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [Configuring issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)

**Key Takeaways:**
- Issue forms (YAML) provide structured input with validation
- `config.yml` controls template chooser and can disable blank issues
- Templates must be in `.github/ISSUE_TEMPLATE/` directory
- PR templates can be in root, `docs/`, or `.github/`

### 2. Anthropic Claude Code Best Practices

- [Best Practices for Claude Code](https://www.anthropic.com/engineering/claude-code-best-practices)

**Key Takeaways:**
- **CLAUDE.md files**: Per-project context files (like AGENTS.md)
- **Tool allowlists**: `.claude/settings.json` for permission management
- **Custom slash commands**: `.claude/commands/` for workflows
- **TDD workflow**: "Write tests, commit; code, iterate, commit"
- **Multi-Claude patterns**: Pair programming with one Claude writing, one reviewing
- **Headless mode**: `claude -p` for CI integration (issue triage, linting)
- **Code review as linting**: Subjective reviews beyond traditional lint tools

### 3. OpenAI Agentic AI Governance

- [Practices for Governing Agentic AI Systems](https://openai.com/index/practices-for-governing-agentic-ai-systems/)

**Key Takeaways:**
- Emphasis on keeping agents' operations safe and accountable
- Importance of agreeing on baseline responsibilities
- Need for oversight mechanisms (aligns with Cortex Aegis)

---

## Detailed Gap Analysis

### 1. GitHub Issue Templates

**Before:** No structured issue input; contributors could open blank issues with no guidance.

**After:** Four YAML issue forms:
1. `bug-report.yml` - Structured bug reports with severity, area, reproduction steps
2. `feature-request.yml` - Feature proposals aligned with governance vision
3. `security-vulnerability.yml` - OWASP LLM Top 10 categories, responsible disclosure
4. `documentation.yml` - Documentation improvements

**Alignment with Governance:**
- Forms reference governance docs (AGENTS.md, checklists, vision)
- Security form maps to `llm-threat-controls.md` categories
- Pre-flight checks ensure contributors review governance

### 2. PR Template

**Before:** AGENTS.md line 418 referenced `.github/pull_request_template.md` but file didn't exist.

**After:** Comprehensive template that mirrors:
- `checklists.md` §3 (PR Author Checklist)
- Evidence Triplet requirements
- Quality gates (lint, type, test, security, a11y)
- Agent metadata tracking
- Governance section references

**Key Features:**
- Task folder reference requirement
- Gate completion tracking (G0-G10)
- Evidence links for tests, plan, review
- Breaking change declaration
- Deployment/rollout plan section

### 3. Template Chooser Configuration

**Before:** No control over template selection; blank issues allowed.

**After:** `config.yml` with:
- `blank_issues_enabled: false` - Forces template use
- Contact links to governance docs and discussions
- Links to AGENTS.md and governance quickstart

### 4. Security Policy

**Before:** No `SECURITY.md` file.

**After:** Comprehensive security policy with:
- Private disclosure instructions (GitHub Security Advisory)
- Response timelines by severity
- Scope definition
- Links to `llm-threat-controls.md`

---

## Comparison: Anthropic Best Practices vs brAInwav

| Anthropic Recommendation | brAInwav Implementation | Gap Status |
|--------------------------|-------------------------|------------|
| CLAUDE.md files | AGENTS.md + nested package AGENTS.md | ✅ Equivalent |
| Tool allowlists | Governance guards + CI enforcement | ✅ Stronger |
| TDD workflow | ArcTDD + Phase Machine (R→G→F→REVIEW) | ✅ Stronger |
| Custom slash commands | Not implemented | ⚠️ Consider |
| Multi-Claude patterns | Reviewer Neuron concept in checklists | ✅ Aligned |
| Headless CI mode | CI jobs in checklists.md §5 | ✅ Aligned |
| Code review as linting | Human + AI review checklist (§4) | ✅ Stronger |

**Conclusion:** brAInwav governance is **stronger** than Anthropic's minimal recommendations, particularly in:
- Formal gate system (G0-G10)
- Evidence Triplet requirements
- Cortex Aegis oversight integration
- Comprehensive checklist coverage

---

## Remediation Summary

### Files Created

```
.github/
├── ISSUE_TEMPLATE/
│   ├── config.yml           # Template chooser configuration
│   ├── bug-report.yml       # Structured bug report form
│   ├── feature-request.yml  # Feature proposal form
│   ├── security-vulnerability.yml  # Security report form
│   └── documentation.yml    # Documentation issue form
└── pull_request_template.md # PR template aligned with checklists.md

SECURITY.md                   # Security policy
```

### Deferred Items

1. **`.claude/` directory**: Consider adding for Claude Code users:
   - `.claude/settings.json` - Tool allowlists
   - `.claude/commands/` - Custom slash commands
   
2. **Dependabot configuration**: `.github/dependabot.yml` for automated dependency updates

3. **GitHub Actions workflows**: Governance enforcement workflows

---

## Recommendations

### Short-term (This PR)
- [x] Create `.github/ISSUE_TEMPLATE/` with YAML forms
- [x] Create PR template aligned with checklists.md
- [x] Add `config.yml` to disable blank issues
- [x] Create `SECURITY.md`

### Medium-term
- [ ] Add `.claude/settings.json` with governance-aligned tool allowlists
- [ ] Create custom Claude commands for common workflows (`.claude/commands/`)
- [ ] Add `dependabot.yml` for security updates
- [ ] Add GitHub Actions workflow for governance validation

### Long-term
- [ ] Integrate Claude Code headless mode for automated PR review
- [ ] Add GitHub App for Cortex Aegis integration
- [ ] Implement issue triage automation

---

## Appendix: Issue Form Field Types

For reference, GitHub issue forms support:

| Type | Use Case |
|------|----------|
| `markdown` | Instructions/context |
| `input` | Single-line text |
| `textarea` | Multi-line text |
| `dropdown` | Single selection |
| `checkboxes` | Multiple selection / confirmations |

All forms created use these effectively for structured input.

---

*Generated by AI Assistant following brAInwav governance protocols*
