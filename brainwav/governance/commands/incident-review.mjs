#!/usr/bin/env node
// brainwav/governance/commands/incident-review.mjs
// Generate structured post-incident review
// Full spec: brainwav/governance/commands/incident-review.md

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const incidentId = process.env.INCIDENT_ID ?? process.argv[2];
if (!incidentId) {
	console.error('[brAInwav] Missing incident ID. Pass via INCIDENT_ID env or argv.');
	console.error('Usage: node incident-review.mjs INC-742 [--since="24 hours ago"]');
	process.exitCode = 1;
	process.exit();
}

// Parse optional flags
const args = process.argv.slice(3);
const since = args.find((a) => a.startsWith('--since='))?.split('=')[1] ?? '24 hours ago';
const outputJson = args.includes('--json');

const homeDir = process.env.HOME ?? process.env.USERPROFILE;
if (!homeDir) {
	console.error('[brAInwav] Unable to resolve HOME directory.');
	process.exitCode = 1;
	process.exit();
}

const govHome = process.env.GOV_HOME ?? path.join(homeDir, '.agentic-governance');

// Determine repo root
let repoRoot;
try {
	repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
} catch {
	repoRoot = process.cwd();
}

// Output directory (task-aware if TASK_SLUG provided)
const slug = process.env.TASK_SLUG;
let outDir;
if (slug) {
	const taskDir = path.join(govHome, 'tasks', slug);
	outDir = path.join(taskDir, 'logs', 'incident-review');
} else {
	outDir = path.join(govHome, 'logs', 'incident-review');
}
fs.mkdirSync(outDir, { recursive: true });

