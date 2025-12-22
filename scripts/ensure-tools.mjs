#!/usr/bin/env node
/**
 * @fileoverview Verify required tooling is present for the governance framework.
 * @module scripts/ensure-tools
 * @license Apache-2.0
 *
 * Exit non-zero when any required CLI or engine version is missing or too low.
 * This script checks:
 * - Node.js >= 24.11.0
 * - pnpm >= 10.19.0
 * - Required CLIs: rg, fd, jq, semgrep, gitleaks, trivy, cosign, osv-scanner, markdownlint-cli2
 *
 * @example
 * // Run via npm script
 * pnpm ensure:tools
 *
 * @example
 * // Run directly
 * node scripts/ensure-tools.mjs
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

/**
 * Required tools with their purpose and installation instructions.
 * @type {Array<{name: string, reason: string, install: string}>}
 */
const tools = [
	{ name: 'rg', reason: 'fast search (ripgrep)', install: 'brew install ripgrep' },
	{ name: 'fd', reason: 'fast file find', install: 'brew install fd' },
	{ name: 'jq', reason: 'JSON processor', install: 'brew install jq' },
	{ name: 'semgrep', reason: 'SAST', install: 'brew install semgrep' },
	{ name: 'gitleaks', reason: 'secret scanning', install: 'brew install gitleaks' },
	{ name: 'trivy', reason: 'container/deps scan', install: 'brew install trivy' },
	{ name: 'cosign', reason: 'artifact signing', install: 'brew install cosign' },
	{ name: 'osv-scanner', reason: 'supply chain audit', install: 'brew install osv-scanner' },
	{ name: 'markdownlint-cli2', reason: 'docs lint', install: 'npm i -g markdownlint-cli2' }
];

/**
 * Check if a command exists in the system PATH.
 * @param {string} cmd - The command to check.
 * @returns {boolean} True if the command is available.
 */
function check(cmd) {
	const res = spawnSync('bash', ['-lc', `command -v ${cmd}`], { stdio: 'ignore' });
	return res.status === 0;
}

/**
 * Check if a command meets the minimum version requirement.
 * @param {string} command - The command to check version for.
 * @param {string} min - The minimum required version (e.g., '24.11.0').
 * @returns {{ok: boolean, version: string}} Object with ok status and detected version.
 */
function checkVersion(command, min) {
	const res = spawnSync(command, ['-v'], { encoding: 'utf8' });
	if (res.status !== 0) return { ok: false, version: 'missing' };
	const version = res.stdout.trim();
	const ok = compareVersions(version, min) >= 0;
	return { ok, version };
}

/**
 * Compare two semantic version strings.
 * @param {string} actual - The actual version (e.g., 'v24.11.0').
 * @param {string} required - The required version (e.g., '24.11.0').
 * @returns {number} 1 if actual > required, -1 if actual < required, 0 if equal.
 */
function compareVersions(actual, required) {
	const a = actual.replace(/^v/, '').split('.').map(Number);
	const b = required.replace(/^v/, '').split('.').map(Number);
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		const ai = a[i] ?? 0;
		const bi = b[i] ?? 0;
		if (ai > bi) return 1;
		if (ai < bi) return -1;
	}
	return 0;
}

/**
 * Main entry point. Validates all tools and engine versions.
 * Sets process.exitCode = 1 if any check fails.
 * @returns {void}
 */
function main() {
	let ok = true;

	const nodeCheck = checkVersion(process.argv[0], '24.11.0', 'node');
	if (!nodeCheck.ok) {
		console.error(`[brAInwav] Node version too low: ${nodeCheck.version} (need >=24.11.0)`);
		ok = false;
	}

	const pnpmCheck = checkVersion('pnpm', '10.19.0', 'pnpm');
	if (!pnpmCheck.ok) {
		console.error(`[brAInwav] pnpm missing or too low: ${pnpmCheck.version} (need >=10.19.0) -> npm i -g pnpm@10.19.0`);
		ok = false;
	}

	const missing = tools.filter((t) => !check(t.name));
	if (missing.length) {
		ok = false;
		console.error('[brAInwav] Missing required tools:');
		for (const m of missing) {
			console.error(`- ${m.name}: ${m.reason} (install: ${m.install})`);
		}
	}

	if (!ok) {
		process.exitCode = 1;
		return;
	}

	console.log('[brAInwav] ensure:tools passed — all required CLIs detected.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('ensure-tools.mjs')) {
	main();
}

export default main;
