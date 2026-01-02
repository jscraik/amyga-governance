#!/usr/bin/env node
/**
 * @fileoverview Bounded agent loop runner.
 * @license Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync, execSync } from 'node:child_process';

const DEFAULT_CONFIG = '.agentic-governance/loop/config.json';

function readJson(filePath) {
	if (!fs.existsSync(filePath)) return null;
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch {
		return null;
	}
}

function normalizeArray(value) {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}

function globToRegExp(glob) {
	let pattern = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
	pattern = pattern.replace(/\*\*/g, '<<<GLOBSTAR>>>');
	pattern = pattern.replace(/\*/g, '[^/]*');
	pattern = pattern.replace(/\?/g, '.');
	pattern = pattern.replace(/<<<GLOBSTAR>>>/g, '.*');
	return new RegExp(`^${pattern}$`);
}

function matchesAllowlist(filePath, allowlist) {
	if (allowlist.length === 0) return false;
	const normalized = filePath.replace(/\\/g, '/');
	return allowlist.some((pattern) => globToRegExp(pattern).test(normalized));
}

function getGitRoot(cwd) {
	try {
		return execSync('git rev-parse --show-toplevel', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return null;
	}
}

function getBranch(cwd) {
	try {
		return execSync('git rev-parse --abbrev-ref HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return null;
	}
}

function ensureCleanTree(cwd) {
	const status = execSync('git status --porcelain', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
		.toString()
		.trim();
	return status.length === 0;
}

function listChangedFiles(cwd) {
	try {
		const output = execSync('git diff --name-only', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
		if (!output) return [];
		return output.split('\n').filter(Boolean);
	} catch {
		return [];
	}
}

function renderPrompt(template, context) {
	return template
		.replace(/{{slug}}/g, context.slug)
		.replace(/{{iteration}}/g, String(context.iteration))
		.replace(/{{maxIterations}}/g, String(context.maxIterations))
		.replace(/{{allowlist}}/g, context.allowlist.join(', ') || 'none')
		.replace(/{{verifyCommands}}/g, context.verifyCommands.join('\n'));
}

function loadPrompt(templatePath) {
	if (!fs.existsSync(templatePath)) return null;
	return fs.readFileSync(templatePath, 'utf8');
}

function runCommand(command, cwd, input) {
	const result = spawnSync(command, {
		cwd,
		shell: true,
		input,
		stdio: ['pipe', 'inherit', 'inherit']
	});
	return result.status ?? 1;
}

function ensureDir(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function sleepMs(ms) {
	if (!ms || ms <= 0) return;
	const buffer = new SharedArrayBuffer(4);
	const view = new Int32Array(buffer);
	Atomics.wait(view, 0, 0, ms);
}

function commitChanges(root, message) {
	try {
		execSync('git add -A', { cwd: root, stdio: 'inherit' });
		execSync(`git commit -m "${message}"`, { cwd: root, stdio: 'inherit' });
		return true;
	} catch {
		return false;
	}
}

function writeIterationReport(reportDir, slug, iteration, payload) {
	const filename = `iteration-${slug}-${String(iteration).padStart(2, '0')}.json`;
	const outputPath = path.join(reportDir, filename);
	fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function runAgentLoop({ slug, configPath = DEFAULT_CONFIG, cwd = process.cwd() }) {
	if (!slug) {
		console.error('[brAInwav] --slug <slug> is required.');
		return 2;
	}

	const config = readJson(configPath);
	if (!config) {
		console.error(`[brAInwav] config not found or invalid: ${configPath}`);
		return 2;
	}

	const root = getGitRoot(cwd) || cwd;
	const runner = config.runner?.command || 'codex';
	const runnerArgs = normalizeArray(config.runner?.args);
	const promptFile = config.promptFile || '.agentic-governance/loop/PROMPT.md';
	const reportDir = config.reportDir || '.agentic-governance/reports/loop';
	const stopFile = config.stopFile || '.agentic-governance/STOP';
	const allowlist = normalizeArray(config.allowlist);
	const verifyCommands = normalizeArray(config.verify?.commands);
	const budgets = config.budgets || {};
	const maxIterations = Number(budgets.maxIterations ?? 1);
	const maxMinutes = Number(budgets.maxMinutes ?? 10);
	const maxFailures = Number(budgets.maxFailures ?? 1);
	const branchPrefix = config.branch?.prefix || 'bw/loop/';
	const branchEnforced = config.branch?.enforced === true;
	const noProgress = config.noProgress || {};
	const maxNoDiff = Number(noProgress.maxIterationsWithoutDiff ?? 0);
	const maxRepeatedFailure = Number(noProgress.maxRepeatedFailure ?? 0);
	const backoffMs = Number(config.backoffMs ?? 0);
	const diffPolicy = config.diffPolicy || {};
	const requireDiffEachIteration = diffPolicy.requireDiffEachIteration === true;
	const enforceAllowlist = diffPolicy.enforceAllowlist !== false;
	const commitPolicy = config.commitPolicy || {};
	const commitEnabled = commitPolicy.enabled === true;
	const commitTemplate = commitPolicy.messageTemplate || 'chore(loop): {slug} iter {iteration}';

	if (verifyCommands.length === 0) {
		console.error('[brAInwav] verify.commands must contain at least one command.');
		return 2;
	}

	if (branchEnforced) {
		const current = getBranch(root);
		const expected = `${branchPrefix}${slug}`;
		if (!current || current === 'HEAD') {
			console.error('[brAInwav] unable to determine git branch.');
			return 2;
		}
		if (!ensureCleanTree(root)) {
			console.error('[brAInwav] working tree must be clean before starting the loop.');
			return 2;
		}
		if (!current.startsWith(branchPrefix)) {
			try {
				execSync(`git checkout -b ${expected}`, { cwd: root, stdio: 'inherit' });
			} catch (error) {
				console.error(`[brAInwav] failed to create loop branch: ${error.message}`);
				return 2;
			}
		} else if (current !== expected) {
			console.error(`[brAInwav] loop branch must be ${expected} (currently ${current}).`);
			return 2;
		}
	}

	const promptTemplate = loadPrompt(path.join(root, promptFile));
	if (!promptTemplate) {
		console.error(`[brAInwav] prompt file missing: ${promptFile}`);
		return 2;
	}

	ensureDir(path.join(root, reportDir));
	const start = Date.now();
	const report = {
		schema: 'brainwav.governance.agent-loop.v1',
		meta: {
			slug,
			root,
			config: configPath,
			started_at: new Date(start).toISOString()
		},
		budgets: {
			maxIterations,
			maxMinutes,
			maxFailures
		},
		iterations: [],
		status: 'running'
	};

	let failures = 0;
	let noDiffCount = 0;
	let repeatedFailureCount = 0;
	let lastFailureKey = null;

	for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
		if (fs.existsSync(path.join(root, stopFile))) {
			report.status = 'stopped';
			report.reason = 'stop file detected';
			break;
		}
		const elapsedMinutes = (Date.now() - start) / 60000;
		if (elapsedMinutes > maxMinutes) {
			report.status = 'stopped';
			report.reason = 'time budget exceeded';
			break;
		}

		const prompt = renderPrompt(promptTemplate, {
			slug,
			iteration,
			maxIterations,
			allowlist,
			verifyCommands
		});
		if (/{{[^}]+}}/.test(prompt)) {
			console.error('[brAInwav] prompt placeholders unresolved.');
			return 2;
		}
		const runnerCmd = [runner, ...runnerArgs].join(' ').trim();
		const runnerStatus = runCommand(runnerCmd, root, prompt);
		const changed = listChangedFiles(root);
		const outside = changed.filter((filePath) => !matchesAllowlist(filePath, allowlist));
		if (enforceAllowlist && outside.length > 0) {
			const payload = {
				iteration,
				runner_status: runnerStatus,
				verify: [],
				changed_files: changed,
				status: 'failed',
				reason: `changes outside allowlist: ${outside.join(', ')}`
			};
			writeIterationReport(path.join(root, reportDir), slug, iteration, payload);
			report.iterations.push(payload);
			report.status = 'failed';
			report.reason = 'allowlist violation';
			break;
		}

		if (changed.length === 0) {
			noDiffCount += 1;
		} else {
			noDiffCount = 0;
		}
		if (requireDiffEachIteration && changed.length === 0) {
			const payload = {
				iteration,
				runner_status: runnerStatus,
				verify: [],
				changed_files: changed,
				status: 'blocked',
				reason: 'no changes produced'
			};
			writeIterationReport(path.join(root, reportDir), slug, iteration, payload);
			report.iterations.push(payload);
			report.status = 'failed';
			report.reason = 'no-progress';
			break;
		}
		if (maxNoDiff > 0 && noDiffCount >= maxNoDiff) {
			const payload = {
				iteration,
				runner_status: runnerStatus,
				verify: [],
				changed_files: changed,
				status: 'blocked',
				reason: 'no-progress threshold exceeded'
			};
			writeIterationReport(path.join(root, reportDir), slug, iteration, payload);
			report.iterations.push(payload);
			report.status = 'failed';
			report.reason = 'no-progress';
			break;
		}

		const verifyResults = [];
		let verifyFailed = false;
		verifyCommands.forEach((command) => {
			const status = runCommand(command, root);
			verifyResults.push({ command, status });
			if (status !== 0) verifyFailed = true;
		});
		if (runnerStatus !== 0 || verifyFailed) {
			failures += 1;
			const failureKey = runnerStatus !== 0 ? 'runner' : 'verify';
			if (failureKey === lastFailureKey) {
				repeatedFailureCount += 1;
			} else {
				repeatedFailureCount = 1;
				lastFailureKey = failureKey;
			}
		} else {
			repeatedFailureCount = 0;
			lastFailureKey = null;
		}

		const iterationPayload = {
			iteration,
			runner_status: runnerStatus,
			verify: verifyResults,
			changed_files: changed,
			status: runnerStatus === 0 && !verifyFailed ? 'pass' : 'fail'
		};
		writeIterationReport(path.join(root, reportDir), slug, iteration, iterationPayload);
		report.iterations.push(iterationPayload);

		if (runnerStatus === 0 && !verifyFailed && commitEnabled && changed.length > 0) {
			const message = commitTemplate
				.replace('{slug}', slug)
				.replace('{iteration}', String(iteration));
			commitChanges(root, message);
		}

		if (failures >= maxFailures) {
			report.status = 'failed';
			report.reason = 'failure budget exceeded';
			break;
		}
		if (maxRepeatedFailure > 0 && repeatedFailureCount >= maxRepeatedFailure) {
			report.status = 'failed';
			report.reason = 'repeated failure threshold exceeded';
			break;
		}
		if (runnerStatus !== 0 || verifyFailed || changed.length === 0) {
			sleepMs(backoffMs);
		}
	}

	if (report.status === 'running') {
		report.status = 'completed';
	}
	report.meta.completed_at = new Date().toISOString();
	const reportPath = path.join(
		root,
		reportDir,
		`agent-loop-${slug}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
	);
	fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

	if (report.status === 'failed') {
		return 1;
	}
	return 0;
}

function main() {
	const args = process.argv.slice(2);
	const slugIndex = args.indexOf('--slug');
	const configIndex = args.indexOf('--config');
	const slug = slugIndex >= 0 ? args[slugIndex + 1] : null;
	const configPath = configIndex >= 0 ? args[configIndex + 1] : DEFAULT_CONFIG;
	const exitCode = runAgentLoop({ slug, configPath, cwd: process.cwd() });
	process.exit(exitCode);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('agent-loop.mjs')) {
	main();
}