function now() {
	return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

function safeExec(command, fallback = '') {
	try {
		return execSync(command, { encoding: 'utf8', cwd: repoRoot, timeout: 30000 }).trim();
	} catch {
		return fallback;
	}
}

function getJournalLogs(servicePattern, sinceTime) {
	// Check if journalctl is available (Linux systems)
	const hasJournalctl = safeExec('which journalctl', '');
	if (!hasJournalctl) {
		return { available: false, logs: [], message: 'journalctl not available (non-Linux system)' };
	}

	// Check if service exists
	const serviceCheck = safeExec(
		`systemctl list-units --type=service --all 2>/dev/null | grep -q "brAInwav-${servicePattern}" && echo "found"`,
		''
	);

	if (!serviceCheck) {
		return { available: true, logs: [], message: `Service brAInwav-${servicePattern} not found` };
	}

	// Fetch logs
	const logs = safeExec(
		`journalctl -u brAInwav-${servicePattern} --since "${sinceTime}" --no-pager 2>/dev/null | tail -n 50`,
		''
	);

	return {
		available: true,
		logs: logs.split('\n').filter(Boolean),
		message: logs ? null : 'No logs in timeframe',
	};
}

function findRelatedRunbooks(incidentPattern) {
	// Search for runbooks matching the incident pattern
	const runbooksDir = path.join(repoRoot, 'brainwav', 'governance', 'runbooks');
	const docsRunbooks = path.join(repoRoot, 'runbooks');

	const results = [];

	// Try rg first
	const rgResults = safeExec(`rg --files -g "*${incidentPattern}*.md" ${runbooksDir} ${docsRunbooks} 2>/dev/null`, '');
	if (rgResults) {
		results.push(...rgResults.split('\n').filter(Boolean));
	}

	// Also search for mentions of the incident ID in runbook content
	const contentMatches = safeExec(
		`rg -l "${incidentPattern}" ${runbooksDir} ${docsRunbooks} 2>/dev/null | head -n 10`,
		''
	);
	if (contentMatches) {
		results.push(...contentMatches.split('\n').filter(Boolean));
	}

	// Deduplicate
	return [...new Set(results)];
}

function findRelatedLogs(incidentPattern) {
	// Search for log files matching the incident
	const logsDir = path.join(govHome, 'logs');
	const taskLogsDir = slug ? path.join(govHome, 'tasks', slug, 'logs') : null;

	const results = [];

	if (fs.existsSync(logsDir)) {
		const logs = safeExec(`find ${logsDir} -name "*${incidentPattern}*" -type f 2>/dev/null | head -n 10`, '');
		if (logs) results.push(...logs.split('\n').filter(Boolean));
	}

	if (taskLogsDir && fs.existsSync(taskLogsDir)) {
		const taskLogs = safeExec(`find ${taskLogsDir} -name "*${incidentPattern}*" -type f 2>/dev/null | head -n 10`, '');
		if (taskLogs) results.push(...taskLogs.split('\n').filter(Boolean));
	}

	return results;
}

function getRecentCommits(pattern, count = 5) {
	const log = safeExec(
		`git log --all --grep="${pattern}" --pretty=format:"%h|%s|%an|%ar" -${count} 2>/dev/null`,
		''
	);
	if (!log) return [];
	return log.split('\n').filter(Boolean).map((line) => {
		const [hash, subject, author, when] = line.split('|');
		return { hash, subject, author, when };
	});
}

async function main() {
	const timestamp = now();

	console.log(`[brAInwav] incident-review — analyzing: ${incidentId}`);
	console.log(`[brAInwav] Searching logs since: ${since}`);

	const journalLogs = getJournalLogs(incidentId, since);
	const runbooks = findRelatedRunbooks(incidentId);
	const relatedLogs = findRelatedLogs(incidentId);
	const relatedCommits = getRecentCommits(incidentId, 5);

	const review = {
		incident_id: incidentId,
		timestamp,
		since,
		evidence: {
			journal: journalLogs,
			runbooks,
			log_files: relatedLogs,
			related_commits: relatedCommits,
		},
		status: 'draft',
	};

	let output;
	if (outputJson) {
		output = JSON.stringify(review, null, 2);
	} else {
		output = `# brAInwav Incident Review: ${incidentId}

**Generated:** ${timestamp}  
**Log Period:** since ${since}

---

## Summary

| Field | Value |
|-------|-------|
| Incident ID | \`${incidentId}\` |
| Status | Draft |
| Impacted Services | _[Fill in]_ |
| Duration | _[Fill in]_ |
| Severity | _[Fill in]_ |

## Timeline (UTC)

| Time | Event |
|------|-------|
| _HH:MM_ | _Initial detection_ |
| _HH:MM_ | _Investigation started_ |
| _HH:MM_ | _Root cause identified_ |
| _HH:MM_ | _Mitigation applied_ |
| _HH:MM_ | _Resolution confirmed_ |

---

## Evidence

### System Logs

${
	journalLogs.available
		? journalLogs.logs.length > 0
			? '```\n' + journalLogs.logs.join('\n') + '\n```'
			: `_${journalLogs.message}_`
		: `_${journalLogs.message}_`
}

### Related Runbooks

${runbooks.length > 0 ? runbooks.map((r) => `- [${path.basename(r)}](${r})`).join('\n') : '_No matching runbooks found_'}

### Log Files

${relatedLogs.length > 0 ? relatedLogs.map((l) => `- \`${l}\``).join('\n') : '_No matching log files found_'}

### Related Commits

${
	relatedCommits.length > 0
		? relatedCommits.map((c) => `- \`${c.hash}\` ${c.subject} — ${c.author}, ${c.when}`).join('\n')
		: '_No related commits found_'
}

---

## Root Cause Analysis

### What Happened
_[Describe the incident]_

### Why It Happened
_[5 Whys or similar analysis]_

### Contributing Factors
- _[Factor 1]_
- _[Factor 2]_

---

## Remediation

### Completed Actions
- [ ] _[Action 1]_
- [ ] _[Action 2]_

### Follow-up Tasks
- [ ] _[Task 1]_ — Owner: _[Name]_ — Due: _[Date]_
- [ ] _[Task 2]_ — Owner: _[Name]_ — Due: _[Date]_

### Preventative Measures
- [ ] _[Measure 1]_
- [ ] _[Measure 2]_

---

## Lessons Learned

1. _[Lesson 1]_
2. _[Lesson 2]_

---

*Generated by /incident-review at ${timestamp}*
`;
	}

	console.log(output);

	// Write files
	const safeIncidentId = incidentId.replace(/[^a-zA-Z0-9-_]/g, '_');
	const logFile = path.join(outDir, `incident-${safeIncidentId}-${timestamp.split('T')[0]}.md`);
	const jsonFile = path.join(outDir, `incident-${safeIncidentId}-${timestamp.split('T')[0]}.json`);

	fs.writeFileSync(logFile, output.replace(/^\[brAInwav\].*\n/gm, ''));
	fs.writeFileSync(jsonFile, JSON.stringify(review, null, 2));

	console.log(`[brAInwav] incident-review written: ${logFile}`);

	return review;
}

main();
