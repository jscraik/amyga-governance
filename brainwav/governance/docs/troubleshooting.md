# Troubleshooting Guide

## Governance Bootstrap Issues

**Governance hash mismatch**
- Recompute hashes: `sha256sum brainwav/governance/00-core/*.md`
- Update `brainwav/governance/90-infra/governance-index.json`

**MCP server not connecting**
- Check port availability: `lsof -i :2091` (Cortex Aegis), `lsof -i :3002` (Local Memory)
- Verify MCP client configuration

## Command Issues

**Commands failing with "Missing TASK_SLUG"**
- Set the environment variable: `export TASK_SLUG=my-task`
- Or pass as argument: `node recall.mjs my-task`

**Local Memory API errors**
- Verify Local Memory MCP is running on port 3002
- Check `LOCAL_MEMORY_BASE_URL` environment variable

## Task Folder Issues

**Missing evidence artifacts**
- Ensure task folder structure follows `agentic-coding-workflow.md` §3
- Run `/memorize` to capture session context

**Vibe check not recorded**
- Run Cortex Aegis oversight before acting: `pnpm oversight:vibe-check`
- Check `tasks/<slug>/logs/vibe-check/*.json`

## CI/CD Issues

**Security scans blocking merge**
- Review Semgrep findings and fix or waive with justification
- Check Gitleaks output for secret patterns
- Update `.trivyignore` for false positives

**Checklist validation failing**
- Ensure `CODE-REVIEW-CHECKLIST:` token is present in PR
- Complete all BLOCKER items in the checklist
