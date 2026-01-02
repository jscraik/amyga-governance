#!/usr/bin/env node
/**
 * @fileoverview Composite readiness check: verifies governance files and required tooling.
 * @module scripts/readiness-check
 * @license Apache-2.0
 *
 * Validates that all critical governance files exist and required CLI tools are installed.
 * This is the primary pre-flight check before governance operations.
 *
 * @example
 * // Run via npm script
 * pnpm readiness:check
 *
 * @example
 * // Run directly
 * node scripts/readiness-check.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { formatPointerHint, resolveGovernancePaths } from './governance-paths.mjs';
import { runToolingChecks } from './ensure-tools.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/**
 * Verify a required file exists at the specified path.
 * @param {string} filePath - File path to check.
 * @param {string} label - Human-readable label for error messages.
 * @returns {string} Absolute path to the file.
 * @throws {Error} When the file does not exist.
 */
function requireFileAbsolute(filePath, label) {
	const p = filePath;
	if (!fs.existsSync(p)) {
		throw new Error(`${label} missing at ${p}`);
	}
	return p;
}

/**
 * Run readiness checks against a target root.
 * @param {string} targetRoot - Repository root.
 * @param {string} profile - Profile name.
 * @returns {{ok: boolean, checks: Array<object>, failures: string[], hint: string}} Result summary.
 */
export function runReadinessCheck(targetRoot = repoRoot, profile = 'delivery') {
	const checks = [];
	const failures = [];
	const { govRoot, indexPath, agentsPath, pointerPath, packageRoot } =
		resolveGovernancePaths(targetRoot);
	const hint = formatPointerHint(pointerPath, packageRoot);

	const requiredFiles = [
		{ id: 'file.agents', label: 'AGENTS.md (canonical)', path: agentsPath },
		{ id: 'file.index', label: 'governance-index.json', path: indexPath },
		{
			id: 'file.charter',
			label: 'AGENT_CHARTER.md',
			path: path.join(govRoot, '00-core', 'AGENT_CHARTER.md')
		},
		{
			id: 'file.workflow',
			label: 'agentic-coding-workflow.md',
			path: path.join(govRoot, '10-flow', 'agentic-coding-workflow.md')
		},
		{
			id: 'file.checklists',
			label: 'checklists.md',
			path: path.join(govRoot, '20-checklists', 'checklists.md')
		}
	];

	requiredFiles.forEach((entry) => {
		try {
			requireFileAbsolute(entry.path, entry.label);
			checks.push({
				id: entry.id,
				severity: 'info',
				category: 'policy',
				status: 'pass',
				message: `${entry.label} present`
			});
		} catch (error) {
			failures.push(error.message);
			checks.push({
				id: entry.id,
				severity: 'high',
				category: 'policy',
				status: 'fail',
				message: error.message
			});
		}
	});

	const tooling = runToolingChecks({ profile, targetRoot });
	checks.push(...tooling.checks);
	if (!tooling.ok) {
		failures.push('toolchain checks failed');
	}

	return { ok: failures.length === 0, checks, failures, hint };
}

/**
 * CLI entry point for readiness check.
 * @returns {void} No return value.
 */
function parseProfileArg() {
	const args = process.argv.slice(2);
	const index = args.indexOf('--profile');
	if (index !== -1 && args[index + 1]) return args[index + 1];
	return null;
}

/**
 * Normalize legacy profile names to current equivalents.
 * @param {string} profile - Profile name.
 * @returns {string} Normalized profile.
 */
function normalizeProfile(profile) {
	if (profile === 'core') return 'delivery';
	if (profile === 'full') return 'release';
	return profile;
}

/**
 * CLI entry point for readiness check.
 * @returns {void} No return value.
 */
function main() {
	try {
		const profileArg = parseProfileArg();
		const profileEnv = process.env.GOVERNANCE_PROFILE || process.env.BRAINWAV_PROFILE;
		const profile = normalizeProfile(profileArg || profileEnv || 'delivery');
		const result = runReadinessCheck(repoRoot, profile);
		if (!result.ok) {
			throw new Error(result.failures.join('; '));
		}
		console.log('[brAInwav] readiness:check passed. Governance files present and tools verified.');
		if (result.hint) console.log(`[brAInwav] ${result.hint}`);
	} catch (error) {
		console.error(`[brAInwav] readiness:check failed: ${error.message}`);
		process.exitCode = 1;
	}
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('readiness-check.mjs')) {
	main();
}

export default main;
