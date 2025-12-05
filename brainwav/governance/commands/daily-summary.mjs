#!/usr/bin/env node
// brainwav/governance/commands/daily-summary.mjs
// Generate daily project summary for stand-ups
// Full spec: brainwav/governance/commands/daily-summary.md

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const focus = process.env.DAILY_FOCUS ?? process.argv[2] ?? '';
const outputJson = process.argv.includes('--json');

const homeDir = process.env.HOME ?? process.env.USERPROFILE;
if (!homeDir) {
	console.error('[brAInwav] Unable to resolve HOME directory.');
	process.exitCode = 1;
	process.exit();
}

const govHome = process.env.GOV_HOME ?? path.join(homeDir, '.agentic-governance');

// Determine repo root (try git, fallback to cwd)
let repoRoot;
try {
	repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
} catch {
	repoRoot = process.cwd();
	console.warn('[brAInwav] Not in a git repository, using current directory');
}

// Output directory (task-aware if TASK_SLUG provided)
const slug = process.env.TASK_SLUG;
let outDir;
if (slug) {
	const taskDir = path.join(govHome, 'tasks', slug);
	outDir = path.join(taskDir, 'logs', 'daily-summary');
} else {
	outDir = path.join(govHome, 'logs', 'daily-summary');
}
fs.mkdirSync(outDir, { recursive: true });

function now() {
	return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

function safeExec(command, fallback = '') {
	try {
		return execSync(command, { encoding: 'utf8', cwd: repoRoot, timeout: 10000 }).trim();
	} catch {
		console.warn(`[brAInwav] Command failed: ${command}`);
		return fallback;
	}
}

function getGitStatus() {
	const status = safeExec('git status --short', 'No git status available');
	const lines = status.split('\n').filter(Boolean);
	return {
		raw: status,
		modified: lines.filter((l) => l.startsWith(' M') || l.startsWith('M ')).length,
		added: lines.filter((l) => l.startsWith('A ') || l.startsWith('??')).length,
		deleted: lines.filter((l) => l.startsWith(' D') || l.startsWith('D ')).length,
		total: lines.length,
	};
}

function getRecentCommits(count = 5) {
	const log = safeExec(`git log --pretty=format:"%h|%s|%an|%ar" -${count}`, '');
	if (!log) return [];
	return log.split('\n').map((line) => {
		const [hash, subject, author, when] = line.split('|');
		return { hash, subject, author, when };
	});
}

function getTodaysCommits() {
	const today = new Date().toISOString().split('T')[0];
	const log = safeExec(`git log --since="${today} 00:00" --pretty=format:"%h|%s|%an" 2>/dev/null`, '');
	if (!log) return [];
	return log.split('\n').filter(Boolean).map((line) => {
		const [hash, subject, author] = line.split('|');
		return { hash, subject, author };
	});
}

function getRecentDocs(count = 5) {
	// Find recently modified markdown files
	const docs = safeExec(`find docs -name "*.md" -type f 2>/dev/null | head -n ${count}`, '');
	return docs.split('\n').filter(Boolean);
}

function getBranchInfo() {
	const branch = safeExec('git branch --show-current', 'unknown');
	const ahead = safeExec('git rev-list --count @{upstream}..HEAD 2>/dev/null', '0');
	const behind = safeExec('git rev-list --count HEAD..@{upstream} 2>/dev/null', '0');
	return { branch, ahead: parseInt(ahead, 10), behind: parseInt(behind, 10) };
}

async function main() {
	const timestamp = now();
	const date = new Date().toLocaleDateString('en-GB', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	console.log(`[brAInwav] daily-summary — generating for ${date}`);
	if (focus) console.log(`[brAInwav] Focus: ${focus}`);

	const gitStatus = getGitStatus();
	const recentCommits = getRecentCommits(5);
	const todaysCommits = getTodaysCommits();
	const recentDocs = getRecentDocs(5);
	const branchInfo = getBranchInfo();

	const summary = {
		date,
		timestamp,
		focus: focus || null,
		repository: path.basename(repoRoot),
		branch: branchInfo,
		status: gitStatus,
		today: {
			commits: todaysCommits,
			commit_count: todaysCommits.length,
		},
		recent_commits: recentCommits,
		recent_docs: recentDocs,
	};

	let output;
	if (outputJson) {
		output = JSON.stringify(summary, null, 2);
	} else {
		output = `# brAInwav Daily Summary

**Date:** ${date}  
**Repository:** ${summary.repository}  
**Branch:** \`${branchInfo.branch}\`${branchInfo.ahead > 0 ? ` (${branchInfo.ahead} ahead)` : ''}${branchInfo.behind > 0 ? ` (${branchInfo.behind} behind)` : ''}  
${focus ? `**Focus:** ${focus}\n` : ''}
## Today's Activity

${
	todaysCommits.length > 0
		? todaysCommits.map((c) => `- \`${c.hash}\` ${c.subject} (${c.author})`).join('\n')
		: '_No commits today yet_'
}

## Working Tree Status

| Metric | Count |
|--------|-------|
| Modified | ${gitStatus.modified} |
| Added/Untracked | ${gitStatus.added} |
| Deleted | ${gitStatus.deleted} |
| **Total Changes** | ${gitStatus.total} |

${gitStatus.total > 0 ? '```\n' + gitStatus.raw + '\n```' : ''}

## Recent Commits

${recentCommits.map((c) => `- \`${c.hash}\` ${c.subject} — ${c.author}, ${c.when}`).join('\n') || '_No recent commits_'}

## Recent Documentation

${recentDocs.map((d) => `- ${d}`).join('\n') || '_No documentation files found_'}

---

## Stand-up Notes

**What was accomplished:**
- _[Fill in]_

**What's planned today:**
- _[Fill in]_

**Blockers/Risks:**
- _[Fill in]_

---
*Generated by /daily-summary at ${timestamp}*
`;
	}

	console.log(output);

	// Write log
	const dateSlug = timestamp.split('T')[0];
	const logFile = path.join(outDir, `daily-summary-${dateSlug}.md`);
	const jsonFile = path.join(outDir, `daily-summary-${dateSlug}.json`);

	fs.writeFileSync(logFile, output.replace(/^\[brAInwav\].*\n/gm, ''));
	fs.writeFileSync(jsonFile, JSON.stringify(summary, null, 2));

	console.log(`[brAInwav] daily-summary written: ${logFile}`);

	return summary;
}

main();
